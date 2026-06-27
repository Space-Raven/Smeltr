#!/usr/bin/env python3
"""
End-to-end pjorg LoRA training pipeline.

Steps (run individually or chained):
  generate  — Generate images via ComfyUI API
  filter    — Quality-filter with Claude vision
  organize  — Copy approved images into kohya_ss dataset structure
  train     — Run kohya_ss LoRA training
  report    — Show loss curve from the last training run

Usage:
    python pipeline.py                                        # all steps
    python pipeline.py --steps generate,filter               # subset
    python pipeline.py --steps train                         # just train
    python pipeline.py --count 50                            # generate 50 images
    python pipeline.py --kohya-dir "C:/kohya_ss"            # kohya location
    python pipeline.py --steps report                        # plot last loss curve
"""

import argparse
import os
import re
import shutil
import subprocess
import sys
import time
import json
from pathlib import Path

# ---------------------------------------------------------------------------
# Project layout
# ---------------------------------------------------------------------------

SCRIPT_DIR   = Path(__file__).parent
TRAINING_RAW = SCRIPT_DIR / "training-images"          # raw generated PNGs
APPROVED_DIR = TRAINING_RAW / "approved"               # passed filter
REJECTED_DIR = TRAINING_RAW / "rejected"               # failed filter
DATASET_DIR  = SCRIPT_DIR / "dataset" / "20_pjorg cat" # kohya_ss format
LORA_OUT_DIR = SCRIPT_DIR / "lora-output"              # trained weights
LOG_PATH     = LORA_OUT_DIR / "training.log"

# Caption written next to every training image — trigger word first, then descriptors
CAPTION = (
    "pjorg cat, tortoiseshell cat, dark grey fur, orange patches, "
    "teal eyes, white chin, bipedal cat, steampunk brass goggles, "
    "anime style, chibi, studio ghibli"
)

# ---------------------------------------------------------------------------
# Kohya_ss auto-detection
# ---------------------------------------------------------------------------

KOHYA_CANDIDATE_PATHS = [
    Path(r"C:\kohya_ss"),
    Path(r"C:\kohya_ss_25"),
    Path.home() / "kohya_ss",
    Path.home() / "kohya_ss_25",
    Path.home() / "Downloads" / "kohya_ss-25.2.1",
    Path.home() / "Desktop" / "kohya_ss",
]


def find_kohya(hint: Path | None = None) -> Path | None:
    candidates = ([hint] if hint else []) + KOHYA_CANDIDATE_PATHS
    for p in candidates:
        if p and p.is_dir():
            # kohya_ss root should contain train_network.py
            if (p / "train_network.py").exists():
                return p
            # Some setups nest it under sd-scripts/
            if (p / "sd-scripts" / "train_network.py").exists():
                return p / "sd-scripts"
    return None

# ---------------------------------------------------------------------------
# Step 1: Generate
# ---------------------------------------------------------------------------

def step_generate(args):
    print("\n═══ STEP 1: GENERATE ═══\n")
    # Import from sibling module
    sys.path.insert(0, str(SCRIPT_DIR))
    try:
        import generate_training_images as gen
    except ImportError as e:
        print(f"ERROR: Could not import generate_training_images.py: {e}")
        sys.exit(1)

    # Auto-detect port
    host = "127.0.0.1"
    port = None
    for candidate in [8188, 8189, 8190]:
        if gen.check_running(host, candidate):
            port = candidate
            break
    if port is None:
        print("ERROR: ComfyUI not reachable. Open ComfyUI Desktop and try again.")
        sys.exit(1)
    print(f"ComfyUI at {host}:{port}")

    TRAINING_RAW.mkdir(parents=True, exist_ok=True)
    existing = sorted(TRAINING_RAW.glob("pjorg_????.png"))
    next_idx = int(existing[-1].stem.split("_")[1]) + 1 if existing else 1
    print(f"Generating {args.count} images (starting at pjorg_{next_idx:04d}.png)")

    import uuid
    client_id = str(uuid.uuid4())
    base_seed = int(time.time()) % (2**31)
    saved = 0

    for i in range(args.count):
        seed = (base_seed + i) % (2**32)
        print(f"[{i+1}/{args.count}] seed={seed}  ", end="", flush=True)

        try:
            workflow = gen.build_workflow(seed, steps=args.steps, cfg=args.cfg)
            prompt_id = gen.queue_prompt(host, port, workflow, client_id)
            result = gen.wait_for_completion(host, port, prompt_id)

            if "error" in result:
                print(f"ERROR: {result['error']}")
                continue

            for node_output in result.get("outputs", {}).values():
                for img_info in node_output.get("images", []):
                    data = gen.fetch_image(
                        host, port,
                        img_info["filename"],
                        img_info.get("subfolder", ""),
                        img_info.get("type", "output"),
                    )
                    out = TRAINING_RAW / f"pjorg_{next_idx:04d}.png"
                    out.write_bytes(data)
                    print(f"→ {out.name} ({len(data)//1024} KB)")
                    next_idx += 1
                    saved += 1

        except KeyboardInterrupt:
            print(f"\nInterrupted after {saved} images.")
            break
        except Exception as e:
            print(f"ERROR: {e}")

    print(f"\nGenerated {saved} images → {TRAINING_RAW}")

# ---------------------------------------------------------------------------
# Step 2: Filter
# ---------------------------------------------------------------------------

def step_filter(args):
    print("\n═══ STEP 2: FILTER ═══\n")
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("ERROR: ANTHROPIC_API_KEY not set.")
        print("  set ANTHROPIC_API_KEY=sk-ant-...")
        sys.exit(1)
    try:
        import anthropic
    except ImportError:
        print("ERROR: pip install anthropic")
        sys.exit(1)

    sys.path.insert(0, str(SCRIPT_DIR))
    import filter_training_images as filt

    client = anthropic.Anthropic(api_key=api_key)
    images = sorted(TRAINING_RAW.glob("pjorg_????.png"))
    if not images:
        print(f"No images found in {TRAINING_RAW}. Run 'generate' first.")
        sys.exit(1)

    APPROVED_DIR.mkdir(parents=True, exist_ok=True)
    REJECTED_DIR.mkdir(parents=True, exist_ok=True)
    print(f"Evaluating {len(images)} images...\n")

    passed, rejected, errors = 0, 0, 0
    rejection_log = []

    for i, img_path in enumerate(images, 1):
        print(f"[{i:3d}/{len(images)}] {img_path.name}  ", end="", flush=True)
        try:
            r = filt.evaluate_image(client, img_path)
            verdict = r.get("pass", False)
            conf    = r.get("confidence", 1.0)
            second  = r.get("second_character", False)
            issues  = r.get("issues", [])
            notes   = r.get("notes", "")

            if second:
                verdict = False
                if not any("second" in x.lower() for x in issues):
                    issues.insert(0, "second character detected")
            if verdict and conf < args.threshold:
                verdict = False
                issues.append(f"confidence {conf:.2f} < {args.threshold}")

            icon = "✓" if verdict else "✗"
            tag  = "PASS  " if verdict else "REJECT"
            print(f"{icon} {tag}  conf={conf:.2f}  {notes[:55]}")
            for iss in issues:
                print(f"          ↳ {iss}")

            dest = APPROVED_DIR if verdict else REJECTED_DIR
            shutil.copy2(img_path, dest / img_path.name)

            if verdict:
                passed += 1
            else:
                rejected += 1
                rejection_log.append(f"{img_path.name}: {'; '.join(issues)}")

        except Exception as e:
            print(f"  ERROR: {e}")
            errors += 1

    if rejection_log:
        (REJECTED_DIR / "rejection_log.txt").write_text("\n".join(rejection_log))

    print(f"\n  Approved: {passed}  Rejected: {rejected}  Errors: {errors}")
    if passed == 0:
        print("WARNING: No images passed. Check your prompts or lower --threshold.")

# ---------------------------------------------------------------------------
# Step 3: Organize
# ---------------------------------------------------------------------------

def step_organize(_args):
    print("\n═══ STEP 3: ORGANIZE ═══\n")

    source = APPROVED_DIR
    if not source.exists() or not list(source.glob("*.png")):
        # Fall back: use raw images if no filter was run
        source = TRAINING_RAW
        images = sorted(source.glob("pjorg_????.png"))
        if not images:
            print(f"No approved images found. Run 'generate' and 'filter' first.")
            sys.exit(1)
        print(f"WARNING: approved/ folder empty, using raw training-images/")
    else:
        images = sorted(source.glob("pjorg_????.png"))

    DATASET_DIR.mkdir(parents=True, exist_ok=True)
    LORA_OUT_DIR.mkdir(parents=True, exist_ok=True)

    copied = 0
    for img in images:
        dest_img = DATASET_DIR / img.name
        dest_txt = DATASET_DIR / img.with_suffix(".txt").name
        shutil.copy2(img, dest_img)
        dest_txt.write_text(CAPTION, encoding="utf-8")
        copied += 1

    print(f"Copied {copied} images + captions to:\n  {DATASET_DIR}")

    # Write kohya_ss dataset TOML
    toml_path = SCRIPT_DIR / "dataset.toml"
    toml_content = f"""\
[general]
shuffle_caption = true
caption_extension = ".txt"
keep_tokens = 1

[[datasets]]
resolution = 512
batch_size = 1

  [[datasets.subsets]]
  image_dir = "{DATASET_DIR.as_posix()}"
  class_tokens = "pjorg cat"
  num_repeats = 20
"""
    toml_path.write_text(toml_content, encoding="utf-8")
    print(f"Dataset config  → {toml_path}")
    return toml_path

# ---------------------------------------------------------------------------
# Step 4: Train
# ---------------------------------------------------------------------------

def step_train(args):
    print("\n═══ STEP 4: TRAIN ═══\n")

    kohya_dir = find_kohya(Path(args.kohya_dir) if args.kohya_dir else None)
    if kohya_dir is None:
        print("ERROR: kohya_ss not found.")
        print("  Pass --kohya-dir or extract kohya_ss to C:\\kohya_ss")
        sys.exit(1)
    print(f"kohya_ss at: {kohya_dir}")

    train_script = kohya_dir / "train_network.py"
    dataset_toml = SCRIPT_DIR / "dataset.toml"
    if not dataset_toml.exists():
        print("ERROR: dataset.toml not found. Run 'organize' step first.")
        sys.exit(1)

    # Find the base model checkpoint
    checkpoint = args.checkpoint
    if not checkpoint:
        # Look in common ComfyUI model paths
        for candidate in [
            Path(r"C:\Users\joshk\AppData\Local\Comfy-Desktop\ComfyUI-Installs\ComfyUI\ComfyUI\models\checkpoints\counterfeitV30_v30.safetensors"),
            Path(r"C:\Users\joshk\AppData\Local\Comfy-Desktop\ComfyUI-Installs\ComfyUI (1)\ComfyUI\models\checkpoints\counterfeitV30_v30.safetensors"),
        ]:
            if candidate.exists():
                checkpoint = str(candidate)
                break
        if not checkpoint:
            print("ERROR: Base checkpoint not found. Pass --checkpoint path/to/model.safetensors")
            sys.exit(1)
    print(f"Base model: {checkpoint}")

    LORA_OUT_DIR.mkdir(parents=True, exist_ok=True)

    cmd = [
        sys.executable, "-m", "accelerate.commands.launch",
        "--num_cpu_threads_per_process", "2",
        str(train_script),
        "--pretrained_model_name_or_path", checkpoint,
        "--dataset_config", str(dataset_toml),
        "--output_dir", str(LORA_OUT_DIR),
        "--output_name", "pjorg_lora",
        "--save_model_as", "safetensors",
        "--network_module", "networks.lora",
        "--network_dim", str(args.rank),
        "--network_alpha", str(args.rank // 2),
        "--max_train_steps", str(args.steps_train),
        "--learning_rate", "1e-4",
        "--unet_lr", "1e-4",
        "--text_encoder_lr", "5e-5",
        "--lr_scheduler", "cosine_with_restarts",
        "--lr_warmup_steps", "100",
        "--optimizer_type", "AdamW8bit",
        "--mixed_precision", "fp16",
        "--save_precision", "fp16",
        "--cache_latents",
        "--gradient_checkpointing",
        "--save_every_n_steps", "250",
        "--logging_dir", str(LORA_OUT_DIR / "logs"),
        "--log_prefix", "pjorg",
    ]

    print(f"\nLaunching training ({args.steps_train} steps, rank {args.rank})...")
    print(f"Output → {LORA_OUT_DIR}\n")

    LOG_PATH.parent.mkdir(parents=True, exist_ok=True)

    loss_steps  = []
    loss_values = []

    with open(LOG_PATH, "w", encoding="utf-8") as log_file:
        proc = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            encoding="utf-8",
            errors="replace",
            cwd=str(kohya_dir),
        )
        for line in proc.stdout:
            print(line, end="")
            log_file.write(line)
            log_file.flush()

            # Parse loss from lines like:
            # "step 100/1500, loss: 0.1234" or "avr_loss=0.0812"
            m = re.search(r"(?:loss[=: ]+)([0-9]+\.[0-9]+)", line, re.I)
            if m:
                step_m = re.search(r"step[s]?\s+(\d+)", line, re.I)
                step_n = int(step_m.group(1)) if step_m else len(loss_values) * 10
                loss_steps.append(step_n)
                loss_values.append(float(m.group(1)))

        proc.wait()

    if proc.returncode != 0:
        print(f"\nERROR: Training exited with code {proc.returncode}")
        print(f"See log: {LOG_PATH}")
    else:
        print(f"\nTraining complete. Weights → {LORA_OUT_DIR}")

    # Save loss data for report step
    loss_data = {"steps": loss_steps, "values": loss_values}
    (LORA_OUT_DIR / "loss.json").write_text(json.dumps(loss_data, indent=2))

    return loss_steps, loss_values

# ---------------------------------------------------------------------------
# Step 5: Report
# ---------------------------------------------------------------------------

def step_report(_args):
    print("\n═══ STEP 5: REPORT ═══\n")

    loss_file = LORA_OUT_DIR / "loss.json"
    if not loss_file.exists():
        # Try to parse from log
        if not LOG_PATH.exists():
            print("No training log found. Run 'train' step first.")
            return
        steps_list, values_list = [], []
        for line in LOG_PATH.read_text(encoding="utf-8", errors="replace").splitlines():
            m = re.search(r"(?:loss[=: ]+)([0-9]+\.[0-9]+)", line, re.I)
            if m:
                sm = re.search(r"step[s]?\s+(\d+)", line, re.I)
                steps_list.append(int(sm.group(1)) if sm else len(values_list) * 10)
                values_list.append(float(m.group(1)))
    else:
        data = json.loads(loss_file.read_text())
        steps_list  = data["steps"]
        values_list = data["values"]

    if not values_list:
        print("No loss data found in log.")
        return

    # ASCII sparkline
    mn, mx = min(values_list), max(values_list)
    rng = mx - mn if mx != mn else 1
    blocks = " ▁▂▃▄▅▆▇█"
    spark = "".join(blocks[min(8, int((v - mn) / rng * 8))] for v in values_list)

    print(f"Loss curve ({len(values_list)} data points):")
    print(f"  max={mx:.4f}  min={mn:.4f}  final={values_list[-1]:.4f}")
    print(f"\n  {spark}\n")

    # Smoothed summary every N steps
    window = max(1, len(values_list) // 10)
    print(f"  Smoothed (window={window}):")
    for i in range(0, len(values_list), window):
        chunk = values_list[i:i+window]
        avg   = sum(chunk) / len(chunk)
        step  = steps_list[i] if steps_list else i * 10
        bar   = "█" * int(avg * 60)
        print(f"  step {step:5d}  loss={avg:.4f}  {bar}")

    # Suggest next action
    final = values_list[-1]
    if final > 0.15:
        print("\n  → Loss still high. Consider more training steps or lower LR.")
    elif final < 0.04:
        print("\n  → Loss very low — risk of overfitting. Try fewer steps next run.")
    else:
        print("\n  → Loss looks healthy. Test the LoRA in ComfyUI.")

    # Try matplotlib if available
    try:
        import matplotlib.pyplot as plt
        plt.figure(figsize=(10, 4))
        plt.plot(steps_list, values_list, alpha=0.4, label="raw loss")
        if len(values_list) > 10:
            smooth = []
            w = max(1, len(values_list) // 20)
            for j in range(len(values_list)):
                s = values_list[max(0, j-w):j+w+1]
                smooth.append(sum(s) / len(s))
            plt.plot(steps_list, smooth, linewidth=2, label="smoothed")
        plt.xlabel("step")
        plt.ylabel("loss")
        plt.title("pjorg LoRA training loss")
        plt.legend()
        plt.grid(True, alpha=0.3)
        chart_path = LORA_OUT_DIR / "loss_curve.png"
        plt.savefig(chart_path, dpi=120, bbox_inches="tight")
        plt.close()
        print(f"\n  Loss chart saved → {chart_path}")
    except ImportError:
        print("\n  (pip install matplotlib for a PNG chart)")

# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

ALL_STEPS = ["generate", "filter", "organize", "train", "report"]


def main():
    parser = argparse.ArgumentParser(
        description="pjorg LoRA end-to-end training pipeline",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "--steps", default="generate,filter,organize,train,report",
        help="Comma-separated steps to run (default: all). "
             "Options: generate,filter,organize,train,report",
    )

    # generate options
    gen = parser.add_argument_group("generate")
    gen.add_argument("--count",    type=int,   default=30,  help="Images to generate (default: 30)")
    gen.add_argument("--cfg",      type=float, default=7.5, help="CFG scale (default: 7.5)")
    gen.add_argument("--steps",    type=int,   default=28,  dest="comfy_steps",
                     help="Sampler steps (default: 28)")

    # filter options
    flt = parser.add_argument_group("filter")
    flt.add_argument("--threshold", type=float, default=0.5,
                     help="Min confidence for auto-pass (default: 0.5)")

    # train options
    trn = parser.add_argument_group("train")
    trn.add_argument("--kohya-dir",   default=None,
                     help="Path to kohya_ss directory")
    trn.add_argument("--checkpoint",  default=None,
                     help="Path to base model .safetensors")
    trn.add_argument("--steps-train", type=int, default=1500,
                     help="Training steps (default: 1500)")
    trn.add_argument("--rank",        type=int, default=8,
                     help="LoRA network rank (default: 8)")

    args = parser.parse_args()

    # Resolve --steps (args.steps is the pipeline steps string,
    # args.comfy_steps is the sampler steps int)
    requested = [s.strip().lower() for s in args.steps.split(",")]
    unknown   = [s for s in requested if s not in ALL_STEPS]
    if unknown:
        print(f"ERROR: Unknown step(s): {unknown}")
        print(f"  Valid: {ALL_STEPS}")
        sys.exit(1)

    print("pjorg LoRA Pipeline")
    print(f"Steps: {' → '.join(requested)}\n")

    dispatch = {
        "generate": lambda: step_generate(args),
        "filter":   lambda: step_filter(args),
        "organize": lambda: step_organize(args),
        "train":    lambda: step_train(args),
        "report":   lambda: step_report(args),
    }

    for step in requested:
        dispatch[step]()

    print("\n✓ Pipeline complete.")


if __name__ == "__main__":
    main()

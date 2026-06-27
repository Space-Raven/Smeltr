#!/usr/bin/env python3
"""
ComfyUI API batch generator for pjorg LoRA training images.

Queues txt2img workflows via the ComfyUI REST API, polls for completion,
fetches generated images via the /view endpoint, and saves them to:
  Token-Platform-Merged/comfyui/training-images/

Usage:
    python generate_training_images.py              # generate 20 images
    python generate_training_images.py --count 50   # generate 50 images
    python generate_training_images.py --port 8189  # specify ComfyUI port
"""

import argparse
import json
import sys
import time
import uuid
import urllib.error
import urllib.request
import urllib.parse
from pathlib import Path

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

OUTPUT_DIR = Path(__file__).parent / "training-images"

CHECKPOINT = "counterfeitV30_v30.safetensors"

POSITIVE_PROMPT = (
    "pjorg cat, tortoiseshell cat, dark grey fur with orange and black patches, "
    "teal green eyes, white chin patch, bipedal cat person, "
    "steampunk brass goggles pushed up on forehead, "
    "hand-drawn anime style, studio ghibli, cel shading, dark outlines, "
    "chibi proportions, cute expression, warm lighting, white background, "
    "solo character, full body, character sheet"
)

NEGATIVE_PROMPT = (
    "human, girl, boy, person, second character, multiple characters, duo, "
    "realistic, photorealistic, 3d render, furry art nsfw, "
    "modern equipment, laptop, phone, blocky, flat shading, "
    "bad anatomy, extra limbs, missing limbs, deformed hands, "
    "watermark, text, signature, blurry, low quality, jpeg artifacts"
)

# Sampler settings
STEPS = 28
CFG = 7.5
SAMPLER = "dpmpp_2m"
SCHEDULER = "karras"
WIDTH = 512
HEIGHT = 512

# ---------------------------------------------------------------------------
# Workflow builder
# ---------------------------------------------------------------------------

def build_workflow(seed: int, steps: int = STEPS, cfg: float = CFG) -> dict:
    """Build a txt2img API workflow dict for the given seed."""
    return {
        "1": {
            "class_type": "CheckpointLoaderSimple",
            "inputs": {"ckpt_name": CHECKPOINT}
        },
        "2": {
            "class_type": "EmptyLatentImage",
            "inputs": {"width": WIDTH, "height": HEIGHT, "batch_size": 1}
        },
        "3": {
            "class_type": "CLIPTextEncode",
            "inputs": {"text": POSITIVE_PROMPT, "clip": ["1", 1]}
        },
        "4": {
            "class_type": "CLIPTextEncode",
            "inputs": {"text": NEGATIVE_PROMPT, "clip": ["1", 1]}
        },
        "5": {
            "class_type": "KSampler",
            "inputs": {
                "seed": seed,
                "control_after_generate": "fixed",
                "steps": steps,
                "cfg": cfg,
                "sampler_name": SAMPLER,
                "scheduler": SCHEDULER,
                "denoise": 1.0,
                "model": ["1", 0],
                "positive": ["3", 0],
                "negative": ["4", 0],
                "latent_image": ["2", 0]
            }
        },
        "6": {
            "class_type": "VAEDecode",
            "inputs": {"samples": ["5", 0], "vae": ["1", 2]}
        },
        "7": {
            "class_type": "SaveImage",
            "inputs": {"filename_prefix": "pjorg", "images": ["6", 0]}
        }
    }

# ---------------------------------------------------------------------------
# API helpers
# ---------------------------------------------------------------------------

def api_url(host: str, port: int, path: str) -> str:
    return f"http://{host}:{port}{path}"


def check_running(host: str, port: int) -> bool:
    try:
        with urllib.request.urlopen(
            api_url(host, port, "/system_stats"), timeout=3
        ) as resp:
            return resp.status == 200
    except Exception:
        return False


def queue_prompt(host: str, port: int, workflow: dict, client_id: str) -> str:
    payload = json.dumps({"prompt": workflow, "client_id": client_id}).encode()
    req = urllib.request.Request(
        api_url(host, port, "/prompt"),
        data=payload,
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as resp:
        result = json.loads(resp.read())
        if "error" in result:
            raise RuntimeError(f"ComfyUI rejected prompt: {result['error']}")
        return result["prompt_id"]


def get_history(host: str, port: int, prompt_id: str) -> dict:
    with urllib.request.urlopen(
        api_url(host, port, f"/history/{prompt_id}")
    ) as resp:
        return json.loads(resp.read())


def wait_for_completion(host: str, port: int, prompt_id: str, timeout: int = 300) -> dict:
    start = time.time()
    dots = 0
    while time.time() - start < timeout:
        history = get_history(host, port, prompt_id)
        if prompt_id in history:
            print()  # newline after dots
            return history[prompt_id]
        dots += 1
        print("." if dots % 60 else "\n  ", end="", flush=True)
        time.sleep(1)
    raise TimeoutError(f"Timed out after {timeout}s waiting for prompt {prompt_id}")


def fetch_image(host: str, port: int, filename: str, subfolder: str, img_type: str) -> bytes:
    params = urllib.parse.urlencode({
        "filename": filename,
        "subfolder": subfolder,
        "type": img_type
    })
    with urllib.request.urlopen(api_url(host, port, f"/view?{params}")) as resp:
        return resp.read()

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="Generate pjorg LoRA training images via ComfyUI API")
    parser.add_argument("--count", type=int, default=20, help="Number of images to generate (default: 20)")
    parser.add_argument("--host", default="127.0.0.1", help="ComfyUI host (default: 127.0.0.1)")
    parser.add_argument("--port", type=int, default=None, help="ComfyUI port (default: auto-detect 8188/8189)")
    parser.add_argument("--steps", type=int, default=STEPS, help=f"Sampler steps (default: {STEPS})")
    parser.add_argument("--cfg", type=float, default=CFG, help=f"CFG scale (default: {CFG})")
    parser.add_argument("--start-seed", type=int, default=None, help="Starting seed (default: random)")
    args = parser.parse_args()

    # --- Detect ComfyUI port ---
    host = args.host
    if args.port:
        port = args.port
        if not check_running(host, port):
            print(f"ERROR: ComfyUI not reachable at {host}:{port}")
            print("Make sure ComfyUI Desktop is open and running.")
            sys.exit(1)
    else:
        port = None
        for candidate in [8188, 8189, 8190]:
            if check_running(host, candidate):
                port = candidate
                break
        if port is None:
            print("ERROR: ComfyUI not found on ports 8188, 8189, or 8190.")
            print("Make sure ComfyUI Desktop is open and running.")
            sys.exit(1)

    print(f"Connected to ComfyUI at {host}:{port}")

    # --- Prepare output dir ---
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    # Find next available index to avoid overwriting existing images
    existing = sorted(OUTPUT_DIR.glob("pjorg_????.png"))
    next_idx = int(existing[-1].stem.split("_")[1]) + 1 if existing else 1
    print(f"Output: {OUTPUT_DIR}  (starting at pjorg_{next_idx:04d}.png)")

    steps = args.steps
    cfg = args.cfg

    client_id = str(uuid.uuid4())
    base_seed = args.start_seed if args.start_seed is not None else int(time.time()) % (2**31)
    saved = 0
    failed = 0

    print(f"\nGenerating {args.count} images (base seed: {base_seed})\n")

    for i in range(args.count):
        seed = (base_seed + i) % (2**32)
        print(f"[{i+1}/{args.count}] seed={seed}  ", end="", flush=True)

        try:
            workflow = build_workflow(seed, steps=steps, cfg=cfg)
            prompt_id = queue_prompt(host, port, workflow, client_id)
            result = wait_for_completion(host, port, prompt_id)

            # Check for execution errors
            if "error" in result:
                print(f"  ERROR: {result['error']}")
                failed += 1
                continue

            outputs = result.get("outputs", {})
            found_images = False
            for node_id, node_output in outputs.items():
                for img_info in node_output.get("images", []):
                    img_bytes = fetch_image(
                        host, port,
                        img_info["filename"],
                        img_info.get("subfolder", ""),
                        img_info.get("type", "output")
                    )
                    out_path = OUTPUT_DIR / f"pjorg_{next_idx:04d}.png"
                    out_path.write_bytes(img_bytes)
                    size_kb = len(img_bytes) // 1024
                    print(f"  → saved {out_path.name} ({size_kb} KB)")
                    next_idx += 1
                    saved += 1
                    found_images = True

            if not found_images:
                print(f"  WARNING: No images in output for prompt {prompt_id}")
                failed += 1

        except KeyboardInterrupt:
            print(f"\n\nInterrupted. {saved} images saved so far.")
            break
        except Exception as e:
            print(f"  ERROR: {e}")
            failed += 1

    print(f"\n{'='*50}")
    print(f"Done: {saved} images saved to {OUTPUT_DIR}")
    if failed:
        print(f"      {failed} failed/skipped")
    print(f"\nNext step: set up kohya_ss dataset at:")
    print(f"  <dataset_root>/20_pjorg cat/   ← move images here")


if __name__ == "__main__":
    main()

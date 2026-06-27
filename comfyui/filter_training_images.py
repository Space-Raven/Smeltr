#!/usr/bin/env python3
"""
Quality filter for pjorg LoRA training images using Claude vision API.

Evaluates each image for:
  - Second characters (humans, other animal people)
  - Correct tortoiseshell appearance (dark fur, orange patches, teal eyes)
  - Steampunk goggles present
  - Reasonable anatomy

Usage:
    pip install anthropic
    set ANTHROPIC_API_KEY=sk-ant-...

    python filter_training_images.py                        # filter training-images/ in place
    python filter_training_images.py --input custom/folder
    python filter_training_images.py --dry-run              # report only, no file moves
    python filter_training_images.py --threshold 0.7        # stricter confidence cutoff
"""

import argparse
import base64
import json
import os
import shutil
import sys
import time
from pathlib import Path

# ---------------------------------------------------------------------------
# Paths (relative to this script)
# ---------------------------------------------------------------------------

SCRIPT_DIR = Path(__file__).parent
DEFAULT_INPUT    = SCRIPT_DIR / "training-images"
DEFAULT_APPROVED = SCRIPT_DIR / "training-images" / "approved"
DEFAULT_REJECTED = SCRIPT_DIR / "training-images" / "rejected"

# ---------------------------------------------------------------------------
# Prompts
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = """\
You are a strict quality-control agent for AI LoRA training data.
You evaluate images of a fictional cat character called "pjorg" and output JSON.

The correct pjorg character:
- Tortoiseshell cat: dark grey/black base fur with distinct orange/amber patches
- Bright teal or green eyes
- White chin patch
- Walks upright on two legs (bipedal)
- Steampunk brass goggles (on forehead or over eyes)
- Anime / Studio Ghibli chibi art style
- ALWAYS SOLO — no other characters in the frame

Hard reject criteria (pass=false):
- Any human, second animal person, or additional character visible
- Completely wrong character (e.g. a plain black cat with no orange patches)
- Blank, fully corrupted, or white-noise image

Soft issues (note but still pass unless severe):
- Minor anatomy quirks (slightly off proportions)
- Missing goggles (not ideal, but not disqualifying alone)
- Slightly muted colours

Reply with compact JSON only — no markdown fences, no extra text.\
"""

EVAL_PROMPT = """\
Evaluate this training image. Reply with JSON only:

{
  "pass": true,
  "confidence": 0.85,
  "second_character": false,
  "correct_character": true,
  "issues": [],
  "notes": "dark tortoiseshell cat with brass goggles, solo, white background"
}

Fields:
  pass             - true if suitable for LoRA training
  confidence       - your certainty in the verdict (0.0–1.0)
  second_character - true if a human or second character is present (auto-fail)
  correct_character- true if the cat looks like pjorg
  issues           - list of specific problems (empty if none)
  notes            - one-line description of what you see\
"""

# ---------------------------------------------------------------------------
# API helpers
# ---------------------------------------------------------------------------

def encode_image(path: Path) -> str:
    with open(path, "rb") as f:
        return base64.standard_b64encode(f.read()).decode("utf-8")


def evaluate_image(client, image_path: Path, retries: int = 2) -> dict:
    image_data = encode_image(image_path)

    for attempt in range(retries + 1):
        try:
            message = client.messages.create(
                model="claude-haiku-4-5-20251001",
                max_tokens=300,
                system=SYSTEM_PROMPT,
                messages=[{
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": "image/png",
                                "data": image_data,
                            },
                        },
                        {"type": "text", "text": EVAL_PROMPT},
                    ],
                }],
            )
            text = message.content[0].text.strip()

            # Strip any accidental markdown fences
            if text.startswith("```"):
                lines = text.split("\n")
                text = "\n".join(
                    l for l in lines
                    if not l.startswith("```")
                )

            return json.loads(text)

        except json.JSONDecodeError:
            if attempt < retries:
                time.sleep(1)
                continue
            raise
        except Exception:
            if attempt < retries:
                time.sleep(2)
                continue
            raise

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Filter pjorg training images via Claude vision"
    )
    parser.add_argument("--input",     type=Path, default=DEFAULT_INPUT,
                        help=f"Input directory (default: {DEFAULT_INPUT})")
    parser.add_argument("--approved",  type=Path, default=DEFAULT_APPROVED,
                        help="Destination for approved images")
    parser.add_argument("--rejected",  type=Path, default=DEFAULT_REJECTED,
                        help="Destination for rejected images")
    parser.add_argument("--dry-run",   action="store_true",
                        help="Print results without moving files")
    parser.add_argument("--threshold", type=float, default=0.5,
                        help="Confidence below this flips a pass to reject (default: 0.5)")
    parser.add_argument("--pattern",   default="pjorg_????.png",
                        help="Glob pattern for images (default: pjorg_????.png)")
    args = parser.parse_args()

    # --- Dependency checks ---
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("ERROR: ANTHROPIC_API_KEY not set.")
        print("  Windows: set ANTHROPIC_API_KEY=sk-ant-...")
        sys.exit(1)

    try:
        import anthropic
    except ImportError:
        print("ERROR: anthropic package not installed.")
        print("  Run: pip install anthropic --break-system-packages")
        sys.exit(1)

    client = anthropic.Anthropic(api_key=api_key)

    # --- Find images ---
    images = sorted(args.input.glob(args.pattern))
    if not images:
        images = sorted(args.input.glob("*.png"))
    if not images:
        print(f"No images found in {args.input}")
        sys.exit(1)

    print(f"Found {len(images)} images in {args.input}")
    if args.dry_run:
        print("DRY RUN — files will not be moved\n")
    else:
        args.approved.mkdir(parents=True, exist_ok=True)
        args.rejected.mkdir(parents=True, exist_ok=True)

    passed_list = []
    rejected_list = []
    errors = []

    for i, img_path in enumerate(images, 1):
        print(f"[{i:3d}/{len(images)}] {img_path.name}  ", end="", flush=True)

        try:
            r = evaluate_image(client, img_path)

            verdict  = r.get("pass", False)
            conf     = r.get("confidence", 1.0)
            second   = r.get("second_character", False)
            issues   = r.get("issues", [])
            notes    = r.get("notes", "")

            # Hard overrides
            if second:
                verdict = False
                if "second character" not in " ".join(issues).lower():
                    issues.insert(0, "second character detected")

            if verdict and conf < args.threshold:
                verdict = False
                issues.append(f"confidence {conf:.2f} below threshold {args.threshold}")

            icon = "✓" if verdict else "✗"
            tag  = "PASS  " if verdict else "REJECT"
            print(f"{icon} {tag}  conf={conf:.2f}  {notes[:55]}")
            for iss in issues:
                print(f"          ↳ {iss}")

            if not args.dry_run:
                dest = args.approved if verdict else args.rejected
                shutil.copy2(img_path, dest / img_path.name)

            if verdict:
                passed_list.append(img_path.name)
            else:
                rejected_list.append((img_path.name, issues))

        except Exception as e:
            print(f"  ERROR: {e}")
            errors.append(img_path.name)

    # --- Summary ---
    total = len(images)
    n_pass = len(passed_list)
    n_rej  = len(rejected_list)
    n_err  = len(errors)

    print(f"\n{'='*55}")
    print(f"  Approved : {n_pass:3d} / {total}")
    print(f"  Rejected : {n_rej:3d} / {total}")
    if n_err:
        print(f"  Errors   : {n_err:3d} / {total}")
    print(f"{'='*55}")

    if not args.dry_run and n_pass > 0:
        print(f"\nApproved images saved to:\n  {args.approved}")
        print(f"\nNext step:")
        print(f"  python pipeline.py --steps organize,train")

    # Write rejection log
    if rejected_list and not args.dry_run:
        log_path = args.rejected / "rejection_log.txt"
        with open(log_path, "w") as f:
            for name, issues in rejected_list:
                f.write(f"{name}: {'; '.join(issues)}\n")
        print(f"  Rejection log → {log_path}")

    return 0 if n_err == 0 else 1


if __name__ == "__main__":
    sys.exit(main())

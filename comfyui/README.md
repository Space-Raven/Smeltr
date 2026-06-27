# ComfyUI — Smeltr Asset Pipeline

## Installation — ComfyUI Desktop (already installed)

**ComfyUI Desktop** is installed. Do NOT use the portable zip version.

Data location for the active instance (`ComfyUI (1)`, v0.20.1):
```
C:\Users\joshk\AppData\Local\Comfy-Desktop\ComfyUI-Installs\ComfyUI (1)\ComfyUI\
```

> **Two-instance gotcha:** Comfy Desktop can run multiple instances, each
> with its own separate models directory. Models must be placed in the
> correct instance's folder. Use `copy-models.bat` in the repo root to
> copy from one instance to another. The active workflow instance is
> always `ComfyUI (1)`.

Model subdirectories (relative to the data location above):
- `models\checkpoints\` — base SD checkpoints
- `models\vae\` — VAE files
- `models\loras\` — LoRA weights

---

## Models installed

| File | Location | Status |
|------|----------|--------|
| `counterfeitV30_v30.safetensors` | `models\checkpoints\` | ✅ installed |
| `kl-f8-anime2.ckpt` | `models\vae\` | ✅ installed |
| `pjorg-v1.safetensors` | `models\loras\` | ⏳ needs LoRA training |

Download sources:
- Counterfeit V3.0: https://civitai.com/models/4468/counterfeit-v30
- kl-f8-anime2: https://huggingface.co/hakurei/waifu-diffusion-v1-4/resolve/main/vae/kl-f8-anime2.ckpt

---

## Workflows

### `pjorg-workflow.json` — character generation (post-training)
Full pipeline: Checkpoint → LoRA → KSampler → VAEDecode → SaveImage.
Used after `pjorg-v1.safetensors` is trained. The LoRA node shows a
missing-model error until training is done — this is expected.

### `pjorg-training-workflow.json` — training image generation
Img2img pipeline: loads a reference photo and stylizes it to anime using
Counterfeit V3 (no LoRA). Denoise 0.65 preserves the cat's identity while
converting to cel-shaded anime style.

To build the training dataset:
1. Open ComfyUI (1) from Comfy Desktop dashboard
2. Load `comfyui/pjorg-training-workflow.json`
3. Set the filename on the LoadImage node to each reference photo
4. Vary the seed on KSampler to get multiple outputs per reference
5. Collect outputs from `...\ComfyUI (1)\ComfyUI\output\pjorg-training\`
6. Aim for 20–30 total images across all 6 reference photos

---

## Pjorg character reference

Real cat: dark tortoiseshell, very dark grey/black mottled fur, teal-green
eyes, white chin/muzzle patch, black paws.

Reference photos: `C:\Users\joshk\Desktop\Smeltr\Pjorg char ref\referencepics\`
(6 photos: `20180129_133309_Original.jpeg`, `IMG_0250.jpeg`, `IMG_3225.jpeg`,
`IMG_3229.jpeg`, `IMG_3233.jpeg`, `IMG_3234.jpeg`)

**Positive prompt:**
`pjorg cat, tortoiseshell cat, dark grey fur, teal green eyes, white chin, bipedal, steampunk goggles, brass goggles, cel shading, dark outlines, chibi proportions, cute expression, anime style, studio ghibli, warm colors, soft lighting, white background`

**Negative prompt:**
`adult proportions, realistic, photorealistic, 3d render, furry, nsfw, modern equipment, laptop, phone, brain rot, blocky, flat shading, bad anatomy, extra limbs, watermark, text, signature`

---

## LoRA training (kohya_ss)

Trainer: `C:\Users\joshk\Desktop\pjorg work\kohya_ss-25.2.1\kohya_ss-25.2.1\`

First-time setup (run once, ~5 min):
```
setup.bat
```

Launch the GUI:
```
gui.bat
```

Settings for RTX 4060 8GB:

| Setting | Value |
|---------|-------|
| Base model | `counterfeitV30_v30.safetensors` |
| Dataset | 20–30 images at 512×512 from pjorg-training-workflow output |
| Repeats folder name | `20_pjorg cat` |
| Steps | 1500 |
| Network rank | 8 |
| Network alpha | 4 |
| LR (unet) | 1e-4 |
| LR (text encoder) | 5e-5 |
| Batch size | 2 |
| LR scheduler | cosine with restarts |
| Output name | `pjorg-v1` |
| Output dir | `...\ComfyUI (1)\ComfyUI\models\loras\` |

Expected training time: ~15 minutes.

After training, stop and restart ComfyUI (1) from the Comfy Desktop
dashboard. The missing-model error in `pjorg-workflow.json` will resolve.

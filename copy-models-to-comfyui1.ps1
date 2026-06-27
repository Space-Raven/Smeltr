$src = "$env:LOCALAPPDATA\Comfy-Desktop\ComfyUI-Installs\ComfyUI\ComfyUI\models"
$dst = "$env:LOCALAPPDATA\Comfy-Desktop\ComfyUI-Installs\ComfyUI (1)\ComfyUI\models"

New-Item -ItemType Directory -Force -Path "$dst\checkpoints" | Out-Null
New-Item -ItemType Directory -Force -Path "$dst\vae" | Out-Null

Write-Host "Copying checkpoint (3.95 GB)..."
Copy-Item "$src\checkpoints\counterfeitV30_v30.safetensors" "$dst\checkpoints\" -Verbose

Write-Host "Copying VAE (385 MB)..."
Copy-Item "$src\vae\kl-f8-anime2.ckpt" "$dst\vae\" -Verbose

Write-Host "Done."

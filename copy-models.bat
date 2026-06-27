@echo off
echo Copying checkpoint (3.95 GB) - this will take a few minutes...
robocopy "%LOCALAPPDATA%\Comfy-Desktop\ComfyUI-Installs\ComfyUI\ComfyUI\models\checkpoints" "%LOCALAPPDATA%\Comfy-Desktop\ComfyUI-Installs\ComfyUI (1)\ComfyUI\models\checkpoints" counterfeitV30_v30.safetensors /is /it
echo Copying VAE (385 MB)...
robocopy "%LOCALAPPDATA%\Comfy-Desktop\ComfyUI-Installs\ComfyUI\ComfyUI\models\vae" "%LOCALAPPDATA%\Comfy-Desktop\ComfyUI-Installs\ComfyUI (1)\ComfyUI\models\vae" kl-f8-anime2.ckpt /is /it
echo Done! Press any key to close.
pause

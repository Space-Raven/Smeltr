@echo off
echo Copying pjorg reference photos to ComfyUI (1) input folder...
set DEST=%LOCALAPPDATA%\Comfy-Desktop\ComfyUI-Installs\ComfyUI (1)\ComfyUI\input
if not exist "%DEST%" mkdir "%DEST%"
xcopy /Y "C:\Users\joshk\Desktop\Smeltr\Pjorg char ref\referencepics\*.*" "%DEST%\"
echo Done. Photos are now available in ComfyUI LoadImage node.
pause

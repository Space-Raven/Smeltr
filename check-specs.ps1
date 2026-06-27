# Smeltr — system spec check for LoRA training assessment
Write-Host "`n=== GPU ===" -ForegroundColor Cyan
Get-WmiObject Win32_VideoController | Select-Object Name, AdapterRAM, DriverVersion | Format-List

Write-Host "=== RAM ===" -ForegroundColor Cyan
$ram = Get-WmiObject Win32_PhysicalMemory | Measure-Object -Property Capacity -Sum
Write-Host ("Total RAM: {0:N1} GB" -f ($ram.Sum / 1GB))

Write-Host "`n=== CPU ===" -ForegroundColor Cyan
Get-WmiObject Win32_Processor | Select-Object Name, NumberOfCores, NumberOfLogicalProcessors | Format-List

Write-Host "=== VRAM (via DXGI) ===" -ForegroundColor Cyan
try {
    $vram = (Get-ItemProperty "HKLM:\SYSTEM\ControlSet001\Control\Class\{4d36e968-e325-11ce-bfc1-08002be10318}\0*" -ErrorAction SilentlyContinue |
        Where-Object { $_.DriverDesc } |
        Select-Object DriverDesc, HardwareInformation.qwMemorySize)
    $vram | ForEach-Object {
        $bytes = $_."HardwareInformation.qwMemorySize"
        if ($bytes) { Write-Host ("{0}: {1:N1} GB VRAM" -f $_.DriverDesc, ($bytes / 1GB)) }
    }
} catch {}

Write-Host "`n=== nvidia-smi (if NVIDIA) ===" -ForegroundColor Cyan
try { nvidia-smi --query-gpu=name,memory.total,driver_version --format=csv,noheader } catch { Write-Host "nvidia-smi not found or no NVIDIA GPU" }

Write-Host "`n=== Disk (free space) ===" -ForegroundColor Cyan
Get-PSDrive C | Select-Object Name, @{N="Used(GB)";E={[math]::Round($_.Used/1GB,1)}}, @{N="Free(GB)";E={[math]::Round($_.Free/1GB,1)}} | Format-Table

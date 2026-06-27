# Smeltr mainnet smoke test — full path including Irys upload
# Cost: ~0.002-0.003 SOL (mint rent + 2x tx fees). Irys upload is free under 100KB.
# Does NOT modify .env — passes mainnet RPC as a process env var.
#
# Usage: C:\Users\joshk\Token-Platform-Merged\run-mainnet-smoke-test.ps1

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$webDir = Join-Path $repoRoot "apps\web"

# Kill any process already holding port 3000 so the correct dev server starts cleanly.
$existing = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($existing) {
    Write-Host "Killing existing process on port 3000 (PID $($existing.OwningProcess))..." -ForegroundColor Yellow
    Stop-Process -Id $existing.OwningProcess -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
}

Write-Host ""
Write-Host "=== Smeltr MAINNET smoke test ===" -ForegroundColor Magenta
Write-Host "RPC: https://solana.drpc.org" -ForegroundColor White
Write-Host "Irys: https://uploader.irys.xyz (mainnet bundler)" -ForegroundColor White
Write-Host ""
Write-Host "COST: ~0.002-0.003 real SOL for mint rent + fees." -ForegroundColor Yellow
Write-Host "      Irys image + JSON upload is free (under 100KB threshold)." -ForegroundColor Yellow
Write-Host ""

# Check uploader.irys.xyz is reachable
Write-Host "Checking uploader.irys.xyz..." -ForegroundColor Yellow
try {
    $null = Invoke-WebRequest -Uri "https://uploader.irys.xyz" -Method GET -TimeoutSec 5 -UseBasicParsing 2>$null
    Write-Host "  uploader.irys.xyz reachable" -ForegroundColor Green
} catch {
    $msg = $_.Exception.Message
    if ($msg -match "timed out|timeout|Unable to connect") {
        Write-Host "  uploader.irys.xyz not reachable - check internet connection" -ForegroundColor Red
        exit 1
    }
    Write-Host "  uploader.irys.xyz reachable (HTTP error fine)" -ForegroundColor Green
}

Write-Host ""
Write-Host "CHECKLIST:" -ForegroundColor Cyan
Write-Host "  [1] Phantom set to MAINNET" -ForegroundColor White
Write-Host "  [2] Phantom has >= 0.01 SOL (mainnet)" -ForegroundColor White
Write-Host "  [3] Have a small image ready (<95KB recommended)" -ForegroundColor White
Write-Host ""
Write-Host "WHAT TO TEST:" -ForegroundColor Cyan
Write-Host "  1. Connect Phantom (top-right)" -ForegroundColor White
Write-Host "  2. Fill token name + symbol + upload image" -ForegroundColor White
Write-Host "  3. Click 'Upload metadata' -- Phantom will prompt to sign (not pay)" -ForegroundColor White
Write-Host "  4. Once uploaded, click 'Review Deployment'" -ForegroundColor White
Write-Host "  5. Confirm Tx1 in Phantom (CreateAccount + InitializeMint)" -ForegroundColor White
Write-Host "  6. Click 'Add Metadata', confirm Tx2 in Phantom" -ForegroundColor White
Write-Host "  7. Verify success screen shows mint address + metadata confirmed" -ForegroundColor White
Write-Host ""
Write-Host "Starting dev server with mainnet RPC..." -ForegroundColor Yellow
Write-Host "Opens at: http://localhost:3000/deploy" -ForegroundColor Cyan
Write-Host "Press Ctrl+C when done." -ForegroundColor Gray
Write-Host ""

Start-Sleep -Seconds 3
Start-Process "http://localhost:3000/deploy"

Set-Location $webDir
$env:NEXT_PUBLIC_SOLANA_RPC_URL = "https://solana.drpc.org"
npm run dev

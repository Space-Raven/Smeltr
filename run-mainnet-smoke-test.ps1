# Smeltr mainnet smoke test — full deploy path (Token-2022 + optional Classic SPL)
# Cost: ~0.03 SOL platform fee + mint rent + Metaplex/native metadata rent. Irys free <100KB.
# Does NOT modify .env — passes mainnet RPC as a process env var.
#
# Usage: npm run smoke:mainnet
# Checklist: docs/BETA_LAUNCH_CHECKLIST.md § Blocker 3

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$webDir = Join-Path $repoRoot "apps\web"

$existing = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($existing) {
    Write-Host "Killing existing process on port 3000 (PID $($existing.OwningProcess))..." -ForegroundColor Yellow
    Stop-Process -Id $existing.OwningProcess -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
}

Write-Host ""
Write-Host "=== Smeltr MAINNET smoke test ===" -ForegroundColor Magenta
Write-Host "RPC: https://solana.drpc.org (local dev only — production uses Vercel NEXT_PUBLIC_SOLANA_RPC_URL)" -ForegroundColor White
Write-Host "Checklist: docs/BETA_LAUNCH_CHECKLIST.md" -ForegroundColor White
Write-Host ""
Write-Host "COST: ~0.03 SOL platform fee + rent (real mainnet SOL)." -ForegroundColor Yellow
Write-Host ""

Write-Host "CHECKLIST:" -ForegroundColor Cyan
Write-Host "  [1] Phantom/Solflare set to MAINNET" -ForegroundColor White
Write-Host "  [2] Wallet has >= 0.05 SOL on mainnet" -ForegroundColor White
Write-Host "  [3] Small image ready (<95KB)" -ForegroundColor White
Write-Host ""
Write-Host "TOKEN-2022 PATH:" -ForegroundColor Cyan
Write-Host "  1. Connect wallet" -ForegroundColor White
Write-Host "  2. Token type: Token-2022 (default)" -ForegroundColor White
Write-Host "  3. Name + symbol + logo -> Review Deployment" -ForegroundColor White
Write-Host "  4. Sign tx1 in wallet (create mint)" -ForegroundColor White
Write-Host "  5. Approve auto tx2 OR click Add Metadata if prompted" -ForegroundColor White
Write-Host "  6. Success screen: mint address + metadata attached" -ForegroundColor White
Write-Host "  7. Explorer shows name/symbol (not Unknown)" -ForegroundColor White
Write-Host "  8. SIWS sign-in -> Dashboard row metadataAttached: true" -ForegroundColor White
Write-Host ""
Write-Host "CLASSIC SPL REGRESSION (optional):" -ForegroundColor Cyan
Write-Host "  9. Select Classic SPL -> metadata form -> both txs -> Metaplex on explorer" -ForegroundColor White
Write-Host ""
Write-Host "Starting dev server with mainnet RPC..." -ForegroundColor Yellow
Write-Host "Opens: http://localhost:3000/deploy" -ForegroundColor Cyan
Write-Host "Press Ctrl+C when done. Record PASS/FAIL in docs/BETA_LAUNCH_CHECKLIST.md" -ForegroundColor Gray
Write-Host ""

Start-Sleep -Seconds 2
Start-Process "http://localhost:3000/deploy"

Set-Location $webDir
$env:NEXT_PUBLIC_SOLANA_RPC_URL = "https://solana.drpc.org"
npm run dev

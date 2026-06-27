# Smeltr browser smoke test — Irys upload path
# Tests the full deploy-with-metadata flow through the browser.
# VPN must be active (devnet.irys.xyz requires it on this network).
#
# Usage: C:\Users\joshk\Token-Platform-Merged\run-browser-smoke-test.ps1

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$webDir = Join-Path $repoRoot "apps\web"

Write-Host ""
Write-Host "=== Smeltr browser smoke test ===" -ForegroundColor Cyan
Write-Host ""

# Check VPN
Write-Host "Checking devnet.irys.xyz connectivity..." -ForegroundColor Yellow
try {
    $null = Invoke-WebRequest -Uri "https://devnet.irys.xyz" -Method HEAD -TimeoutSec 5 -UseBasicParsing 2>$null
    Write-Host "  devnet.irys.xyz reachable - VPN OK" -ForegroundColor Green
} catch {
    $msg = $_.Exception.Message
    if ($msg -match "timed out|timeout|connect") {
        Write-Host "  devnet.irys.xyz not reachable - is VPN on?" -ForegroundColor Red
        Write-Host "  Connect VPN and re-run." -ForegroundColor Red
        exit 1
    }
    # Non-timeout errors (e.g. 4xx) mean the host is reachable
    Write-Host "  devnet.irys.xyz reachable (HTTP error is fine) - VPN OK" -ForegroundColor Green
}

# Check payer has devnet SOL for the test wallet prompt
Write-Host ""
Write-Host "Pre-flight checks passed." -ForegroundColor Green
Write-Host ""
Write-Host "CHECKLIST before you proceed:" -ForegroundColor Cyan
Write-Host "  [1] Phantom wallet set to Devnet" -ForegroundColor White
Write-Host "  [2] Phantom has devnet SOL (Settings > Developer > Request Airdrop)" -ForegroundColor White
Write-Host "  [3] VPN is on (confirmed above)" -ForegroundColor White
Write-Host ""
Write-Host "Starting Next.js dev server..." -ForegroundColor Yellow
Write-Host "App will open at http://localhost:3000/deploy" -ForegroundColor Cyan
Write-Host ""
Write-Host "WHAT TO TEST in the browser:" -ForegroundColor Cyan
Write-Host "  1. Connect Phantom (top-right button)" -ForegroundColor White
Write-Host "  2. Check 'Add name, symbol, and logo'" -ForegroundColor White
Write-Host "  3. Fill in token name/symbol, upload any small image (<95KB)" -ForegroundColor White
Write-Host "     -- This triggers the Irys upload. Watch for wallet signing prompts." -ForegroundColor Gray
Write-Host "  4. Click 'Review Deployment'" -ForegroundColor White
Write-Host "  5. Confirm both transactions in Phantom" -ForegroundColor White
Write-Host "  6. On success screen: confirm mint address appears and" -ForegroundColor White
Write-Host "     'Add Metadata' button is present" -ForegroundColor White
Write-Host "  7. Click 'Add Metadata' and confirm tx2 in Phantom" -ForegroundColor White
Write-Host "  8. Verify metadata-attached confirmation appears" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop the server when done." -ForegroundColor Gray
Write-Host ""

# Small delay so user can read the checklist
Start-Sleep -Seconds 3

# Start dev server and open browser
Set-Location $webDir
Start-Process "http://localhost:3000/deploy"
npm run dev

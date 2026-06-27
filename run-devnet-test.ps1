# Smeltr devnet smoke test
# Run from any directory: C:\Users\joshk\Token-Platform-Merged\run-devnet-test.ps1

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$txBuilderDir = Join-Path $repoRoot "packages\tx-builder"
$payerPubkey = "7PZoGQQ9XsfpNQ3CVYxmYvzsRyQVWKnQps2oPsNqPJkF"
$rpcUrl = "https://api.devnet.solana.com"

Write-Host ""
Write-Host "=== Smeltr devnet smoke test ===" -ForegroundColor Cyan
Write-Host "RPC:   $rpcUrl"
Write-Host "Payer: $payerPubkey"
Write-Host ""

# Check balance
Write-Host "Checking payer balance..." -ForegroundColor Yellow
$body = '{"jsonrpc":"2.0","id":1,"method":"getBalance","params":["' + $payerPubkey + '",{"commitment":"confirmed"}]}'
$resp = Invoke-WebRequest -Uri $rpcUrl -Method POST -ContentType "application/json" -Body $body -UseBasicParsing
$balanceLamports = ($resp.Content | ConvertFrom-Json).result.value
$balanceSOL = [math]::Round($balanceLamports / 1000000000, 4)
Write-Host "Balance: $balanceSOL SOL"

if ($balanceLamports -lt 50000000) {
    Write-Host "Balance low - attempting CLI airdrop..." -ForegroundColor Yellow
    solana airdrop 2 $payerPubkey --url $rpcUrl
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "Airdrop failed. Fund manually then re-run:" -ForegroundColor Red
        Write-Host "  https://solfaucet.com" -ForegroundColor Cyan
        Write-Host "  Address: $payerPubkey" -ForegroundColor Cyan
        exit 1
    }
    Start-Sleep -Seconds 5
}

Write-Host ""
Write-Host "Running test..." -ForegroundColor Yellow
Write-Host ""

Set-Location $txBuilderDir
$env:SOLANA_TEST_RPC = $rpcUrl
npm run test:devnet

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "PASSED" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "FAILED" -ForegroundColor Red
}

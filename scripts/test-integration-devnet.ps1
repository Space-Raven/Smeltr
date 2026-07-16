# Run integration tests against devnet when native Windows validator won't start.
$ErrorActionPreference = "Stop"
$env:SOLANA_TEST_RPC = "https://api.devnet.solana.com"
Write-Host "Integration tests -> devnet ($env:SOLANA_TEST_RPC)"
Write-Host "Requires network + devnet airdrop (first run may be slow)."
Set-Location (Join-Path (Join-Path (Join-Path $PSScriptRoot "..") "packages") "tx-builder")
npm run test:integration

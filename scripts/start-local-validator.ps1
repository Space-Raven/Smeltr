# Start solana-test-validator with ledger OUTSIDE the git repo.
#
# WINDOWS: Native solana-test-validator often fails genesis unpack with:
#   "Access is denied (os error 5)" during genesis.tar.bz2 extraction.
# This is an Agave/Windows issue, not Smeltr. Use ONE of:
#   A) WSL2 (recommended):  wsl bash scripts/start-local-validator-wsl.sh
#   B) Devnet integration:  npm run test:a2:integration:devnet  (no local validator)
#   C) Defender exclusion for solana-test-validator.exe + ledger folder, then retry

$ErrorActionPreference = "Stop"

$Ledger = if ($env:SMELTR_LOCALNET_LEDGER) {
  $env:SMELTR_LOCALNET_LEDGER
} else {
  Join-Path $env:LOCALAPPDATA "Smeltr\localnet-ledger"
}

New-Item -ItemType Directory -Force -Path $Ledger | Out-Null

Write-Host ""
Write-Host "Smeltr local validator"
Write-Host "  Ledger : $Ledger"
Write-Host "  RPC    : http://127.0.0.1:8899"
Write-Host "  Clones : Metaplex Token Metadata (metaqbxx… for Classic SPL A2 tests)"
Write-Host ""
Write-Host "If genesis unpack fails with 'Access is denied (os error 5)' on Windows:"
Write-Host "  npm run test:a2:integration:devnet   # uses public devnet RPC"
Write-Host "  wsl bash scripts/start-local-validator-wsl.sh"
Write-Host ""
Write-Host "Leave this window open. In another terminal:"
Write-Host "  npm run test:a2:integration"
Write-Host ""

& solana-test-validator --reset --ledger $Ledger `
  --clone-upgradeable-program metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s `
  --url https://api.mainnet-beta.solana.com
$exit = $LASTEXITCODE
if ($exit -ne 0) {
  Write-Host ""
  Write-Host "Validator exited with code $exit. See log:" -ForegroundColor Yellow
  Write-Host "  $Ledger\validator.log"
  Write-Host ""
  Write-Host "Windows workaround (no local validator):" -ForegroundColor Cyan
  Write-Host "  npm run test:a2:integration:devnet"
}
exit $exit

# Remove corrupted local validator ledger(s). Safe to run anytime the validator is stopped.

$ErrorActionPreference = "SilentlyContinue"

$paths = @(
  (Join-Path $env:LOCALAPPDATA "Smeltr\localnet-ledger"),
  "C:\smeltr-localnet-ledger"
)

$repoRoot = Split-Path $PSScriptRoot -Parent
foreach ($name in @(".localnet-ledger", "test-ledger")) {
  $p = Join-Path $repoRoot $name
  if (Test-Path $p) { $paths += $p }
}

foreach ($p in $paths) {
  if ($p -and (Test-Path $p)) {
    Write-Host "Removing $p"
    Remove-Item -LiteralPath $p -Recurse -Force
  }
}

Write-Host "Done. Start fresh with: npm run validator:local"

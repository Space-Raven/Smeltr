# Verify beta blocker env (local + optional production probe).
# Does NOT print secret values.

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path $PSScriptRoot -Parent

Write-Host ""
Write-Host "=== Smeltr beta readiness verify ===" -ForegroundColor Cyan
Write-Host ""

# --- Unit tests for assessBetaReadiness -----------------------------------
Write-Host "Running betaReadiness unit tests..." -ForegroundColor Yellow
Push-Location (Join-Path $repoRoot "apps\web")
try {
  cmd /c "npm run test:ci -- --testPathPattern=betaReadiness 2>&1"
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
} finally {
  Pop-Location
}

# --- Load env files for local assessment (names only) -----------------------
function Read-DotEnv([string]$path) {
  $map = @{}
  if (-not (Test-Path $path)) { return $map }
  Get-Content $path | ForEach-Object {
    if ($_ -match '^\s*#' -or $_ -match '^\s*$') { return }
    if ($_ -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$') {
      $map[$Matches[1]] = $Matches[2].Trim().Trim('"').Trim("'")
    }
  }
  return $map
}

$envMap = @{}
foreach ($f in @(
  (Join-Path $repoRoot ".env"),
  (Join-Path $repoRoot "apps\web\.env"),
  (Join-Path $repoRoot "apps\web\.env.local"),
  (Join-Path $repoRoot "apps\web\.env.production")
)) {
  $parsed = Read-DotEnv $f
  foreach ($k in $parsed.Keys) { $envMap[$k] = $parsed[$k] }
}

# Merge process env (overrides files)
foreach ($k in @(
  "NEXT_PUBLIC_SOLANA_RPC_URL",
  "CRON_SECRET",
  "PLATFORM_FOUNDER_PUBKEY",
  "PLATFORM_IRYS_PRIVATE_KEY",
  "NEXT_PUBLIC_PLATFORM_AUTHORITY_DENYLIST",
  "NEXT_PUBLIC_PLATFORM_FEE_RECIPIENT"
)) {
  if (Test-Path "env:$k") {
    $envMap[$k] = (Get-Item "env:$k").Value
  }
}

Write-Host ""
Write-Host "Local env presence (values hidden):" -ForegroundColor Cyan
$checks = @(
  "NEXT_PUBLIC_SOLANA_RPC_URL",
  "CRON_SECRET",
  "PLATFORM_FOUNDER_PUBKEY",
  "PLATFORM_IRYS_PRIVATE_KEY",
  "NEXT_PUBLIC_PLATFORM_AUTHORITY_DENYLIST",
  "NEXT_PUBLIC_PLATFORM_FEE_RECIPIENT"
)
foreach ($name in $checks) {
  $present = [bool]$envMap[$name]
  $color = if ($present) { "Green" } else { "Red" }
  Write-Host ("  {0,-42} {1}" -f $name, $(if ($present) { "set" } else { "MISSING" })) -ForegroundColor $color
}

$rpc = $envMap["NEXT_PUBLIC_SOLANA_RPC_URL"]
if ($rpc -and ($rpc -match 'api\.mainnet-beta\.solana\.com|api\.devnet\.solana\.com')) {
  Write-Host ""
  Write-Host "  WARNING: RPC is a public Solana endpoint - not suitable for production beta." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Manual blockers (cannot automate):" -ForegroundColor Cyan
Write-Host "  - Live mainnet mint smoke: npm run smoke:mainnet" -ForegroundColor White
Write-Host "  - Full checklist: docs/BETA_LAUNCH_CHECKLIST.md" -ForegroundColor White

# --- Optional production probe ----------------------------------------------
$prodUrl = $env:BETA_READINESS_URL
if (-not $prodUrl) { $prodUrl = "https://smeltr.org/api/ops/readiness" }
$secret = $envMap["CRON_SECRET"]

if ($secret) {
  Write-Host ""
  Write-Host "Probing production readiness ($prodUrl)..." -ForegroundColor Yellow
  try {
    $headers = @{ Authorization = "Bearer $secret" }
    $resp = Invoke-RestMethod -Uri $prodUrl -Headers $headers -TimeoutSec 15
    Write-Host ("  automatedReady: {0}" -f $resp.automatedReady) -ForegroundColor $(if ($resp.automatedReady) { "Green" } else { "Yellow" })
    foreach ($b in $resp.blockers) {
      $c = if ($b.automatedReady) { "Green" } else { "Yellow" }
      Write-Host ("  [{0}] {1}: {2}" -f $(if ($b.automatedReady) { "OK" } else { "!!" }), $b.label, $b.detail) -ForegroundColor $c
    }
    if ($null -ne $resp.rpc.reachable) {
      Write-Host ("  RPC reachable: {0} (slot {1})" -f $resp.rpc.reachable, $resp.rpc.slot) -ForegroundColor $(if ($resp.rpc.reachable) { "Green" } else { "Red" })
    }
  } catch {
    Write-Host "  Production probe failed: $($_.Exception.Message)" -ForegroundColor Red
  }
} else {
  Write-Host ""
  Write-Host "Set CRON_SECRET locally to probe production /api/ops/readiness." -ForegroundColor Gray
}

Write-Host ""

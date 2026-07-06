# Ensures a local validator is reachable, then runs tx-builder integration tests.
# On Windows, starts WSL validator automatically if nothing listens on :8899.

$ErrorActionPreference = "Stop"
$Rpc = if ($env:SOLANA_TEST_RPC) { $env:SOLANA_TEST_RPC } else { "http://127.0.0.1:8899" }

function Test-RpcHealth {
  param([string]$Url)
  try {
    $body = '{"jsonrpc":"2.0","id":1,"method":"getHealth"}'
    $r = Invoke-RestMethod -Uri $Url -Method POST -Body $body -ContentType "application/json" -TimeoutSec 3
    return $r.result -eq "ok"
  } catch {
    return $false
  }
}

function Start-WslValidator {
  Write-Host "No validator at $Rpc - starting WSL solana-test-validator..."
  Write-Host 'Use npm run validator:stop:wsl first if ports 8899/9900 are stuck.'
  Write-Host ""

  # Stop stale validators in a separate WSL invocation (pkill must not run in same shell as start).
  wsl -e bash -lc "pkill -f solana-test-validator || true" | Out-Null
  Start-Sleep -Seconds 2

  $startCmd =
    'rm -rf ~/smeltr-localnet-ledger && exec solana-test-validator --reset --ledger ~/smeltr-localnet-ledger --quiet ' +
    '--clone-upgradeable-program metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s ' +
    '--url https://api.mainnet-beta.solana.com'
  Start-Process -FilePath "wsl.exe" -ArgumentList @("-e", "bash", "-lc", $startCmd) -WindowStyle Minimized | Out-Null

  # First boot clones Metaplex from mainnet — allow extra time.
  $deadline = (Get-Date).AddSeconds(240)
  while ((Get-Date) -lt $deadline) {
    if (Test-RpcHealth $Rpc) {
      Write-Host "Validator ready at $Rpc"
      return
    }
    Start-Sleep -Seconds 2
  }
  throw "Timed out waiting for validator. Run: npm run validator:stop:wsl; npm run validator:local:wsl"
}

$isLocal = $Rpc -eq "http://127.0.0.1:8899" -or $Rpc -like "*127.0.0.1:8899*"

if ($isLocal) {
  if (-not (Test-RpcHealth $Rpc)) {
    $wsl = Get-Command wsl.exe -ErrorAction SilentlyContinue
    if ($wsl) {
      Start-WslValidator
    } else {
      throw "No validator at $Rpc and WSL is not installed. Try: npm run test:a2:integration:devnet"
    }
  }
} elseif (-not (Test-RpcHealth $Rpc)) {
  throw "Cannot reach SOLANA_TEST_RPC at $Rpc"
}

$repoRoot = Split-Path $PSScriptRoot -Parent
$txBuilder = Join-Path (Join-Path $repoRoot "packages") "tx-builder"
Push-Location $txBuilder
try {
  npm run test:integration
  exit $LASTEXITCODE
} finally {
  Pop-Location
}

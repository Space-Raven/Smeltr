# Stop WSL solana-test-validator (frees ports 8899 and 9900).
wsl -e bash -lc "pkill -f solana-test-validator || true"
Write-Host "WSL validator stopped (if one was running)."

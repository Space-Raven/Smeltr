#!/usr/bin/env bash
# Run inside WSL:  bash scripts/start-local-validator-wsl.sh
set -euo pipefail

LEDGER="${SMELTR_LOCALNET_LEDGER:-$HOME/smeltr-localnet-ledger}"
mkdir -p "$LEDGER"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=local-validator-clone.sh
source "$SCRIPT_DIR/local-validator-clone.sh"

echo ""
echo "Smeltr local validator (WSL)"
echo "  Ledger : $LEDGER"
echo "  RPC    : http://127.0.0.1:8899  (from WSL; Windows may use same via localhost)"
echo "  Clones : Metaplex Token Metadata ($METAPLEX_TOKEN_METADATA_PROGRAM)"
echo ""
echo "In another terminal (Windows or WSL):"
echo "  npm run test:a2:integration"
echo ""

exec solana-test-validator --reset --ledger "$LEDGER" "${smeltr_validator_clone_args[@]}"

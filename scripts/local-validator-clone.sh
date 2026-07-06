#!/usr/bin/env bash
# Classic SPL Metaplex integration tests require this upgradeable program on localnet.
# Sourced by start-local-validator-wsl.sh — do not run directly.

METAPLEX_TOKEN_METADATA_PROGRAM="metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
SMELTR_VALIDATOR_CLONE_URL="${SMELTR_VALIDATOR_CLONE_URL:-https://api.mainnet-beta.solana.com}"

smeltr_validator_clone_args=(
  --clone-upgradeable-program "$METAPLEX_TOKEN_METADATA_PROGRAM"
  --url "$SMELTR_VALIDATOR_CLONE_URL"
)

# Smeltr — Developer Environment Setup

## System

| Component | Spec |
|---|---|
| GPU | NVIDIA GeForce RTX 4060 8 GB VRAM |
| RAM | 16 GB |
| CPU | Intel i5-14600KF (14 cores / 20 threads) |
| OS | Windows 11 |
| Node | ≥ 18 (check: `node --version`) |
| Solana CLI | 4.0.2 Agave (`solana --version`) |

---

## Running the test suite

### Unit tests (no validator required)

```powershell
cd packages\tx-builder
npm run test:unit
```

### Devnet / integration tests (requires validator)

The Solana test validator **cannot run natively on Windows** due to an OS
error (code 5 / Access Denied) during genesis archive extraction, even as
Administrator. Use WSL2 instead.

#### One-time WSL2 setup

```powershell
# Admin PowerShell — enable WSL2
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
wsl --set-default-version 2
# Reboot, then open Ubuntu from Start menu
```

#### Install Solana CLI inside WSL

```bash
# In Ubuntu (WSL) terminal
sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
echo 'export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
solana --version
```

#### Start the validator (run once per dev session)

```bash
# In Ubuntu (WSL) terminal — leave this running
solana-test-validator --reset
```

WSL2 port forwarding exposes port 8899 to Windows automatically.
Confirm it's up from PowerShell:

```powershell
Invoke-WebRequest "http://127.0.0.1:8899" -Method POST `
  -ContentType "application/json" `
  -Body '{"jsonrpc":"2.0","id":1,"method":"getSlot"}' `
  -UseBasicParsing | Select-Object -ExpandProperty Content
```

#### Run devnet tests

```powershell
# In a normal (non-admin) PowerShell window, validator must be running
cd packages\tx-builder
npm run test:devnet
```

### Full suite

```powershell
cd packages\tx-builder
npm test
```

`--detectOpenHandles` is baked into all test scripts to surface any
lingering async handles that would prevent Jest from exiting cleanly.
`--runInBand` is required for devnet tests (single validator instance,
sequential transaction ordering).

---

## Jest configuration

**File:** `packages/tx-builder/jest.config.js`

Key decisions:

- **`preset: "ts-jest"`** — TypeScript compilation via ts-jest, not Babel.
  Babel cannot handle TypeScript type syntax (`as`, `!`, return type
  annotations).
- **`testMatch: ["**/__tests__/**/*.test.ts"]`** — only `*.test.ts` files
  are treated as test suites. Fixture helpers in `__tests__/fixtures/`
  are excluded.
- **`transformIgnorePatterns`** — uses `[/\\]` to match both forward and
  back slashes on Windows. Includes `rpc-websockets` and `uuid` in the
  transform allowlist because `rpc-websockets` (a `@solana/web3.js` dep)
  ships an ESM-only `uuid` internally that Jest cannot load as CJS without
  transformation.
- **`transform: "^.+\\.[tj]sx?$"`** — extends ts-jest to also process `.js`
  files, which is required for the ESM uuid inside rpc-websockets.
- **`moduleNameMapper`** — resolves `@platform/*` workspace packages to
  their TypeScript source directly, bypassing the need for a build step
  during testing.
- **`testTimeout: 60000`** — devnet tests hit real RPC endpoints; 60s
  allows for validator cold-start and transaction confirmation.

---

## Fixture system

**Files:** `packages/tx-builder/src/__tests__/fixtures/`

- `localnet.ts` — connection factory, keypair persistence, airdrop helper
  with validator readiness polling, `sendAndConfirm` wrapper
- `index.ts` — re-exports

**Payer persistence:** The fee payer keypair is saved to
`__tests__/fixtures/.cache/payer.json` on first run and reloaded on
subsequent runs. This avoids re-airdropping on every test run (airdrop
confirmation adds ~1–2s). The `.cache/` directory is gitignored.

**`setupLocalnet()` lifecycle:**
```typescript
const ctx = setupLocalnet(); // registers beforeAll with 90s timeout

it("my test", async () => {
  ctx.connection // Connection to localnet
  ctx.payer     // Funded Keypair
});
```

The 90s `beforeAll` timeout covers validator cold-start (can take 10–30s
for the first slot) plus airdrop confirmation.

---

## ComfyUI / AI asset pipeline

**Files:** `comfyui/`

Used for generating Pjorg character assets. Not required for core
development — only needed when producing new UI art assets.

See `comfyui/README.md` for download links and full setup instructions.

**ComfyUI Desktop is already installed.** Data location (`local-appdata` mode):
```
C:\Users\joshk\AppData\Local\Comfy-Desktop\ComfyUI-Installs\ComfyUI\ComfyUI\
```

**Required downloads (manual):**
- Counterfeit V3.0 base model: https://civitai.com/models/4468 → `models\checkpoints\`
- kl-f8-anime2 VAE: https://huggingface.co/hakurei/waifu-diffusion-v1-4 → `models\vae\`
- kohya_ss (LoRA trainer): https://github.com/bmaltais/kohya_ss

**Note:** Admin PowerShell is required for recursive directory listings under
`%LOCALAPPDATA%` (Overwolf and other processes lock subdirectories).

**LoRA training on this machine:** RTX 4060 8GB handles SD 1.5 LoRA
training comfortably (batch size 2, ~15 min for 1500 steps). SDXL is
possible at batch size 1 with all memory optimisations. Flux is not
feasible (needs 16GB+ VRAM).

---

## GitHub MCP

**Status: configured but not active (Cowork platform bug)**

The MCP server (`@modelcontextprotocol/server-github`) is installed
globally and confirmed working when invoked directly. Claude Desktop /
Cowork is not loading it despite a valid `claude_desktop_config.json`.
This appears to be a Cowork-specific issue with third-party MCP loading
on Windows. Revisit when Cowork updates.

**Config location:** `%APPDATA%\Claude\claude_desktop_config.json`
**Server binary:** `%APPDATA%\npm\mcp-server-github.cmd`
**Setup guide:** `docs/github-mcp-setup.md`

---

## Vercel deployment

**Status: vercel.json created, account setup pending**

`vercel.json` is at the repo root. When ready to deploy:

```powershell
npm install -g vercel
cd "C:\Users\joshk\Token-Platform-Merged"
vercel login
vercel link
vercel env add DATABASE_URL
vercel env add SESSION_JWT_SECRET
vercel env add NEXT_PUBLIC_APP_DOMAIN
vercel env add NEXT_PUBLIC_SOLANA_RPC_URL
vercel --prod
```

Environment variable names in `vercel.json` use the `@smeltr_*` secret
naming convention — set the matching secret names in the Vercel dashboard.

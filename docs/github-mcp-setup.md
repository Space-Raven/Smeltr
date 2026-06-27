# GitHub MCP Setup

Adds GitHub tools (create issues, review PRs, list branches, push files, etc.)
directly into your Claude Cowork chat.

## 1. Create a GitHub Personal Access Token

1. Go to https://github.com/settings/tokens?type=beta (fine-grained PAT)
2. Click **Generate new token**
3. Set expiration: 90 days (or "No expiration" for dev use)
4. Under **Repository access** → select your Smeltr repo
5. Grant these permissions:
   - **Contents**: Read & Write
   - **Issues**: Read & Write
   - **Pull requests**: Read & Write
   - **Metadata**: Read (auto-selected)
6. Copy the token — you won't see it again

## 2. Add to Claude Desktop config

Open (or create):
```
C:\Users\joshk\AppData\Roaming\Claude\claude_desktop_config.json
```

Add the `github` block inside `mcpServers`:

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "YOUR_TOKEN_HERE"
      }
    }
  }
}
```

If the file already has other MCP servers, merge the `"github"` key into the
existing `mcpServers` object — don't replace the whole file.

## 3. Restart Claude

Fully quit Claude (system tray → Quit) and relaunch. The GitHub tools will
appear as available in your next session.

## What you get

- `create_issue` — file bugs, tasks, features without leaving chat
- `list_pull_requests` / `create_pull_request` — PR workflow from chat
- `get_file_contents` / `push_files` — read/write repo files via API
- `create_branch` / `list_branches` — branch management
- `search_code` — codebase search via GitHub's index
- `list_commits` — recent commit history

## Troubleshooting

- **"spawn npx ENOENT"**: Node/npm not on PATH for Claude's process.
  Fix: use absolute path — replace `"npx"` with the output of `where npx`
  in PowerShell (e.g. `C:\\Program Files\\nodejs\\npx.cmd`).
- **401 errors**: Token expired or wrong permissions — regenerate.

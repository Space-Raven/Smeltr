# Creates Claude Desktop MCP config with GitHub server pre-wired.
# Run this AFTER generating your new GitHub PAT.
# Usage: powershell -ExecutionPolicy Bypass -File .\docs\create-claude-config.ps1

$configDir  = "$env:APPDATA\Claude"
$configPath = "$configDir\claude_desktop_config.json"

# Prompt for token — reads silently so it doesn't appear in terminal history
$token = Read-Host "Paste your new GitHub PAT" -AsSecureString
$tokenPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($token)
)

$config = @{
    mcpServers = @{
        github = @{
            command = "npx"
            args    = @("-y", "@modelcontextprotocol/server-github")
            env     = @{
                GITHUB_PERSONAL_ACCESS_TOKEN = $tokenPlain
            }
        }
    }
} | ConvertTo-Json -Depth 5

New-Item -ItemType Directory -Force -Path $configDir | Out-Null
Set-Content -Path $configPath -Value $config -Encoding UTF8

Write-Host "`nCreated: $configPath" -ForegroundColor Green
Write-Host "Restart Claude Desktop to load the GitHub MCP." -ForegroundColor Cyan

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$wrangler = Join-Path $env:APPDATA 'npm\wrangler.cmd'
if (-not (Test-Path -LiteralPath $wrangler)) {
  $command = Get-Command wrangler.cmd -ErrorAction SilentlyContinue
  if (-not $command) { throw 'Wrangler CLI is not installed or not on PATH.' }
  $wrangler = $command.Source
}

$bytes = New-Object byte[] 48
$rng = [Security.Cryptography.RandomNumberGenerator]::Create()
try { $rng.GetBytes($bytes) } finally { $rng.Dispose() }
$token = [Convert]::ToBase64String($bytes).TrimEnd('=').Replace('+','-').Replace('/','_')

# Send the secret through stdin to Wrangler. Never echo or persist it in project files.
$token | & $wrangler secret put ADMIN_TOKEN --config (Join-Path $root 'wrangler.jsonc') | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Wrangler did not accept the ADMIN_TOKEN secret.' }

Set-Clipboard -Value $token
$token = $null
$bytes = $null
Write-Host 'ADMIN_TOKEN has been rotated and stored as a Cloudflare Worker Secret.'
Write-Host 'The new token is copied to your clipboard; paste it into the /admin login page and store it safely.'
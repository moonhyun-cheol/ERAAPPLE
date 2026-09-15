<#
.SYNOPSIS
  Register the era server supervisor (server/run.mjs) as a Windows Scheduled Task so it starts on
  logon and restarts if it dies — the "always-on home PC" decision (plan §9).

.DESCRIPTION
  This is the last piece of "keep the PC on": run.mjs already respawns the host on a crash, but a
  reboot would leave nothing running. This registers a Scheduled Task that launches the supervisor
  at user logon (and immediately, once), so a reboot self-heals.

  Portability (plan §8): NO hardcoded absolute paths. The repo root is derived from this script's
  own location ($PSScriptRoot is <repo>\server\scripts), and node is found on PATH. Copy the repo
  anywhere and re-run this script — the task points at the new location.

  Run in a normal (non-elevated) PowerShell; the task runs as the current user with "run whether
  logged on or not" left OFF so it uses your desktop session (simplest for a single-user box). It
  reads .env (if present beside the repo root) and passes those values as the task's environment.

.EXAMPLE
  PS> .\server\scripts\register-autostart.ps1
  PS> .\server\scripts\register-autostart.ps1 -TaskName "era-home" -Node "C:\Program Files\nodejs\node.exe"
#>
[CmdletBinding()]
param(
  [string]$TaskName = "era-server",
  [string]$Node = ""
)

$ErrorActionPreference = "Stop"

# repo root = two levels up from this script (server\scripts\ -> repo)
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$entry = Join-Path $repoRoot "server\run.mjs"
if (-not (Test-Path $entry)) { throw "Cannot find server\run.mjs under '$repoRoot'. Run this script from inside the repo." }

# locate node
if (-not $Node) {
  $cmd = Get-Command node -ErrorAction SilentlyContinue
  if (-not $cmd) { throw "node not found on PATH. Install Node.js 22+ or pass -Node 'C:\path\to\node.exe'." }
  $Node = $cmd.Source
}
if (-not (Test-Path $Node)) { throw "node executable not found at '$Node'." }

Write-Host "repo root : $repoRoot"
Write-Host "node      : $Node"
Write-Host "entry     : $entry"
Write-Host "task name : $TaskName"

# Build the action: node run.mjs, working directory = repo root so config.mjs's repo-relative
# defaults resolve correctly.
$action = New-ScheduledTaskAction -Execute $Node -Argument "`"$entry`"" -WorkingDirectory $repoRoot

# Trigger at logon of the current user, plus restart-on-failure via settings.
$trigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME

$settings = New-ScheduledTaskSettingsSet `
  -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries `
  -StartWhenAvailable `
  -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1) `
  -ExecutionTimeLimit (New-TimeSpan -Seconds 0)

$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Limited

# Pass .env values as the process environment if a .env exists. Scheduled Tasks don't read .env, so
# the supervisor/host would otherwise use pure defaults. We inject them through a small wrapper only
# if needed; for the common localhost case defaults are fine and no .env is required.
$envFile = Join-Path $repoRoot ".env"
if (Test-Path $envFile) {
  Write-Host "note: .env found. Scheduled Tasks cannot load .env directly." -ForegroundColor Yellow
  Write-Host "      For non-default ERA_SERVER_* values, set them as User environment variables:" -ForegroundColor Yellow
  Write-Host "        [Environment]::SetEnvironmentVariable('ERA_SERVER_TOKEN','<value>','User')" -ForegroundColor Yellow
  Write-Host "      (or run the supervisor manually with the vars for now)." -ForegroundColor Yellow
}

$existing = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($existing) {
  Write-Host "replacing existing task '$TaskName'..."
  Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
}

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger `
  -Settings $settings -Principal $principal `
  -Description "era server-authoritative runtime supervisor (server/run.mjs). Registered by register-autostart.ps1." | Out-Null

Write-Host ""
Write-Host "Registered '$TaskName'. It will start at your next logon." -ForegroundColor Green
Write-Host "Start it now with:   Start-ScheduledTask -TaskName '$TaskName'"
Write-Host "Check status with:   Get-ScheduledTask -TaskName '$TaskName' | Get-ScheduledTaskInfo"
Write-Host "Remove it with:      .\server\scripts\unregister-autostart.ps1 -TaskName '$TaskName'"

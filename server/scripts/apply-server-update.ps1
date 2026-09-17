<#
.SYNOPSIS
  Apply a pulled server update: verify the tracked runtime, then restart the scheduled server task.

.DESCRIPTION
  Run this from any location after `git pull --ff-only origin server`. The script derives the
  repository root from its own path, runs the repository's focused runtime tests, and only after
  they pass restarts the scheduled task so Node imports the newly pulled engine.

  If the server is run manually instead of as a Scheduled Task, the script prints the exact manual
  restart command and does not try to terminate unrelated Node processes.

.EXAMPLE
  PS> git pull --ff-only origin server
  PS> .\server\scripts\apply-server-update.ps1

.EXAMPLE
  PS> .\server\scripts\apply-server-update.ps1 -TaskName "era-home"
#>
[CmdletBinding()]
param(
  [string]$TaskName = "era-server"
)

$ErrorActionPreference = "Stop"
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$packageFile = Join-Path $repoRoot "package.json"
$entry = Join-Path $repoRoot "server\run.mjs"

if (-not (Test-Path $packageFile) -or -not (Test-Path $entry)) {
  throw "Cannot find package.json and server\run.mjs under '$repoRoot'."
}

$npm = Get-Command npm.cmd -ErrorAction SilentlyContinue
if (-not $npm) { $npm = Get-Command npm -ErrorAction SilentlyContinue }
if (-not $npm) { throw "npm was not found on PATH. Install Node.js 24 or newer first." }

Write-Host "Repository : $repoRoot"
Write-Host "Step 1/2   : verify the pulled server engine (npm test)" -ForegroundColor Cyan
Push-Location $repoRoot
try {
  & $npm.Source test
  if ($LASTEXITCODE -ne 0) {
    throw "npm test failed with exit code $LASTEXITCODE. The running server was not restarted."
  }
} finally {
  Pop-Location
}

Write-Host "Step 2/2   : restart the server so it imports the new engine" -ForegroundColor Cyan
$task = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if (-not $task) {
  Write-Host "No Scheduled Task named '$TaskName' was found." -ForegroundColor Yellow
  Write-Host "If the server is running manually, stop its console with Ctrl+C and run:"
  Write-Host "  node server\run.mjs" -ForegroundColor Yellow
  Write-Host "Then refresh the PC/phone browser to open a new WebSocket session."
  return
}

Stop-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Start-ScheduledTask -TaskName $TaskName
Start-Sleep -Seconds 2
$info = Get-ScheduledTask -TaskName $TaskName | Get-ScheduledTaskInfo

Write-Host "Update applied and '$TaskName' restarted." -ForegroundColor Green
Write-Host "Last run    : $($info.LastRunTime)"
Write-Host "Last result : $($info.LastTaskResult)"
Write-Host "Refresh the PC/phone browser to open a new WebSocket session." -ForegroundColor Green

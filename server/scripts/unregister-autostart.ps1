<#
.SYNOPSIS
  Remove the era server Scheduled Task created by register-autostart.ps1.

.EXAMPLE
  PS> .\server\scripts\unregister-autostart.ps1
  PS> .\server\scripts\unregister-autostart.ps1 -TaskName "era-home"
#>
[CmdletBinding()]
param(
  [string]$TaskName = "era-server"
)

$ErrorActionPreference = "Stop"

$existing = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if (-not $existing) {
  Write-Host "No scheduled task named '$TaskName' — nothing to remove."
  return
}

# Stop it first if it is running, then remove.
try { Stop-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue } catch {}
Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
Write-Host "Removed scheduled task '$TaskName'." -ForegroundColor Green

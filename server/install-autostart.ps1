param([string]$TaskName = 'Jeju-Tour-Server')
$ErrorActionPreference = 'Stop'
$serverRoot = $PSScriptRoot
$nodePath = (Get-Command node.exe -ErrorAction Stop).Source
$identity = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = New-Object Security.Principal.WindowsPrincipal($identity)
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
  throw 'Run PowerShell as administrator to install the startup task.'
}
# The task runs under the current Windows account at logon, without a visible window.
# Run only after moving the complete project to its final location.
$runner = Join-Path $serverRoot 'run-hidden.ps1'
$arguments = '-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File "' + $runner + '" -NodePath "' + $nodePath + '"'
$action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument $arguments -WorkingDirectory (Split-Path $serverRoot)
$trigger = New-ScheduledTaskTrigger -AtLogOn -User $identity.Name
$settings = New-ScheduledTaskSettingsSet -Hidden -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -ExecutionTimeLimit ([TimeSpan]::Zero) -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1) -MultipleInstances IgnoreNew
$taskPrincipal = New-ScheduledTaskPrincipal -UserId $identity.Name -LogonType Interactive -RunLevel Limited
Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings -Principal $taskPrincipal -Force | Out-Null
Write-Host "Installed: $TaskName. Starts at your next Windows logon."
Write-Host "Start now: Start-ScheduledTask -TaskName '$TaskName'"
Write-Host "Remove: Unregister-ScheduledTask -TaskName '$TaskName'"

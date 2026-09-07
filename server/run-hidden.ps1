param([string]$NodePath = 'node.exe')
$ErrorActionPreference = 'Stop'
$logDirectory = Join-Path $PSScriptRoot 'logs'
New-Item -ItemType Directory -Path $logDirectory -Force | Out-Null
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$entryPath = Join-Path $PSScriptRoot 'index.mjs'
$process = Start-Process -FilePath $NodePath -ArgumentList ('"' + $entryPath + '"') -WorkingDirectory (Split-Path $PSScriptRoot) -WindowStyle Hidden -PassThru -Wait -RedirectStandardOutput (Join-Path $logDirectory "$stamp-output.log") -RedirectStandardError (Join-Path $logDirectory "$stamp-error.log")
exit $process.ExitCode

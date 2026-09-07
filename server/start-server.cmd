@echo off
setlocal
cd /d "%~dp0.."
where node >nul 2>nul
if errorlevel 1 (
  echo Please install Node.js 24.14 or newer in the 24.x series, then run this file again.
  pause
  exit /b 1
)
node server\index.mjs
pause

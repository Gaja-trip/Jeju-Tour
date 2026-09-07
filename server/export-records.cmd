@echo off
setlocal
cd /d "%~dp0.."
node server\manage.mjs export
pause

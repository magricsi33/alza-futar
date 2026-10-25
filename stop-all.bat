@echo off
setlocal
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\local-dev.ps1" -Stop
if /i not "%~1"=="--no-pause" pause

@echo off
setlocal
cd /d "%~dp0"
title Uton - Helyi fejlesztes
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\local-dev.ps1"
set "result=%errorlevel%"
if /i not "%~1"=="--no-pause" pause
exit /b %result%

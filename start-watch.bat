@echo off
setlocal
cd /d "%~dp0"
title Uton - Mix Watch
echo A teljes, automatikus inditashoz hasznald a start-all.bat fajlt.
echo Ez a figyelo alapertelmezetten a 127.0.0.1:8000 szerverhez kapcsolodik.
call npm.cmd run watch
pause

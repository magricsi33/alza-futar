@echo off
title SpiritGaming - Laravel Server
color 0A
echo ================================
echo  SpiritGaming - Laravel Server
echo  http://127.0.0.1:8000
echo ================================
echo.
cd /d "%~dp0"
php artisan serve
pause

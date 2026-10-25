@echo off
title SpiritGaming - Start All
echo ================================
echo  SpiritGaming - Inditas...
echo ================================
echo.

cd /d "%~dp0"

echo [1/2] Laravel szerver inditasa...
start "SpiritGaming - Laravel Server" cmd /k "cd /d "%~dp0" && color 0A && php artisan serve"

timeout /t 2 /nobreak >nul

echo [2/2] Tailwind build + BrowserSync inditasa...
start "SpiritGaming - Mix Watch" cmd /k "cd /d "%~dp0" && color 0B && npm run watch"

echo.
echo Minden elindult!
echo  Laravel:     http://127.0.0.1:8000
echo  BrowserSync: http://localhost:3000
echo.
timeout /t 4 /nobreak >nul

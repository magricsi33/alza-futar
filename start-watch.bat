@echo off
title SpiritGaming - Mix Watch + BrowserSync
color 0B
echo =============================================
echo  SpiritGaming - Tailwind Build + BrowserSync
echo  http://localhost:3000  (auto-refresh)
echo =============================================
echo.
echo [!] Eloszor inditsd el a start-server.bat-ot!
echo.
timeout /t 3 /nobreak >nul
cd /d "%~dp0"
npm run watch
pause

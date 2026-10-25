@echo off
setlocal
cd /d "%~dp0"
title Uton - Laravel
where php >nul 2>nul
if errorlevel 1 (
    echo HIBA: A PHP nem talalhato a PATH-ban.
    pause
    exit /b 1
)
php artisan serve --host=127.0.0.1 --port=8000 --no-reload
echo A szerver leallt. Foglalt port eseten hasznald a start-all.bat fajlt.
pause

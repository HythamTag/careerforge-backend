@echo off
cd /d "%~dp0"
cd ..
setlocal
title CareerForge - Stop Services

echo ========================================================
echo   CAREERFORGE - STOPPING SERVICES
echo ========================================================
echo.

echo [1/3] Stopping Docker services...
docker compose --profile gpu-3090 --profile gpu-3060 --profile cpu down >nul 2>&1
echo OK Docker services stopped
echo.

echo [2/3] Stopping Node.js processes...
taskkill /f /im node.exe >nul 2>&1
echo OK Node.js processes stopped
echo.

echo [3/3] Closing terminal windows...
taskkill /f /im cmd.exe /fi "WINDOWTITLE eq CareerForge*" >nul 2>&1
echo OK Cleanup complete
echo.

echo ========================================================
echo   ALL SERVICES STOPPED
echo ========================================================
echo.
pause

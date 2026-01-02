@echo off
cd /d "%~dp0"
title CareerForge - Kill Tunnels

echo ========================================================
echo   CAREERFORGE - KILL TUNNELS
echo ========================================================
echo.
echo Stopping all Ngrok tunnel processes...
echo.

taskkill /F /IM ngrok.exe >nul 2>&1

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [SUCCESS] All tunnels stopped.
) else (
    echo.
    echo [INFO] No running tunnels found.
)

echo.
pause

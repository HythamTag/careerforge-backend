@echo off
cd /d "%~dp0"

echo.
echo ========================================
echo   DOCKER DESKTOP NUCLEAR RESET
echo ========================================
echo.

REM Check for Administrator privileges
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] This script MUST be run as Administrator!
    echo Right-click and select "Run as administrator".
    pause
    exit /b 1
)

echo [1/6] Killing ALL Docker processes...
taskkill /f /im "Docker Desktop.exe" >nul 2>&1
taskkill /f /im "com.docker.backend.exe" >nul 2>&1
taskkill /f /im "com.docker.service.exe" >nul 2>&1
taskkill /f /im "com.docker.proxy.exe" >nul 2>&1
taskkill /f /im "com.docker.dev-envs.exe" >nul 2>&1
taskkill /f /im "dockerd.exe" >nul 2>&1
taskkill /f /im "vpnkit.exe" >nul 2>&1
taskkill /f /im "vpnkit-bridge.exe" >nul 2>&1
echo OK Docker processes killed
echo.

echo [2/6] Stopping Docker Desktop Service...
net stop com.docker.service >nul 2>&1
echo OK
echo.

echo [3/6] Shutting down WSL2...
wsl --shutdown >nul 2>&1
echo OK WSL2 shutdown complete
echo.

echo [4/6] Clearing Docker cache...
del /f /q "%APPDATA%\Docker\settings.json.bak" >nul 2>&1
del /f /q /s "%LOCALAPPDATA%\Docker\log\*" >nul 2>&1
echo OK Cache cleared
echo.

echo [5/6] Waiting for cleanup (5 seconds)...
timeout /t 5 /nobreak >nul
echo OK Cleanup complete
echo.

echo [6/6] Starting Docker Desktop...
start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
echo OK Docker Desktop is starting
echo.

echo ========================================
echo   RESET COMPLETE
echo ========================================
echo.
echo Wait for Docker Desktop whale icon to stop animating,
echo then run START.bat as Administrator.
echo.
pause

@echo off
cd /d "%~dp0"
cd ..\..
setlocal
title CareerForge AI Tunnel Manager (AI ONLY)

echo ========================================================
echo   CAREERFORGE AI TUNNEL MANAGER (AI CONTAINERS ONLY)
echo ========================================================
echo.
echo This script will:
echo   1. Start ONLY the AI Docker containers (Parser, Optimizer, ATS)
echo   2. Start Ngrok tunnel for port 11434 (Parser)
echo.

echo Choose your Hardware Profile:
echo   [1] CPU (Standard)
echo   [2] RTX 3060 (12GB VRAM)
echo   [3] RTX 3090 (24GB VRAM)
echo.
set /p profile="Enter choice (1-3): "

if "%profile%"=="1" (
    set SERVICES=parser-cpu optimizer-cpu ats-cpu
    set PROFILE_FLAG=--profile cpu
)
if "%profile%"=="2" (
    set SERVICES=parser-3060 optimizer-3060 ats-3060
    set PROFILE_FLAG=--profile gpu-3060
)
if "%profile%"=="3" (
    set SERVICES=parser-3090 optimizer-3090 ats-3090
    set PROFILE_FLAG=--profile gpu-3090
)

if not defined SERVICES (
    echo Invalid choice. Defaulting to CPU.
    set SERVICES=parser-cpu optimizer-cpu ats-cpu
    set PROFILE_FLAG=--profile cpu
)

echo.
echo [1/2] Launching AI Containers ONLY...
echo Target Services: %SERVICES%
start "Docker AI" /wait cmd /c "docker compose %PROFILE_FLAG% up -d %SERVICES% && echo. && echo AI Containers Started! && timeout /t 2 >nul"

echo.
echo Waiting for containers to stabilize...
timeout /t 5 /nobreak >nul

echo.
echo [2/2] Launching Ngrok (Port 11434)...
start "Ngrok Tunnel" cmd /k "ngrok http 11434"

echo.
echo ========================================================
echo   SUCCESS!
echo ========================================================
echo.
echo   [INSTRUCTIONS]
echo   1. Look at the "Ngrok Tunnel" window.
echo   2. Copy the HTTPS URL (e.g., https://abc-123.ngrok-free.app).
echo   3. This is your PUBLIC AI URL.
echo.
pause

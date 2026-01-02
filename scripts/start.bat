@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"
cd ..
title CareerForge - Start Services

echo ========================================================
echo   CAREERFORGE - STARTING SERVICES [RTX 3090 OPTIMIZED]
echo ========================================================
echo.

REM [0/8] Check for Administrator privileges
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] This script MUST be run as Administrator to access Docker pipes.
    echo Please right-click START.bat and select "Run as administrator".
    pause
    exit /b 1
)

REM [1/8] Check Docker
echo [1/8] Checking Docker...
docker info >nul 2>&1
if errorlevel 1 (
    echo X Docker is not responding! Please ensure Docker Desktop is running.
    pause
    exit /b 1
)
echo OK Docker is online
echo.

REM [2/8] Choose Profile (Hardware)
echo [2/8] Select Hardware Profile:
echo   1. RTX 3090 (24GB VRAM) - High Performance
echo   2. RTX 3060 (12GB VRAM) - Balanced
echo   3. CPU Only (No GPU)    - Fallback
echo.
set /p profile_choice="Enter choice (1-3): "

if "%profile_choice%"=="1" (
    set DOCKER_PROFILE=gpu-3090
    echo Checking GPU...
    nvidia-smi >nul 2>&1
    if !errorlevel! neq 0 (
        echo [WARNING] RTX 3090 profile selected but no NVIDIA GPU found!
        echo Falling back to CPU...
        set DOCKER_PROFILE=cpu
    )
) else if "%profile_choice%"=="2" (
    set DOCKER_PROFILE=gpu-3060
    nvidia-smi >nul 2>&1
    if !errorlevel! neq 0 (
        echo [WARNING] RTX 3060 profile selected but no NVIDIA GPU found!
        echo Falling back to CPU...
        set DOCKER_PROFILE=cpu
    )
) else (
    set DOCKER_PROFILE=cpu
)
echo Using profile: %DOCKER_PROFILE%
echo.

REM [3/8] Cleanup old processes
echo [3/8] Cleaning up old processes...
docker stop cv-enhancer-puppeteer cv-enhancer-mongodb cv-enhancer-redis cv-enhancer-webui ollama-parser ollama-optimizer ollama-ats >nul 2>&1
docker rm -f cv-enhancer-puppeteer cv-enhancer-mongodb cv-enhancer-mongodb-setup cv-enhancer-redis cv-enhancer-webui ollama-parser ollama-optimizer ollama-ats >nul 2>&1
taskkill /f /im node.exe >nul 2>&1
echo OK Cleanup complete
echo.

REM [4/8] Start Docker services
echo [4/8] Starting Docker services...
docker compose --profile %DOCKER_PROFILE% up -d
if errorlevel 1 (
    echo X Failed to start Docker services!
    pause
    exit /b 1
)
echo OK Docker services started
timeout /t 5 /nobreak >nul
echo.

REM [5/8] Pull Models (Centralized)
echo [5/8] Pulling AI Models...
REM Extract models from .env
for /f "tokens=2 delims==" %%a in ('findstr "AI_MODEL_PARSER_OLLAMA=" .env') do set PARSER_MODEL=%%a
for /f "tokens=2 delims==" %%a in ('findstr "AI_MODEL_OPTIMIZER_OLLAMA=" .env') do set OPTIMIZER_MODEL=%%a
for /f "tokens=2 delims==" %%a in ('findstr "AI_MODEL_ATS_FEEDBACK=" .env') do set ATS_MODEL=%%a

echo   - Pulling %PARSER_MODEL% for Parser...
docker exec ollama-parser ollama pull %PARSER_MODEL%
echo   - Pulling %OPTIMIZER_MODEL% for Optimizer...
docker exec ollama-optimizer ollama pull %OPTIMIZER_MODEL%
echo   - Pulling %ATS_MODEL% for ATS...
docker exec ollama-ats ollama pull %ATS_MODEL%
echo OK Models ready
echo.

REM [6/8] Install Node Dependencies
echo [6/8] Checking node_modules...
if not exist "backend\node_modules" (
    echo Installing backend...
    cd backend && call npm install && cd ..
)
if not exist "frontend\node_modules" (
    echo Installing frontend...
    cd frontend && call npm install && cd ..
)
echo OK Dependencies ready
echo.

REM [7/8] Start Core Services
echo [7/8] Launching API, Worker, and Frontend...
set VITE_API_TARGET=http://localhost:5000

where wt >nul 2>&1
if %errorlevel% equ 0 (
    wt -w 0 new-tab -p "Command Prompt" --title "CareerForge - API" -d "%cd%\backend" cmd /k "npm run dev" ; ^
       new-tab -p "Command Prompt" --title "CareerForge - Worker" -d "%cd%\backend" cmd /k "npm run worker:dev" ; ^
       new-tab -p "Command Prompt" --title "CareerForge - Frontend" -d "%cd%\frontend" cmd /k "npm run dev"
) else (
    start "CareerForge - API" cmd /k "cd backend && npm run dev"
    start "CareerForge - Worker" cmd /k "cd backend && npm run worker:dev"
    start "CareerForge - Frontend" cmd /k "cd frontend && npm run dev"
)
echo OK All services launched
echo.

echo ========================================
echo   CV ENHANCER IS READY
echo ========================================
echo   Frontend: http://localhost:5173
echo   Swagger:  http://localhost:5000/v1/docs
echo   OllamaUI: http://localhost:8080
echo ========================================
pause

@echo off
cd /d "%~dp0"
cd ..\..
REM ========================================
REM CV ENHANCER - START ALL SERVICES
REM ========================================

title CV Enhancer - Starting Services

echo.
echo ========================================
echo   CV ENHANCER - STARTING
echo ========================================
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

REM Try to force a working context immediately
echo   - Verifying Docker context...
docker context use default >nul 2>&1

docker info >nul 2>&1
if errorlevel 1 (
    echo X Docker is not responding!
    echo.
    echo [TIP] If Docker Desktop is running, try:
    echo 1. Right-click Docker icon in Taskbar
    echo 2. Select "Restart Docker Desktop"
    echo.
    pause
    exit /b 1
)
echo OK Docker is online
echo.

REM [2/8] Clear old processes
echo [2/8] Clearing old processes...

echo   - Stopping Docker containers first...
docker stop cv-enhancer-puppeteer cv-enhancer-mongodb cv-enhancer-redis cv-enhancer-webui ollama-parser ollama-optimizer ollama-ats >nul 2>&1
docker rm -f cv-enhancer-puppeteer cv-enhancer-mongodb cv-enhancer-mongodb-setup cv-enhancer-redis cv-enhancer-webui ollama-parser ollama-optimizer ollama-ats >nul 2>&1

echo   - Killing Node processes...
taskkill /f /im node.exe >nul 2>&1

echo   - Clearing port 8080 (WebUI)...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":8080" ^| find "LISTENING"') do taskkill /f /pid %%a >nul 2>&1

echo OK Old processes cleared
echo.

REM [3/8] Check GPU
echo [3/8] Checking NVIDIA GPU...
nvidia-smi >nul 2>&1
if %errorlevel% neq 0 (
    echo X No NVIDIA GPU detected!
    echo GPU acceleration is REQUIRED for optimal performance.
    pause
    exit /b 1
)
echo OK NVIDIA GPU detected
echo.

REM [4/8] Start Docker services
echo [4/8] Starting Docker services...

echo.
echo Select Hardware Profile:
echo   1. RTX 3090 (24GB VRAM) - High Performance
echo   2. RTX 3060 (12GB VRAM) - Balanced
echo   3. CPU Only (No GPU)    - Fallback
echo.
set /p profile_choice="Enter choice (1-3): "

if "%profile_choice%"=="1" (
    set DOCKER_PROFILE=gpu-3090
    echo Starting with RTX 3090 profile...
) else if "%profile_choice%"=="2" (
    set DOCKER_PROFILE=gpu-3060
    echo Starting with RTX 3060 profile...
) else (
    set DOCKER_PROFILE=cpu
    echo Starting with CPU profile...
)

echo.
docker compose --profile %DOCKER_PROFILE% up -d
if errorlevel 1 (
    echo X Failed to start Docker services!
    pause
    exit /b 1
)

echo OK Docker services started
echo Waiting for services to initialize...
timeout /t 8 /nobreak >nul
echo.

REM [5/8] Provisioning AI Models
REM Each Ollama container has its own isolated volume, so we must pull to each
REM Read model names from .env
for /f "tokens=2 delims==" %%a in ('findstr "AI_MODEL_PARSER_OLLAMA=" .env') do set PARSER_MODEL=%%a
for /f "tokens=2 delims==" %%a in ('findstr "AI_MODEL_OPTIMIZER_OLLAMA=" .env') do set OPTIMIZER_MODEL=%%a
for /f "tokens=2 delims==" %%a in ('findstr "AI_MODEL_ATS_FEEDBACK=" .env') do set ATS_MODEL=%%a

echo [5/8] Provisioning AI Models...
echo   - Pulling %PARSER_MODEL% to Parser...
docker exec ollama-parser ollama pull %PARSER_MODEL%
echo   - Pulling %OPTIMIZER_MODEL% to Optimizer...
docker exec ollama-optimizer ollama pull %OPTIMIZER_MODEL%
echo   - Pulling %ATS_MODEL% to ATS...
docker exec ollama-ats ollama pull %ATS_MODEL%
echo OK All models ready
echo.

REM [6/8] Check dependencies
echo [6/8] Checking dependencies...
if not exist "backend\node_modules" (
    echo Installing backend dependencies...
    cd backend
    npm install >nul 2>&1
    cd ..
)
if not exist "frontend\node_modules" (
    echo Installing frontend dependencies...
    cd frontend
    npm install >nul 2>&1
    cd ..
)
echo OK Dependencies ready
echo.

REM [7/8] Start Backend + Worker
echo [7/8] Starting Backend API and Worker...

REM Check if Windows Terminal is available (wt.exe)
where wt >nul 2>&1
if %errorlevel% equ 0 (
    REM Use Windows Terminal with tabs
    wt -w 0 new-tab -p "Command Prompt" --title "Backend API" -d "%cd%\backend" cmd /k "npm run dev" ; ^
       new-tab -p "Command Prompt" --title "Worker" -d "%cd%\backend" cmd /k "npm run worker:dev" ; ^
       new-tab -p "Command Prompt" --title "Frontend" -d "%cd%\frontend" cmd /k "npm run dev"
    echo OK All services started in Windows Terminal tabs
) else (
    REM Fallback to separate windows
    start "CV Enhancer - Backend API" cmd /k "cd backend && npm run dev"
    timeout /t 3 /nobreak >nul
    start "CV Enhancer - Worker" cmd /k "cd backend && npm run worker:dev"
    start "CV Enhancer - Frontend" cmd /k "cd frontend && npm run dev"
    echo OK Backend and Frontend started (separate windows)
)
echo.

echo ========================================
echo   CV ENHANCER STARTED
echo ========================================
echo.
echo Services:
echo   Frontend:  http://localhost:5173
echo   API:       http://localhost:5000
echo   Ollama UI: http://localhost:8080
echo.
echo GPU Status:
nvidia-smi --query-gpu=name,memory.used,memory.total --format=csv,noheader 2>nul || echo   Run nvidia-smi manually to check
echo.
pause

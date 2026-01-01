@echo off
cd /d "%~dp0"
REM ========================================
REM CV ENHANCER - FIRST TIME SETUP
REM ========================================

title CV Enhancer - Setup

echo.
echo ========================================
echo   CV ENHANCER - SETUP
echo ========================================
echo.

REM [0/7] Check for Administrator privileges
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] This script MUST be run as Administrator!
    echo Right-click and select "Run as administrator".
    pause
    exit /b 1
)

REM [1/7] Check Docker
echo [1/7] Checking Docker...
docker --version >nul 2>&1
if errorlevel 1 (
    echo X Docker is not installed!
    echo Download: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

REM Verify Docker daemon is running
echo   - Verifying Docker context...
docker context use default >nul 2>&1
docker info >nul 2>&1
if errorlevel 1 (
    echo X Docker is installed but not running!
    echo Please start Docker Desktop first.
    pause
    exit /b 1
)
echo OK Docker installed and running
echo.

REM [2/7] Check Node.js
echo [2/7] Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo X Node.js is not installed!
    echo Download: https://nodejs.org/
    pause
    exit /b 1
)
echo OK Node.js installed
echo.

REM [3/7] Check NVIDIA GPU
echo [3/7] Checking NVIDIA GPU...
nvidia-smi >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] No NVIDIA GPU detected!
    echo You can still use CPU mode, but performance will be slower.
    echo.
    set /p CONTINUE="Continue anyway? (Y/N): "
    if /i not "%CONTINUE%"=="Y" (
        exit /b 1
    )
) else (
    echo OK NVIDIA GPU detected
)
echo.

REM [4/7] Check .env file
echo [4/7] Checking environment configuration...
if not exist ".env" (
    if exist ".env.example" (
        echo   - Creating .env from .env.example...
        copy ".env.example" ".env" >nul
        echo   - Please edit .env with your API keys!
    ) else (
        echo X .env file not found in project root!
        echo Please create .env file with your configuration.
        pause
        exit /b 1
    )
) else (
    echo OK .env file present
)
echo.

REM [5/7] Install backend dependencies
echo [5/7] Installing backend dependencies...
cd backend
call npm install
if errorlevel 1 (
    echo X Failed to install backend dependencies!
    cd ..
    pause
    exit /b 1
)
cd ..
echo OK Backend dependencies installed
echo.

REM [6/7] Install frontend dependencies
echo [6/7] Installing frontend dependencies...
cd frontend
call npm install
if errorlevel 1 (
    echo X Failed to install frontend dependencies!
    cd ..
    pause
    exit /b 1
)
cd ..
echo OK Frontend dependencies installed
echo.

REM [7/7] Pull Docker images (non-blocking)
echo [7/7] Pre-pulling Docker images...
echo   - This may take a few minutes on first run...
start /b cmd /c "docker pull mongo:latest >nul 2>&1"
start /b cmd /c "docker pull redis:7-alpine >nul 2>&1"
start /b cmd /c "docker pull ollama/ollama:latest >nul 2>&1"
start /b cmd /c "docker pull browserless/chrome:latest >nul 2>&1"
start /b cmd /c "docker pull ghcr.io/open-webui/open-webui:latest >nul 2>&1"
echo OK Docker images are being pulled in background
echo.

echo ========================================
echo   SETUP COMPLETE
echo ========================================
echo.
echo Next steps:
echo   1. Edit .env with your API keys (if needed)
echo   2. Run START.bat as Administrator to launch
echo   3. Access at http://localhost:5173
echo.
echo Utility scripts:
echo   - RESET_DOCKER.bat : Fix stuck Docker Desktop
echo   - STOP.bat         : Stop all services
echo.
pause

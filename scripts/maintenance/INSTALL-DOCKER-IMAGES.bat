@echo off
REM ========================================
REM CV ENHANCER - DOCKER IMAGES INSTALLER
REM ========================================
REM This script will:
REM 1. Check if Docker is installed
REM 2. Install Docker Desktop if needed (with instructions)
REM 3. Pull all required Docker images
REM 4. Verify images are ready
REM ========================================

title CV Enhancer - Docker Images Installer

echo.
echo ========================================
echo   CV ENHANCER - DOCKER IMAGES INSTALLER
echo ========================================
echo.
echo This script will download all required Docker images
echo for CV Enhancer to work properly.
echo.
echo Required images:
echo   - MongoDB (Database)
echo   - Redis (Job Queue)
echo   - Ollama (AI Server)
echo   - Ollama WebUI (AI Interface)
echo   - Browserless Chrome (PDF Generation)
echo.
pause

REM ========================================
REM [1/5] Check Docker Installation
REM ========================================
echo.
echo [1/5] Checking Docker installation...
docker --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo X Docker is NOT installed!
    echo.
    echo Please install Docker Desktop for Windows:
    echo   1. Download from: https://www.docker.com/products/docker-desktop
    echo   2. Install Docker Desktop
    echo   3. Start Docker Desktop
    echo   4. Run this script again
    echo.
    echo Opening Docker download page...
    start https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)
echo OK Docker is installed
docker --version

REM ========================================
REM [2/5] Check Docker is Running
REM ========================================
echo.
echo [2/5] Checking if Docker is running...
docker ps >nul 2>&1
if errorlevel 1 (
    echo.
    echo X Docker is not running!
    echo.
    echo Please:
    echo   1. Start Docker Desktop
    echo   2. Wait for it to fully start (whale icon in system tray)
    echo   3. Run this script again
    echo.
    pause
    exit /b 1
)
echo OK Docker is running

REM ========================================
REM [3/5] Pull Core Images (MongoDB + Redis)
REM ========================================
echo.
echo [3/5] Downloading Core Services...
echo This may take several minutes depending on your internet speed...
echo.
echo Downloading MongoDB (Database)...
echo Please wait, this is a large file...
docker pull mongo:latest
if errorlevel 1 (
    echo.
    echo X Failed to download MongoDB image
    echo.
    echo Possible causes:
    echo   - No internet connection
    echo   - Docker is not running properly
    echo   - Insufficient disk space
    echo.
    echo Please check and try again.
    pause
    exit /b 1
)
echo OK MongoDB downloaded successfully

echo.
echo Downloading Redis (Job Queue)...
docker pull redis:7-alpine
if errorlevel 1 (
    echo.
    echo X Failed to download Redis image
    echo Please check your internet connection and try again.
    pause
    exit /b 1
)
echo OK Redis downloaded successfully

REM ========================================
REM [4/5] Pull AI Images (Ollama + WebUI)
REM ========================================
echo.
echo [4/5] Downloading AI Services...
echo This may take 10-20 minutes depending on your internet speed...
echo.
echo Downloading Ollama (AI Server)...
echo This is a very large file (~2-4 GB), please be patient...
docker pull ollama/ollama:latest
if errorlevel 1 (
    echo.
    echo X Failed to download Ollama image
    echo.
    echo This is a large file. Please ensure:
    echo   - You have stable internet connection
    echo   - You have at least 10GB free disk space
    echo   - Docker has enough resources allocated
    echo.
    pause
    exit /b 1
)
echo OK Ollama downloaded successfully

echo.
echo Downloading Ollama WebUI (AI Interface)...
echo This may take a few minutes...
docker pull ghcr.io/open-webui/open-webui:latest
if errorlevel 1 (
    echo.
    echo X Failed to download Ollama WebUI image
    echo Please check your internet connection and try again.
    pause
    exit /b 1
)
echo OK Ollama WebUI downloaded successfully

REM ========================================
REM [5/5] Pull PDF Generation Image
REM ========================================
echo.
echo [5/5] Downloading PDF Generation Service...
echo.
echo Downloading Browserless Chrome (PDF Generator)...
echo This may take a few minutes...
docker pull browserless/chrome:latest
if errorlevel 1 (
    echo.
    echo X Failed to download Browserless Chrome image
    echo Please check your internet connection and try again.
    pause
    exit /b 1
)
echo OK Browserless Chrome downloaded successfully

REM ========================================
REM Verify All Images
REM ========================================
echo.
echo ========================================
echo   VERIFYING DOWNLOADED IMAGES
echo ========================================
echo.
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}" | findstr /i "mongo redis ollama open-webui browserless"
if errorlevel 1 (
    echo X Some images may not be visible
) else (
    echo OK All images are ready
)

echo.
echo ========================================
echo   INSTALLATION COMPLETE!
echo ========================================
echo.
echo All required Docker images have been downloaded successfully!
echo.
echo Summary:
echo   - MongoDB (Database) - Ready
echo   - Redis (Job Queue) - Ready
echo   - Ollama (AI Server) - Ready
echo   - Ollama WebUI (AI Interface) - Ready
echo   - Browserless Chrome (PDF Generator) - Ready
echo.
echo Next steps:
echo   1. Go back to the project root folder
echo   2. Run START.bat to start all services
echo   3. Open http://localhost:5173 in your browser
echo.
echo To verify images, run: docker images
echo.
echo ========================================
pause

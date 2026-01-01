@echo off
REM ========================================
REM REINSTALL MONGODB IMAGE
REM ========================================

title Reinstall MongoDB Image

echo.
echo ========================================
echo   REINSTALL MONGODB IMAGE
echo ========================================
echo.
echo This will:
echo   1. Stop MongoDB container (if running)
echo   2. Remove MongoDB container
echo   3. Remove MongoDB image
echo   4. Download fresh MongoDB image
echo.
set /p DELETE_VOLUMES="Delete MongoDB data volumes? (y/N): "

REM Check Docker
docker --version >nul 2>&1
if errorlevel 1 (
    echo X Docker is not installed or not running!
    pause
    exit /b 1
)
docker ps >nul 2>&1
if errorlevel 1 (
    echo X Docker is not running!
    pause
    exit /b 1
)

REM Stop containers
echo.
echo [1/4] Stopping containers...
docker stop cv-enhancer-mongodb >nul 2>&1
docker stop cv-enhancer-mongodb-setup >nul 2>&1
echo OK

REM Remove containers
echo.
echo [2/4] Removing containers...
docker rm cv-enhancer-mongodb >nul 2>&1
docker rm cv-enhancer-mongodb-setup >nul 2>&1
echo OK

REM Remove image
echo.
echo [3/4] Removing MongoDB image...
docker rmi mongo:latest >nul 2>&1
echo OK

REM Remove volumes if requested
if /i "%DELETE_VOLUMES%"=="y" (
    echo.
    echo Removing volumes...
    docker volume rm cv-enhancer_mongodb_data >nul 2>&1
    docker volume rm cv-enhancer_mongodb_keyfile >nul 2>&1
    echo OK Volumes removed
)

REM Download fresh image
echo.
echo [4/4] Downloading fresh MongoDB image...
docker pull mongo:latest
if errorlevel 1 (
    echo X Failed to download MongoDB image
    pause
    exit /b 1
)
echo OK MongoDB reinstalled successfully!

echo.
pause

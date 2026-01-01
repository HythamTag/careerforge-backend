@echo off
REM ========================================
REM REINSTALL REDIS IMAGE
REM ========================================

title Reinstall Redis Image

echo.
echo ========================================
echo   REINSTALL REDIS IMAGE
echo ========================================
echo.
echo This will:
echo   1. Stop Redis container (if running)
echo   2. Remove Redis container
echo   3. Remove Redis image
echo   4. Download fresh Redis image
echo.
set /p DELETE_VOLUMES="Delete Redis data volumes? (y/N): "

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

REM Stop container
echo.
echo [1/4] Stopping container...
docker stop cv-enhancer-redis >nul 2>&1
echo OK

REM Remove container
echo.
echo [2/4] Removing container...
docker rm cv-enhancer-redis >nul 2>&1
echo OK

REM Remove image
echo.
echo [3/4] Removing Redis image...
docker rmi redis:7-alpine >nul 2>&1
echo OK

REM Remove volumes if requested
if /i "%DELETE_VOLUMES%"=="y" (
    echo.
    echo Removing volumes...
    docker volume rm cv-enhancer_redis_data >nul 2>&1
    echo OK Volumes removed
)

REM Download fresh image
echo.
echo [4/4] Downloading fresh Redis image...
docker pull redis:7-alpine
if errorlevel 1 (
    echo X Failed to download Redis image
    pause
    exit /b 1
)
echo OK Redis reinstalled successfully!

echo.
pause

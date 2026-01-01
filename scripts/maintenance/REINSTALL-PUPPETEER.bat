@echo off
REM ========================================
REM REINSTALL PUPPETEER IMAGE
REM ========================================

title Reinstall Puppeteer Image

echo.
echo ========================================
echo   REINSTALL PUPPETEER IMAGE
echo ========================================
echo.
echo This will:
echo   1. Stop Puppeteer container (if running)
echo   2. Remove Puppeteer container
echo   3. Remove Puppeteer image
echo   4. Download fresh Puppeteer image
echo.

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
docker stop cv-enhancer-puppeteer >nul 2>&1
echo OK

REM Remove container
echo.
echo [2/4] Removing container...
docker rm cv-enhancer-puppeteer >nul 2>&1
echo OK

REM Remove image
echo.
echo [3/4] Removing Puppeteer image...
docker rmi browserless/chrome:latest >nul 2>&1
echo OK

REM Download fresh image
echo.
echo [4/4] Downloading fresh Puppeteer image...
docker pull browserless/chrome:latest
if errorlevel 1 (
    echo X Failed to download Puppeteer image
    pause
    exit /b 1
)
echo OK Puppeteer reinstalled successfully!

echo.
pause

@echo off
REM ========================================
REM REINSTALL OLLAMA WEBUI IMAGE
REM ========================================

title Reinstall Ollama WebUI Image

echo.
echo ========================================
echo   REINSTALL OLLAMA WEBUI IMAGE
echo ========================================
echo.
echo This will:
echo   1. Stop Ollama WebUI container (if running)
echo   2. Remove Ollama WebUI container
echo   3. Remove Ollama WebUI image
echo   4. Download fresh Ollama WebUI image
echo.
set /p DELETE_VOLUMES="Delete WebUI data volumes? (y/N): "

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
docker stop cv-enhancer-ollama-webui >nul 2>&1
echo OK

REM Remove container
echo.
echo [2/4] Removing container...
docker rm cv-enhancer-ollama-webui >nul 2>&1
echo OK

REM Remove image
echo.
echo [3/4] Removing Ollama WebUI image...
docker rmi ghcr.io/open-webui/open-webui:latest >nul 2>&1
echo OK

REM Remove volumes if requested
if /i "%DELETE_VOLUMES%"=="y" (
    echo.
    echo Removing volumes...
    docker volume rm cv-enhancer_ollama_webui_data >nul 2>&1
    echo OK Volumes removed
)

REM Download fresh image
echo.
echo [4/4] Downloading fresh Ollama WebUI image...
docker pull ghcr.io/open-webui/open-webui:latest
if errorlevel 1 (
    echo X Failed to download Ollama WebUI image
    pause
    exit /b 1
)
echo OK Ollama WebUI reinstalled successfully!

echo.
pause

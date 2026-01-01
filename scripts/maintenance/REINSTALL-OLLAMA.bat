@echo off
REM ========================================
REM REINSTALL OLLAMA IMAGE
REM ========================================

title Reinstall Ollama Image

echo.
echo ========================================
echo   REINSTALL OLLAMA IMAGE
echo ========================================
echo.
echo This will:
echo   1. Stop Ollama container (if running)
echo   2. Remove Ollama container
echo   3. Remove Ollama image
echo   4. Download fresh Ollama image
echo.
echo WARNING: This will remove the Ollama container.
echo Your AI models will be preserved in volumes.
echo.
set /p DELETE_VOLUMES="Delete Ollama models and data? (y/N): "

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
docker stop cv-enhancer-ollama >nul 2>&1
echo OK

REM Remove container
echo.
echo [2/4] Removing container...
docker rm cv-enhancer-ollama >nul 2>&1
echo OK

REM Remove image
echo.
echo [3/4] Removing Ollama image...
docker rmi ollama/ollama:latest >nul 2>&1
echo OK

REM Remove volumes if requested
if /i "%DELETE_VOLUMES%"=="y" (
    echo.
    echo Removing volumes (this deletes all AI models!)...
    docker volume rm cv-enhancer_ollama_data >nul 2>&1
    echo OK Volumes removed
)

REM Download fresh image
echo.
echo [4/4] Downloading fresh Ollama image...
echo This is a large file (~2-4 GB), please wait...
docker pull ollama/ollama:latest
if errorlevel 1 (
    echo X Failed to download Ollama image
    pause
    exit /b 1
)
echo OK Ollama reinstalled successfully!

echo.
pause

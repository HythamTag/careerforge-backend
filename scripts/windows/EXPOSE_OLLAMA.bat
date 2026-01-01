@echo off
title CV Enhancer - Expose Ollama via ngrok

echo ========================================
echo   EXPOSING LOCAL OLLAMA TO INTERNET
echo ========================================
echo.

REM Check if ngrok is installed
where ngrok >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] ngrok is not installed!
    echo.
    echo Please install ngrok:
    echo 1. Go to https://ngrok.com/download
    echo 2. Download and extract ngrok.exe
    echo 3. Add to PATH or place in this folder
    echo.
    pause
    exit /b 1
)

REM Check if Docker containers are running
docker ps | find "ollama-parser" >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] Ollama containers not running!
    echo Please run START.bat first to start Docker services.
    echo.
    pause
    exit /b 1
)

echo Starting ngrok tunnels...
echo.
echo IMPORTANT: Copy the HTTPS URLs and add them to Railway environment variables!
echo.

REM Start ngrok for parser (port 11434)
start "ngrok - Parser" cmd /k "ngrok http 11434 --log=stdout"

timeout /t 3 /nobreak >nul

REM Start ngrok for optimizer (port 11435)
start "ngrok - Optimizer" cmd /k "ngrok http 11435 --log=stdout"

timeout /t 3 /nobreak >nul

REM Start ngrok for ATS (port 11436)
start "ngrok - ATS" cmd /k "ngrok http 11436 --log=stdout"

echo.
echo ========================================
echo   NGROK TUNNELS STARTED
echo ========================================
echo.
echo Three ngrok windows opened:
echo   1. Parser    (port 11434)
echo   2. Optimizer (port 11435)
echo   3. ATS       (port 11436)
echo.
echo NEXT STEPS:
echo 1. Copy the HTTPS URLs from each ngrok window
echo 2. Go to Railway dashboard
echo 3. Add these environment variables:
echo    OLLAMA_PARSER_HOST=https://YOUR-PARSER-URL.ngrok-free.app
echo    OLLAMA_OPTIMIZER_HOST=https://YOUR-OPTIMIZER-URL.ngrok-free.app
echo    OLLAMA_ATS_HOST=https://YOUR-ATS-URL.ngrok-free.app
echo.
pause

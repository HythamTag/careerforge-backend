@echo off
REM ========================================
REM DOCKER IMAGES REINSTALL MENU
REM ========================================

title Docker Images Reinstall Menu

:menu
cls
echo.
echo ========================================
echo   DOCKER IMAGES REINSTALL MENU
echo ========================================
echo.
echo Choose which image to reinstall:
echo.
echo   1. MongoDB (Database)
echo   2. Redis (Job Queue)
echo   3. Ollama (AI Server)
echo   4. Ollama WebUI (AI Interface)
echo   5. Puppeteer (PDF Generation)
echo   6. Exit
echo.
set /p choice="Enter your choice (1-6): "

if "%choice%"=="1" (
    call REINSTALL-MONGODB.bat
    goto menu
)
if "%choice%"=="2" (
    call REINSTALL-REDIS.bat
    goto menu
)
if "%choice%"=="3" (
    call REINSTALL-OLLAMA.bat
    goto menu
)
if "%choice%"=="4" (
    call REINSTALL-OLLAMA-WEBUI.bat
    goto menu
)
if "%choice%"=="5" (
    call REINSTALL-PUPPETEER.bat
    goto menu
)
if "%choice%"=="6" (
    exit /b 0
)

echo Invalid choice. Please try again.
timeout /t 2 >nul
goto menu

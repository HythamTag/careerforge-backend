@echo off
title CareerForge - Master Launcher
cls

:MENU
cls
echo ========================================================
echo              CAREERFORGE LAUNCHER
echo ========================================================
echo.
echo   [MAIN]
echo   1. Start Full Stack (Backend + Frontend + Docker)
echo   2. Stop All Services
echo.
echo   [DEVELOPMENT]
echo   3. Run Frontend Only (Local/Remote Switch)
echo   4. Run Backend Only (API + Worker)
echo   5. Start AI Tunnel (Ngrok + Ollama Docker)
echo.
echo   [UTILITIES]
echo   6. Initial Setup (Install Dependencies)
echo   7. Run Tests
echo   8. Reset Docker (Factory Reset)
echo.
echo   [EXIT]
echo   0. Exit
echo.
echo ========================================================
set /p choice="Select an option (0-8): "

if "%choice%"=="1" call scripts\windows\START.bat
if "%choice%"=="2" call scripts\windows\STOP.bat
if "%choice%"=="3" call scripts\windows\RUN_FRONTEND.bat
if "%choice%"=="4" call scripts\windows\RUN_BACKEND.bat
if "%choice%"=="5" call scripts\windows\START_AI_TUNNEL.bat
if "%choice%"=="6" call scripts\windows\SETUP.bat
if "%choice%"=="7" call scripts\windows\TEST.bat
if "%choice%"=="8" call scripts\windows\RESET_DOCKER.bat
if "%choice%"=="0" exit

echo.
echo Invalid choice.
pause
goto MENU

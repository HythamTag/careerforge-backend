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
echo.
echo   [TUNNELS]
echo   5. AI Tunnel (Expose Ollama AI for Railway)
echo   6. WebUI Tunnel (Expose WebUI for Mobile)
echo.
echo   [UTILITIES]
echo   7. Initial Setup (Install Dependencies)
echo   8. Run Tests
echo   9. Maintenance Menu
echo.
echo   [EXIT]
echo   0. Exit
echo.
echo ========================================================
set /p choice="Select an option (0-9): "

if "%choice%"=="1" call scripts\start.bat
if "%choice%"=="2" call scripts\stop.bat
if "%choice%"=="3" call scripts\run-frontend.bat
if "%choice%"=="4" call scripts\run-backend.bat
if "%choice%"=="5" call scripts\tunnel-ai.bat
if "%choice%"=="6" call scripts\tunnel-webui.bat
if "%choice%"=="7" call scripts\setup.bat
if "%choice%"=="8" call scripts\test.bat
if "%choice%"=="9" call scripts\maintenance.bat
if "%choice%"=="0" exit

echo.
echo Invalid choice.
pause
goto MENU

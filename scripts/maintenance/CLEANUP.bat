@echo off
REM ========================================
REM EMERGENCY CLEANUP
REM ========================================

title CV Enhancer - Emergency Cleanup

echo.
echo ========================================
echo   CV ENHANCER - EMERGENCY CLEANUP
echo ========================================
echo.
echo WARNING: This will completely reset everything!
echo.
echo This will:
echo   - Stop all Docker containers
echo   - Remove Docker volumes (DATABASE WILL BE DELETED)
echo   - Kill all Node.js processes
echo   - Remove node_modules directories
echo.
set /p CONFIRM="Type 'yes' to confirm: "
if /i not "%CONFIRM%"=="yes" (
    echo Cancelled.
    pause
    exit /b 1
)
echo.

echo [1/6] Stopping services...
call STOP.bat >nul 2>&1
echo OK Services stopped
echo.

echo [2/6] Removing Docker containers and volumes...
cd docker
docker compose -f docker-compose.core.yml down -v --remove-orphans >nul 2>&1
docker compose -f docker-compose.ollama-gpu.yml down -v --remove-orphans >nul 2>&1
docker compose -f docker-compose.puppeteer.yml down -v --remove-orphans >nul 2>&1
cd ..
echo OK Docker cleanup complete
echo.

echo [3/6] Killing Node.js processes...
taskkill /f /im node.exe >nul 2>&1
echo OK Processes killed
echo.

echo [4/6] Removing node_modules...
if exist "backend\node_modules" rmdir /s /q "backend\node_modules"
if exist "frontend\node_modules" rmdir /s /q "frontend\node_modules"
echo OK node_modules removed
echo.

echo [5/6] Cleaning uploads...
if exist "backend\uploads" (
    for /d %%i in ("backend\uploads\*") do rmdir /s /q "%%i" 2>nul
    del /q "backend\uploads\*" 2>nul
)
echo OK Uploads cleaned
echo.

echo [6/6] Clearing caches...
npm cache clean --force >nul 2>&1
docker system prune -f >nul 2>&1
echo OK Caches cleared
echo.

echo ========================================
echo   CLEANUP COMPLETE
echo ========================================
echo.
echo To start fresh:
echo   1. Run SETUP.bat
echo   2. Run START.bat
echo.
pause

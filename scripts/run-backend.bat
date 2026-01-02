@echo off
cd /d "%~dp0"
cd ..
setlocal
title CareerForge - Backend API + Worker

echo ========================================================
echo   CAREERFORGE - BACKEND (API + WORKER)
echo ========================================================
echo.

cd backend
if not exist node_modules (
    echo Installing dependencies...
    call npm install
)

echo Starting services...
where wt >nul 2>&1
if %errorlevel% equ 0 (
    wt -w 0 new-tab -p "Command Prompt" --title "CareerForge - API" -d "%cd%" cmd /k "npm run dev" ; ^
       new-tab -p "Command Prompt" --title "CareerForge - Worker" -d "%cd%" cmd /k "npm run worker:dev"
) else (
    start "CareerForge - API" cmd /k "npm run dev"
    start "CareerForge - Worker" cmd /k "npm run worker:dev"
)

echo OK Backend services launched.
echo.
pause

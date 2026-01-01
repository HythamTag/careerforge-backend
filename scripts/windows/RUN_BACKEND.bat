@echo off
cd /d "%~dp0"
cd ..\..
setlocal
title CareerForge Backend API

echo =========================================================
echo  CareerForge Backend Launcher
echo =========================================================
echo.
echo Starting Backend API...
echo.

cd backend
if not exist node_modules (
    echo Installing dependencies...
    call npm install
)

npm run dev
pause

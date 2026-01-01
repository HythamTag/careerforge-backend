@echo off
cd /d "%~dp0"
cd ..
setlocal
title CareerForge - Frontend

echo ========================================================
echo   CAREERFORGE - FRONTEND
echo ========================================================
echo.
echo Select Backend Mode:
echo   1. Localhost (Default) - connects to http://localhost:5000
echo   2. Remote (Railway)    - connects to https://careerforge-backend-production.up.railway.app
echo.
set /p choice="Enter choice (1 or 2): "

if "%choice%"=="2" (
    echo.
    echo 🌍 Setting up REMOTE connection...
    set VITE_API_TARGET=https://careerforge-backend-production.up.railway.app
) else (
    echo.
    echo 🏠 Setting up LOCALHOST connection...
    set VITE_API_TARGET=http://localhost:5000
)

echo.
cd frontend
echo 📦 Checking dependencies...
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
)

echo 🚀 Starting Frontend with API Target: %VITE_API_TARGET%
npm run dev
pause

@echo off
REM Start Puppeteer only
title Starting Puppeteer
cd /d "%~dp0..\..\docker"
echo Starting Puppeteer...
docker compose -f docker-compose.puppeteer.yml up -d
echo.
echo Puppeteer: http://localhost:3000
pause

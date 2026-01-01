@echo off
REM Start MongoDB and Redis only
title Starting Core Services
cd /d "%~dp0..\..\docker"
echo Starting MongoDB and Redis...
docker compose -f docker-compose.core.yml up -d
echo.
echo MongoDB: localhost:27017
echo Redis: localhost:6379
pause

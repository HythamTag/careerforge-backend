@echo off
REM Start Ollama GPU only
title Starting Ollama
cd /d "%~dp0..\..\docker"
echo Starting Ollama with GPU...
docker compose -f docker-compose.ollama-gpu.yml up -d
echo.
echo Ollama started: http://localhost:11434
echo Ollama UI: http://localhost:8080
pause

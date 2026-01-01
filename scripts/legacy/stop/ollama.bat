@echo off
REM Stop Ollama only
cd /d "%~dp0..\..\docker"
echo Stopping Ollama...
docker compose -f docker-compose.ollama-gpu.yml down
echo Done.
pause

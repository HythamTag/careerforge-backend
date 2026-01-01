@echo off
REM Stop Core services only
cd /d "%~dp0..\..\docker"
echo Stopping MongoDB and Redis...
docker compose -f docker-compose.core.yml down
echo Done.
pause

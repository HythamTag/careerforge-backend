@echo off
REM Stop Puppeteer only
cd /d "%~dp0..\..\docker"
echo Stopping Puppeteer...
docker compose -f docker-compose.puppeteer.yml down
echo Done.
pause

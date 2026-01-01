@echo off
cd /d "%~dp0"
cd ..
setlocal
title CareerForge - Maintenance

echo ========================================================
echo   CAREERFORGE - MAINTENANCE
echo ========================================================
echo.
echo Select maintenance operation:
echo.
echo   [1] Clean Database (Drop all collections)
echo   [2] Cleanup (Docker + Node modules)
echo   [3] Reinstall Docker Images
echo   [4] Reinstall MongoDB
echo   [5] Reinstall Ollama
echo   [6] Reinstall Ollama WebUI
echo   [7] Reinstall Puppeteer
echo   [8] Reinstall Redis
echo   [9] Full Reinstall (All services)
echo   [0] Exit
echo.
set /p choice="Enter choice (0-9): "

REM Map choice to maintenance script
if "%choice%"=="1" goto clean_db
if "%choice%"=="2" goto cleanup
if "%choice%"=="3" goto docker_images
if "%choice%"=="4" goto mongodb
if "%choice%"=="5" goto ollama
if "%choice%"=="6" goto ollama_webui
if "%choice%"=="7" goto puppeteer
if "%choice%"=="8" goto redis
if "%choice%"=="9" goto full_reinstall
if "%choice%"=="0" goto:eof
echo Invalid choice. Exiting.
pause
goto:eof

:clean_db
echo.
echo Cleaning database...
cd backend
node scripts/maintenance/clean-database.js
cd ..
goto end

:cleanup
echo.
echo Running cleanup...
docker compose down
docker system prune -af --volumes
cd backend && rmdir /s /q node_modules 2>nul && cd ..
cd frontend && rmdir /s /q node_modules 2>nul && cd ..
echo Cleanup complete!
goto end

:docker_images
echo.
echo Installing Docker images...
docker pull mongo:latest
docker pull redis:alpine
docker pull ollama/ollama:latest
docker pull ghcr.io/open-webui/open-webui:main
docker pull browserless/chrome:latest
echo Docker images installed!
goto end

:mongodb
echo.
echo Reinstalling MongoDB...
docker compose stop mongodb
docker compose rm -f mongodb
docker volume rm cv_enhancer_mongodb-data 2>nul
docker compose up -d mongodb
timeout /t 5 /nobreak >nul
echo MongoDB reinstalled!
goto end

:ollama
echo.
echo Reinstalling Ollama...
docker compose down parser-cpu optimizer-cpu ats-cpu
docker compose down parser-3060 optimizer-3060 ats-3060
docker compose down parser-3090 optimizer-3090 ats-3090
docker volume rm cv_enhancer_ollama-models 2>nul
echo Ollama volumes cleared. Use START.bat to launch with desired profile.
goto end

:ollama_webui
echo.
echo Reinstalling Ollama WebUI...
docker compose stop ollama-webui
docker compose rm -f ollama-webui
docker volume rm cv_enhancer_ollama-webui-data 2>nul
docker compose up -d ollama-webui
echo Ollama WebUI reinstalled!
goto end

:puppeteer
echo.
echo Reinstalling Puppeteer...
docker compose stop browserless
docker compose rm -f browserless
docker compose up -d browserless
cd backend
call npm install puppeteer
cd ..
echo Puppeteer reinstalled!
goto end

:redis
echo.
echo Reinstalling Redis...
docker compose stop redis
docker compose rm -f redis
docker volume rm cv_enhancer_redis-data 2>nul
docker compose up -d redis
echo Redis reinstalled!
goto end

:full_reinstall
echo.
echo WARNING: This will reinstall ALL services!
set /p confirm="Are you sure? (y/N): "
if /i not "%confirm%"=="y" (
    echo Cancelled.
    goto end
)
echo.
echo Stopping all containers...
docker compose down
echo Removing volumes...
docker volume prune -f
echo Pulling latest images...
call :docker_images
echo Starting all services...
docker compose up -d
echo Full reinstall complete!
goto end

:end
echo.
pause

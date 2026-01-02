@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"
cd ..
title CareerForge - Maintenance

echo ========================================================
echo   CAREERFORGE - MAINTENANCE [RTX 3090 OPTIMIZED]
echo ========================================================
echo.

REM Detect Project Name for Volume Prefix (e.g. cv-enhancer)
for %%i in ("%cd%") do set "FOLDER_NAME=%%~nxi"
set "PROJECT_NAME=%FOLDER_NAME: =-%"
set "PROJECT_NAME=%PROJECT_NAME: =%"
set "PROJECT_NAME=!PROJECT_NAME:---=-!"
set "PROJECT_NAME=!PROJECT_NAME:--=-!"

echo Select maintenance operation:
echo.
echo   [1] Clean Database (Drop all collections)
echo   [2] Cleanup (Docker + Node modules)
echo   [3] Reinstall Docker Images
echo   [4] Reinstall MongoDB
echo   [5] Reinstall Ollama (All isolated instances)
echo   [6] Reinstall Ollama WebUI
echo   [7] Reinstall Puppeteer
echo   [8] Reinstall Redis
echo   [9] Full Reinstall (All services)
echo   [0] Exit
echo.
set /p choice="Enter choice (0-9): "

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
echo Invalid choice.
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
docker system prune -f
cd backend && rmdir /s /q node_modules 2>nul && cd ..
cd frontend && rmdir /s /q node_modules 2>nul && cd ..
echo Cleanup complete!
goto end

:docker_images
echo.
echo Pulling latest Docker images...
docker pull mongo:latest
docker pull redis:alpine
docker pull ollama/ollama:latest
docker pull ghcr.io/open-webui/open-webui:main
docker pull browserless/chrome:latest
echo Docker images updated!
goto end

:mongodb
echo.
echo Reinstalling MongoDB...
docker compose stop mongodb
docker compose rm -f mongodb
docker volume rm %PROJECT_NAME%_mongodb_data 2>nul
docker compose up -d mongodb
echo MongoDB reinstalled!
goto end

:ollama
echo.
echo Reinstalling Ollama (Parser, Optimizer, ATS)...
docker compose down parser-3090 optimizer-3090 ats-3090 parser-3060 optimizer-3060 ats-3060 parser-cpu optimizer-cpu ats-cpu
docker volume rm %PROJECT_NAME%_ollama_parser_data 2>nul
docker volume rm %PROJECT_NAME%_ollama_optimizer_data 2>nul
docker volume rm %PROJECT_NAME%_ollama_ats_data 2>nul
echo Ollama volumes cleared. Use START.bat to re-provision models.
goto end

:ollama_webui
echo.
echo Reinstalling Ollama WebUI...
docker compose stop ollama-webui
docker compose rm -f ollama-webui
docker volume rm %PROJECT_NAME%_ollama_webui_data 2>nul
docker compose up -d ollama-webui
echo Ollama WebUI reinstalled!
goto end

:puppeteer
echo.
echo Reinstalling Puppeteer...
docker compose stop browserless
docker compose rm -f browserless
docker compose up -d browserless
echo Puppeteer reinstalled!
goto end

:redis
echo.
echo Reinstalling Redis...
docker compose stop redis
docker compose rm -f redis
docker volume rm %PROJECT_NAME%_redis_data 2>nul
docker compose up -d redis
echo Redis reinstalled!
goto end

:full_reinstall
echo.
echo WARNING: This will reinstall ALL data and services!
set /p confirm="Are you sure? (y/N): "
if /i not "%confirm%"=="y" goto end
docker compose down
docker volume prune -f
call :docker_images
echo Core services reinstalled. Use START.bat to finish setup.
goto end

:end
echo.
pause
goto:eof

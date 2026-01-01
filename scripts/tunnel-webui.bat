@echo off
cd /d "%~dp0"
cd ..
setlocal
title CareerForge - WebUI Tunnel

REM Ngrok authtoken for WebUI
set NGROK_TOKEN=37fCnaS4roZlzV0BmSJgt7EhOWl_4FFPJfPYTgmg8ggYNu4ch

echo ========================================================
echo   CAREERFORGE - WEBUI TUNNEL
echo ========================================================
echo.
echo Launching Ngrok tunnel for WebUI (Port 8080)...
echo.

start "Ngrok - WebUI" cmd /k "ngrok http 8080 --authtoken %NGROK_TOKEN%"

timeout /t 3 /nobreak >nul

echo.
echo ========================================================
echo   WEBUI TUNNEL ACTIVE!
echo ========================================================
echo.
echo Dashboard: http://127.0.0.1:4040
echo.
echo Copy the HTTPS URL from the ngrok window and open it
echo on your mobile browser to access Ollama WebUI remotely.
echo.
pause

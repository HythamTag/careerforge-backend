@echo off
cd /d "%~dp0"
cd ..
setlocal
title CareerForge - AI API Tunnel

REM Ngrok authtoken for AI API
set NGROK_TOKEN=37fuQcfI32uu7kyANcPeytMjx6H_3Gfv3E4jbCGp6vekCxYab

echo ========================================================
echo   CAREERFORGE - AI API TUNNEL
echo ========================================================
echo.
echo Launching Ngrok tunnel for AI API (Port 11434)...
echo.

start "Ngrok - AI API" cmd /k "ngrok http 11434 --authtoken %NGROK_TOKEN%"

timeout /t 3 /nobreak >nul

echo.
echo ========================================================
echo   AI API TUNNEL ACTIVE!
echo ========================================================
echo.
echo Dashboard: http://127.0.0.1:4040
echo.
echo Copy the HTTPS URL from the ngrok window and use it
echo in Railway as your OLLAMA_PARSER_HOST environment variable.
echo.
pause

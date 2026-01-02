@echo off
cd /d "%~dp0"
cd ..
title CareerForge - AI API Tunnel

REM Ngrok authtoken for AI API
set NGROK_TOKEN=37fuQcfI32uu7kyANcPeytMjx6H_3Gfv3E4jbCGp6vekCxYab

echo ========================================================
echo   CAREERFORGE - AI API TUNNEL
echo ========================================================
echo.
echo Launching Ngrok tunnel for AI API (Port 11434)...
echo.

set /p BG="Run in background (headless)? (y/n) [y]: "
if /i "%BG%"=="n" goto :foreground
goto :background

:foreground
echo Launching in new window...
start "Ngrok - AI API" ngrok http 11434 --authtoken %NGROK_TOKEN%
goto :done

:background
echo Launching headless (no window)...
powershell -Command "Start-Process -FilePath 'ngrok' -ArgumentList 'http 11434 --authtoken %NGROK_TOKEN%' -WindowStyle Hidden"
goto :done

:done
timeout /t 3 /nobreak >nul

echo.
echo ========================================================
echo   AI API TUNNEL ACTIVE!
echo ========================================================
echo.
echo Dashboard: http://127.0.0.1:4040
echo.
echo Copy the HTTPS URL from the ngrok dashboard and use it
echo in Railway as your OLLAMA_PARSER_HOST environment variable.
echo.
echo To stop the tunnel, run: scripts\kill-tunnels.bat
echo.
pause

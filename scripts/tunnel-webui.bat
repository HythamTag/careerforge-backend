@echo off
cd /d "%~dp0"
cd ..
title CareerForge - WebUI Tunnel

REM Ngrok authtoken for WebUI
set NGROK_TOKEN=37fCnaS4roZlzV0BmSJgt7EhOWl_4FFPJfPYTgmg8ggYNu4ch

echo ========================================================
echo   CAREERFORGE - WEBUI TUNNEL
echo ========================================================
echo.
echo Launching Ngrok tunnel for WebUI (Port 8080)...
echo.

set /p BG="Run in background (headless)? (y/n) [y]: "
if /i "%BG%"=="n" goto :foreground
goto :background

:foreground
echo Launching in new window...
start "Ngrok - WebUI" ngrok http 8080 --authtoken %NGROK_TOKEN%
goto :done

:background
echo Launching headless (no window)...
powershell -Command "Start-Process -FilePath 'ngrok' -ArgumentList 'http 8080 --authtoken %NGROK_TOKEN%' -WindowStyle Hidden"
goto :done

:done
timeout /t 3 /nobreak >nul

echo.
echo ========================================================
echo   WEBUI TUNNEL ACTIVE!
echo ========================================================
echo.
echo Dashboard: http://127.0.0.1:4040
echo.
echo Copy the HTTPS URL from the ngrok dashboard and open it
echo on your mobile browser to access Ollama WebUI remotely.
echo.
echo To stop the tunnel, run: scripts\kill-tunnels.bat
echo.
pause

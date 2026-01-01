@echo off
setlocal EnableDelayedExpansion
REM ========================================
REM HEALTH CHECK
REM ========================================

title CV Enhancer - Health Check

echo.
echo ========================================
echo   CV ENHANCER - HEALTH CHECK
echo ========================================
echo.

set ERRORS=0
set SERVICES=0

REM [1/7] Docker
echo [1/7] Docker...
docker ps >nul 2>&1
if errorlevel 1 (
    echo X NOT RUNNING
    set /a ERRORS+=1
) else (
    echo OK Running
)

REM [2/7] MongoDB
echo [2/7] MongoDB...
docker ps --filter "name=cv-enhancer-mongodb" --format "{{.Names}}" 2>nul | findstr "cv-enhancer-mongodb" >nul
if errorlevel 1 (
    echo X NOT RUNNING
    set /a ERRORS+=1
) else (
    echo OK Running
    set /a SERVICES+=1
)

REM [3/7] Redis
echo [3/7] Redis...
docker ps --filter "name=cv-enhancer-redis" --format "{{.Names}}" 2>nul | findstr "cv-enhancer-redis" >nul
if errorlevel 1 (
    echo X NOT RUNNING
    set /a ERRORS+=1
) else (
    echo OK Running
    set /a SERVICES+=1
)

REM [4/7] Ollama
echo [4/7] Ollama AI...
docker ps --filter "name=cv-enhancer-ollama" --format "{{.Names}}" 2>nul | findstr "cv-enhancer-ollama" >nul
if errorlevel 1 (
    echo X NOT RUNNING
    set /a ERRORS+=1
) else (
    echo OK Running
    set /a SERVICES+=1
)

REM [5/7] Backend API
echo [5/7] Backend API...
powershell -Command "try { Invoke-WebRequest -Uri 'http://localhost:5000/health' -TimeoutSec 3 | Out-Null; exit 0 } catch { exit 1 }" >nul 2>&1
if errorlevel 1 (
    echo X NOT RESPONDING
    set /a ERRORS+=1
) else (
    echo OK Responding
)

REM [6/7] Frontend
echo [6/7] Frontend...
powershell -Command "try { Invoke-WebRequest -Uri 'http://localhost:5173' -TimeoutSec 3 | Out-Null; exit 0 } catch { exit 1 }" >nul 2>&1
if errorlevel 1 (
    echo X NOT RESPONDING
    set /a ERRORS+=1
) else (
    echo OK Responding
)

REM [7/7] GPU
echo [7/7] GPU...
nvidia-smi >nul 2>&1
if %errorlevel% equ 0 (
    echo OK Detected
    nvidia-smi --query-gpu=name,memory.used,memory.total --format=csv,noheader 2>nul
) else (
    echo X NOT DETECTED
    set /a ERRORS+=1
)

echo.
echo ========================================
if !ERRORS! equ 0 (
    echo   STATUS: HEALTHY
    echo   All services running
) else (
    echo   STATUS: ISSUES DETECTED
    echo   Errors: !ERRORS!
    echo.
    echo   Run STOP.bat then START.bat
)
echo ========================================
echo.
pause
endlocal

@echo off
REM Start Frontend only
title CV Enhancer - Frontend
cd /d "%~dp0..\..\frontend"
echo Starting Frontend...
npm run dev

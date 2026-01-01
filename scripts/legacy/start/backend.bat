@echo off
REM Start Backend API only
title CV Enhancer - Backend API
cd /d "%~dp0..\..\backend"
echo Starting Backend API...
npm run dev

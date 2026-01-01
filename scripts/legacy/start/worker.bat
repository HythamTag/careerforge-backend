@echo off
REM Start Worker only
title CV Enhancer - Worker
cd /d "%~dp0..\..\backend"
echo Starting Background Worker...
npm run worker:dev

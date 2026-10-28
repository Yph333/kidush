@echo off
rem Check the package: build the single file and open every slide in a browser with the network off.
setlocal
cd /d "%~dp0"
title Luach - offline check
if exist "%~dp0.browsers" set "PLAYWRIGHT_BROWSERS_PATH=%~dp0.browsers"
call npm run check:offline
pause

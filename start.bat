@echo off
rem Start the site and open it in the browser (double-click this file).
rem The server stops by itself when the browser tab is closed, or after 20 minutes without use.
rem To change the idle time, e.g. 45 minutes:  start.bat --idle=45
setlocal
cd /d "%~dp0"
if exist "%~dp0.browsers" set "PLAYWRIGHT_BROWSERS_PATH=%~dp0.browsers"
title Luach - server (close this window to stop)

where node >nul 2>nul
if errorlevel 1 (
  echo  Node.js is not installed. Run install.bat first.
  pause
  exit /b 1
)
if not exist node_modules (
  echo  First run: installing packages...
  call "%~dp0install.bat" --from-start
)

node tools\launcher\start.mjs %*
if errorlevel 1 pause

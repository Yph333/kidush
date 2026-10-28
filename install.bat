@echo off
rem One-click install of everything the project needs (double-click this file).
setlocal
cd /d "%~dp0"
title Luach - install

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo  Node.js is not installed.
  echo  Install the LTS version from https://nodejs.org and run this file again.
  echo.
  start "" https://nodejs.org
  pause
  exit /b 1
)

if exist "%~dp0.browsers" set "PLAYWRIGHT_BROWSERS_PATH=%~dp0.browsers"

rem The offline package already has every library: check them, and only download what is missing.
if exist node_modules\.package-lock.json (
  call npm ls --depth=0 >nul 2>nul
  if not errorlevel 1 (
    echo.
    echo  All the libraries are already here, nothing to download.
    if exist "%~dp0.browsers" echo  The test browser is here too.
    echo  Double-click start.bat to open the site.
    echo.
    if not "%~1"=="--from-start" pause
    exit /b 0
  )
)

echo.
echo  [1/2] Installing the project packages (npm ci)...
call npm ci
if errorlevel 1 (
  echo  npm ci failed, trying npm install...
  call npm install
  if errorlevel 1 goto :fail
)

echo.
echo  [2/2] Installing the test browser (Playwright Chromium)...
call npx playwright install chromium
if errorlevel 1 echo  Warning: the test browser was not installed. The site still works; only "npm run e2e" needs it.

echo.
echo  Done. Double-click start.bat to open the site.
echo  (Optional: Java is only needed for "npm run oracle:zmanim".)
echo.
if not "%~1"=="--from-start" pause
exit /b 0

:fail
echo.
echo  Install failed. Check the messages above (internet connection, Node.js version 20 or newer).
if not "%~1"=="--from-start" pause
exit /b 1

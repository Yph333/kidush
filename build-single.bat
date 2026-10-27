@echo off
rem Build the whole site into one HTML file that opens offline (double-click this file).
rem Output: dist-single\index.html
setlocal
cd /d "%~dp0"
title Luach - build single file

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

echo.
echo  Building the single file...
call npm run build:single
if errorlevel 1 (
  echo.
  echo  Build failed. Check the messages above.
  pause
  exit /b 1
)

echo.
echo  Done: %~dp0dist-single\index.html
echo  It opens in any browser, also without internet.
echo.
explorer /select,"%~dp0dist-single\index.html"
pause

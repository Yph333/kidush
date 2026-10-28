@echo off
rem Make the complete offline package on THIS Windows computer (needs internet once):
rem every library in node_modules, the test browser in .browsers, the built site, and a ZIP of it all.
rem Copy the ZIP (or the whole folder) to the offline computer; there only Node.js has to be installed.
setlocal
cd /d "%~dp0"
title Luach - make the offline package
set "PLAYWRIGHT_BROWSERS_PATH=%~dp0.browsers"

where node >nul 2>nul
if errorlevel 1 (
  echo  Node.js is not installed. Install it first, then run this file again.
  pause
  exit /b 1
)

echo  [1/5] Libraries (npm ci)...
call npm ci || goto :fail
echo  [2/5] Test browser into .browsers ...
call npx playwright install chromium || goto :fail
echo  [3/5] Tests...
call npm test || goto :fail
echo  [4/5] Building the site (dist and dist-single)...
call npm run build || goto :fail
call npm run build:single || goto :fail
echo  [5/5] ZIP...
if exist luach-offline-windows.zip del luach-offline-windows.zip
powershell -NoProfile -Command "Get-ChildItem -Force | Where-Object { $_.Name -notin '.git','test-results','dist-e2e','luach-offline-windows.zip' } | Compress-Archive -DestinationPath luach-offline-windows.zip" || goto :fail

echo.
echo  Done: %~dp0luach-offline-windows.zip
echo  On the offline computer: install Node.js, unzip, double-click start.bat (or open dist-single\index.html).
pause
exit /b 0

:fail
echo.
echo  Failed. Check the messages above.
pause
exit /b 1

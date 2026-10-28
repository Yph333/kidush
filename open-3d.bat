@echo off
rem Open the site with 3D working on any computer, also one without a graphics card or with hardware acceleration
rem blocked: the browser is started with its own software renderer allowed (SwiftShader). With a working graphics
rem card it still uses the card. Uses, in this order: the browser that comes in the package (.browsers), Edge, Chrome.
setlocal
cd /d "%~dp0"
title Luach - open with 3D

set "PAGE=%~dp0dist-single\index.html"
if not exist "%PAGE%" (
  echo  dist-single\index.html is missing. Double-click build-single.bat first.
  pause
  exit /b 1
)

set "BROWSER="
if exist "%~dp0.browsers" for /r "%~dp0.browsers" %%F in (chrome.exe) do if exist "%%F" set "BROWSER=%%F"
if not defined BROWSER if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" set "BROWSER=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if not defined BROWSER if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" set "BROWSER=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
if not defined BROWSER if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" set "BROWSER=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if not defined BROWSER if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" set "BROWSER=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if not defined BROWSER if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" set "BROWSER=%LocalAppData%\Google\Chrome\Application\chrome.exe"
if not defined BROWSER (
  echo  No Chromium, Edge or Chrome found. Open dist-single\index.html in your browser instead.
  pause
  exit /b 1
)

rem a profile of its own, so the switches apply even when the browser is already open
start "" "%BROWSER%" --user-data-dir="%LocalAppData%\luach-browser" --no-first-run --no-default-browser-check --enable-unsafe-swiftshader --ignore-gpu-blocklist --start-maximized "%PAGE%"
exit /b 0

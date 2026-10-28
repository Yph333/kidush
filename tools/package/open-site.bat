@echo off
rem The ready package: double-click to open the site. Nothing to install: the browser is in the "browser" folder.
rem 3D works also on a computer without a graphics card (software rendering is allowed).
setlocal
cd /d "%~dp0"
set "BROWSER="
for /r "%~dp0browser" %%F in (chrome.exe) do if exist "%%F" set "BROWSER=%%F"
if not defined BROWSER if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" set "BROWSER=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if not defined BROWSER (
  echo  The browser folder is missing. Unzip the whole package again.
  pause
  exit /b 1
)
start "" "%BROWSER%" --user-data-dir="%LocalAppData%\luach-browser" --no-first-run --no-default-browser-check --enable-unsafe-swiftshader --ignore-gpu-blocklist --start-maximized "%~dp0site\index.html"

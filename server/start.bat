@echo off
REM ============================================================
REM  Travel guide server - one-click launcher
REM  Just runs the Node launcher. The launcher handles:
REM    - killing any old process on port 3000
REM    - opening the browser (invisibly, no flashing window)
REM    - starting the server in this same window
REM  Keep this window OPEN. Close it to stop the server.
REM ============================================================
setlocal
cd /d "%~dp0"

set "NODE=C:/Users/Lenovo/.workbuddy/binaries/node/versions/22.12.0/node.exe"
if not exist "%NODE%" set "NODE=node"

"%NODE%" start-launcher.js
echo.
echo [server stopped] press any key to close this window
pause

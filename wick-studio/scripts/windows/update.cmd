@echo off
rem Pulls the latest wick-studio code (the auto-render task picks it up on its next run).
rem Double-click after Claude says the render code changed.
setlocal
set "GITBASH=C:\Program Files\Git\bin\bash.exe"
pushd "%~dp0..\.."
set CHERE_INVOKING=1
"%GITBASH%" -lc "git pull --ff-only && npm install --no-audit --no-fund --silent"
popd
echo.
pause
endlocal

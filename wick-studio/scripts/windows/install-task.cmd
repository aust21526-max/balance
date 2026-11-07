@echo off
rem Registers the Weekly Wick task: daily at 17:12, 17:38, 18:10, 18:40 and 21:10, without a window,
rem waking the PC from sleep (see install-task.ps1). Double-click once; safe to re-run after update.cmd.
rem Remove later with: schtasks /Delete /TN "WeeklyWick Render" /F
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install-task.ps1"
if errorlevel 1 echo Setup failed. Right-click install-task.cmd and choose "Run as administrator".
echo.
echo Log: %~dp0..\..\out\pending.log
pause

@echo off
rem Registers the Weekly Wick auto-render task (every 30 minutes while logged in).
rem Run once by double-clicking. Remove later with: schtasks /Delete /TN "WeeklyWick Render" /F
schtasks /Create /F /SC MINUTE /MO 30 /TN "WeeklyWick Render" /TR "\"%~dp0render-pending.cmd\""
echo.
echo Registered. Log: %~dp0..\..\out\pending.log
pause

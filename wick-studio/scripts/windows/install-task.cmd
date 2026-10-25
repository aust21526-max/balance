@echo off
rem Registers the Weekly Wick auto-render task (every 30 minutes while the PC is awake) and the
rem "WeeklyWick Wake" task that wakes the PC from sleep at 17:20 / 18:20 daily and 17:50 on Saturday.
rem Run once by double-clicking (again after update.cmd changes it; it is safe to re-run).
rem Remove later with: schtasks /Delete /TN "WeeklyWick Render" /F  and  schtasks /Delete /TN "WeeklyWick Wake" /F
schtasks /Create /F /SC MINUTE /MO 30 /TN "WeeklyWick Render" /TR "\"%~dp0render-pending.cmd\""
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install-task.ps1"
if errorlevel 1 echo Wake setup failed. Right-click install-task.cmd and choose "Run as administrator".
echo.
echo Registered. Log: %~dp0..\..\out\pending.log
pause

# Called by install-task.cmd. Sleep-friendly settings for "WeeklyWick Render", plus the "WeeklyWick Wake"
# task that wakes the PC only around the packet and card times (not every 30 minutes).
$ErrorActionPreference = "Stop"
$s = (Get-ScheduledTask -TaskName "WeeklyWick Render").Settings
$s.StartWhenAvailable = $true           # run a missed check as soon as the PC is awake again
$s.DisallowStartIfOnBatteries = $false  # laptops: keep running on battery
$s.StopIfGoingOnBatteries = $false
$s.WakeToRun = $false                   # the 30-minute check never wakes the PC by itself
Set-ScheduledTask -TaskName "WeeklyWick Render" -Settings $s | Out-Null

# Daily 17:20 and 18:20 (after the 17:05 / 18:05 Drive saves), plus Saturday 17:50 for the cards. PC clock in KST.
$triggers = @(
  New-ScheduledTaskTrigger -Daily -At "17:20"
  New-ScheduledTaskTrigger -Daily -At "18:20"
  New-ScheduledTaskTrigger -Weekly -DaysOfWeek Saturday -At "17:50"
)
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$PSScriptRoot\wake-sync.ps1`""
$set = New-ScheduledTaskSettingsSet -WakeToRun -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -ExecutionTimeLimit (New-TimeSpan -Hours 1)
Register-ScheduledTask -TaskName "WeeklyWick Wake" -Trigger $triggers -Action $action -Settings $set -Force | Out-Null

# Let scheduled tasks wake the PC (power plan "Allow wake timers"), on power and on battery.
powercfg /setacvalueindex SCHEME_CURRENT SUB_SLEEP RTCWAKE 1
powercfg /setdcvalueindex SCHEME_CURRENT SUB_SLEEP RTCWAKE 1
powercfg /setactive SCHEME_CURRENT
Write-Host "Wake task registered: daily 17:20 and 18:20, Saturday 17:50."

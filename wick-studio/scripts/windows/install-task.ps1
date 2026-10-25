# Called by install-task.cmd. Registers "WeeklyWick Render" at fixed times around the packet saves
# (17:05, 18:05) and the Grok bot's schedule (draft 17:30, posting package 18:15, recheck 18:45):
#   17:12  first packet       17:38  cards from the 17:30 draft
#   18:10  second packet + chart snapshots (before the 18:15 package)
#   18:40  anything late (before the 18:45 recheck)      21:10  evening catch-up
# The task wakes the PC from sleep, runs without a window and catches up after a missed time. PC clock in KST.
$ErrorActionPreference = "Stop"
Unregister-ScheduledTask -TaskName "WeeklyWick Wake" -Confirm:$false -ErrorAction SilentlyContinue
$triggers = "17:12", "17:38", "18:10", "18:40", "21:10" | ForEach-Object { New-ScheduledTaskTrigger -Daily -At $_ }
$action = New-ScheduledTaskAction -Execute "wscript.exe" -Argument "`"$PSScriptRoot\run-hidden.vbs`""
$set = New-ScheduledTaskSettingsSet -WakeToRun -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries `
  -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Hours 1)
Register-ScheduledTask -TaskName "WeeklyWick Render" -Trigger $triggers -Action $action -Settings $set -Force | Out-Null

# Let scheduled tasks wake the PC (power plan "Allow wake timers"), on power and on battery.
powercfg /setacvalueindex SCHEME_CURRENT SUB_SLEEP RTCWAKE 1
powercfg /setdcvalueindex SCHEME_CURRENT SUB_SLEEP RTCWAKE 1
powercfg /setactive SCHEME_CURRENT
Write-Host "WeeklyWick Render registered: daily 17:12, 17:38, 18:10, 18:40, 21:10 (hidden, wakes the PC)."

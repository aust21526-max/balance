# Run by the "WeeklyWick Wake" task, which wakes the PC from sleep just after the daily packet saves
# (Drive save at 17:05 and 18:05 KST) and before the Saturday cards. Keeps the PC awake, gives Google
# Drive a few minutes to sync after waking, then runs "WeeklyWick Render" (render + members sync)
# and waits for it so the PC does not fall back asleep halfway.
Add-Type -Namespace WeeklyWick -Name Power -MemberDefinition '[DllImport("kernel32.dll")] public static extern uint SetThreadExecutionState(uint flags);'
[WeeklyWick.Power]::SetThreadExecutionState(0x80000001) | Out-Null  # ES_CONTINUOUS | ES_SYSTEM_REQUIRED
Start-Sleep -Seconds 240
Start-ScheduledTask -TaskName "WeeklyWick Render"
Start-Sleep -Seconds 10
$until = (Get-Date).AddMinutes(30)
while ((Get-ScheduledTask -TaskName "WeeklyWick Render").State -eq "Running" -and (Get-Date) -lt $until) { Start-Sleep -Seconds 15 }
[WeeklyWick.Power]::SetThreadExecutionState(0x80000000) | Out-Null  # back to normal sleep rules

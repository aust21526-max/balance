# One Weekly Wick run: keeps the PC awake while it works (the task can wake it from sleep),
# then renders pending cards and publishes members data via render-pending.cmd.
Add-Type -Namespace WeeklyWick -Name Power -MemberDefinition '[DllImport("kernel32.dll")] public static extern uint SetThreadExecutionState(uint flags);'
[WeeklyWick.Power]::SetThreadExecutionState(0x80000001) | Out-Null  # ES_CONTINUOUS | ES_SYSTEM_REQUIRED
try { & cmd.exe /c "`"$PSScriptRoot\render-pending.cmd`"" }
finally { [WeeklyWick.Power]::SetThreadExecutionState(0x80000000) | Out-Null }

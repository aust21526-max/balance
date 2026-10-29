# One Weekly Wick run: keeps the PC awake while it works (the task can wake it from sleep),
# then renders pending cards and publishes members data via render-pending.cmd.
# Between 17:00 and 19:30 on mains power it stays awake and repeats every 5 minutes, so a card
# Grok writes in that window is rendered even if a later wake-up fails, and Google Drive has
# time to sync the new files after the PC wakes. On battery, or outside that window, it runs once.
Add-Type -Namespace WeeklyWick -Name Power -MemberDefinition '[DllImport("kernel32.dll")] public static extern uint SetThreadExecutionState(uint flags);'
Add-Type -AssemblyName System.Windows.Forms
$log = Join-Path $PSScriptRoot "..\..\out\pending.log"
$until = (Get-Date).Date.AddHours(19).AddMinutes(30)
function OnMains { [System.Windows.Forms.SystemInformation]::PowerStatus.PowerLineStatus -eq 'Online' }
[WeeklyWick.Power]::SetThreadExecutionState(0x80000001) | Out-Null  # ES_CONTINUOUS | ES_SYSTEM_REQUIRED
try {
  while ($true) {
    Add-Content -Path $log -Value ("== run {0:yyyy-MM-dd HH:mm} mains={1}" -f (Get-Date), (OnMains))
    & cmd.exe /c "`"$PSScriptRoot\render-pending.cmd`""
    if ((Get-Date).Hour -lt 17 -or (Get-Date).AddMinutes(5) -ge $until -or -not (OnMains)) { break }
    Start-Sleep -Seconds 300
  }
}
finally { [WeeklyWick.Power]::SetThreadExecutionState(0x80000000) | Out-Null }

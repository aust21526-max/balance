' Started by the "WeeklyWick Render" task through wscript.exe so no console window appears.
' Runs sync-run.ps1 hidden and waits for it; the log is still out\pending.log.
Set sh = CreateObject("WScript.Shell")
dir = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)
sh.Run "powershell.exe -NoProfile -ExecutionPolicy Bypass -File """ & dir & "\sync-run.ps1""", 0, True

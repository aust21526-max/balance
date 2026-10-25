@echo off
rem Weekly Wick auto-render, run by Windows Task Scheduler every 30 minutes.
rem Renders queue/<date> folders whose card.json or script.md changed (see render.mjs --pending).
rem Needs Git for Windows; change GITBASH below if it is installed elsewhere.
setlocal
set "GITBASH=C:\Program Files\Git\bin\bash.exe"
set "STUDIO=%~dp0..\.."
pushd "%STUDIO%"
if not exist out mkdir out
rem Keep Git Bash in this folder (a login shell would otherwise cd to $HOME).
set CHERE_INVOKING=1
"%GITBASH%" -lc "./render.sh --pending" >> out\pending.log 2>&1
popd
endlocal

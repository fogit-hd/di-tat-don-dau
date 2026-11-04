@echo off
setlocal
rem Preview: clean-dev.cmd -Preview
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\clean-dev.ps1" %*
exit /b %errorlevel%

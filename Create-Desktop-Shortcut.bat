@echo off
title Creating Desktop Shortcut
echo.
echo Creating APMC Billing shortcut on Desktop...
echo.

set "SCRIPT_DIR=%~dp0"
set "SHORTCUT=%USERPROFILE%\Desktop\APMC Billing.lnk"

powershell -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%SHORTCUT%'); $s.TargetPath = '%SCRIPT_DIR%release\win-unpacked\APMC Unjha Billing.exe'; $s.WorkingDirectory = '%SCRIPT_DIR%release\win-unpacked'; $s.Description = 'APMC Unjha Commission Billing Software'; $s.WindowStyle = 1; $s.Save()"

echo.
echo  Shortcut created on Desktop!
echo  Double-click "APMC Billing" on your desktop to start.
echo.
pause

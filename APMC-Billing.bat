@echo off
title APMC Unjha Billing Software
echo.
echo  =========================================
echo   APMC Unjha - Commission Billing Software
echo   એ.પી.એમ.સી. ઊંઝા - કમિશન બિલિંગ
echo  =========================================
echo.
echo  Starting software... Please wait...
echo.
cd /d "%~dp0"
node server.js
pause

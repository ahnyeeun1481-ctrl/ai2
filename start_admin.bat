@echo off
cd /d "%~dp0"
py -3 content_admin.py
if errorlevel 1 python content_admin.py
pause
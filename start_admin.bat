@echo off
cd /d "%~dp0"
where py >nul 2>nul
if not errorlevel 1 (
  py -3 content_admin.py
) else (
  where python.exe >nul 2>nul
  if not errorlevel 1 (
    python.exe content_admin.py
  ) else (
    echo Python 3 is required. Install Python from https://www.python.org/downloads/windows/
  )
)
pause
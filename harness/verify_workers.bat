@echo off
setlocal
cd /d "%~dp0.."

echo Checking JavaScript syntax...
node --check script.js || exit /b 1
node --check worker\src\index.js || exit /b 1

if exist content_admin.py (
  echo Checking local admin Python syntax...
  python -m py_compile content_admin.py || exit /b 1
)

echo Checking Wrangler dry run and bindings...
if exist "%APPDATA%\npm\wrangler.cmd" (
  call "%APPDATA%\npm\wrangler.cmd" deploy --dry-run --config wrangler.jsonc || exit /b 1
) else (
  call wrangler.cmd deploy --dry-run --config wrangler.jsonc || exit /b 1
)

echo Harness verification passed. This script does not deploy or apply remote migrations.
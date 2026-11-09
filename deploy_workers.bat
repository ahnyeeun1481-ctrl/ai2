@echo off
setlocal
cd /d "%~dp0"

if not exist "cloudflare-site" mkdir "cloudflare-site"
for %%F in (index.html style.css script.js site-content.json robots.txt sitemap.xml favicon.svg admin.html) do (
  if not exist "%%F" (
    echo Required public file is missing: %%F
    exit /b 1
  )
  copy /Y "%%F" "cloudflare-site\%%F" >nul
)

if not exist "og-image.png" (
  echo OG image is missing: og-image.png
  exit /b 1
)
copy /Y "og-image.png" "cloudflare-site\og-image.png" >nul

if not exist "google5d7d03fc983c8bbd.html" (
  echo Google Search Console verification file is missing: google5d7d03fc983c8bbd.html
  exit /b 1
)
copy /Y "google5d7d03fc983c8bbd.html" "cloudflare-site\google5d7d03fc983c8bbd.html" >nul

where wrangler.cmd >nul 2>nul
if not errorlevel 1 (
  call wrangler.cmd deploy --config "wrangler.jsonc"
) else if exist "%APPDATA%\npm\wrangler.cmd" (
  call "%APPDATA%\npm\wrangler.cmd" deploy --config "wrangler.jsonc"
) else (
  echo Wrangler CLI is not available. Open a new terminal or install Wrangler.
  exit /b 1
)
exit /b %ERRORLEVEL%
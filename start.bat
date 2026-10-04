@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion
set "HTML=%~dp0index.html"

rem 按顺序检测浏览器：Chrome -> Edge
set "BROWSER="

rem --- Chrome: 注册表 App Paths 优先，其次常见安装路径 ---
for /f "tokens=2,*" %%a in ('reg query "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\chrome.exe" /ve 2^>nul ^| find /i "REG_SZ"') do set "BROWSER=%%b"
if not defined BROWSER for /f "tokens=2,*" %%a in ('reg query "HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\chrome.exe" /ve 2^>nul ^| find /i "REG_SZ"') do set "BROWSER=%%b"
if not defined BROWSER if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" set "BROWSER=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if not defined BROWSER if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" set "BROWSER=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if not defined BROWSER if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" set "BROWSER=%LocalAppData%\Google\Chrome\Application\chrome.exe"

rem --- Edge: 仅在未找到 Chrome 时检测 ---
if not defined BROWSER (
    for /f "tokens=2,*" %%a in ('reg query "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\msedge.exe" /ve 2^>nul ^| find /i "REG_SZ"') do if not defined BROWSER set "BROWSER=%%b"
    if not defined BROWSER if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" set "BROWSER=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
    if not defined BROWSER if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" set "BROWSER=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
)

if defined BROWSER goto :open_with_browser

rem --- 两者都没有：用默认浏览器打开，并提示画廊功能受限 ---
start "" "%HTML%"
echo 未检测到 Chrome / Edge，已使用系统默认浏览器打开 index.html。
echo [提示] 画廊功能依赖 File System Access API（showDirectoryPicker），
echo        仅 Chrome / Edge 支持。当前浏览器下画廊功能受限。
goto :end

:open_with_browser
start "" "!BROWSER!" "%HTML%"
echo 已使用浏览器打开 index.html: !BROWSER!

:end
endlocal
pause

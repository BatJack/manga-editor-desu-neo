"""Locate and open the app in a browser that can run the gallery fully.

The gallery's path memory and watch mode need the File System Access API
(showDirectoryPicker). Only Chromium browsers implement it, so the server
prefers Chrome, then Edge, and says so plainly when it has to fall back to the
system default - a silent fallback would leave the user wondering why the
gallery is limited.
"""
import os
import subprocess
import sys
import webbrowser

APP_PATHS_KEY = r'SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\{}'
CHROME_EXE = 'chrome.exe'
EDGE_EXE = 'msedge.exe'
INSTALL_ROOTS = ('ProgramFiles', 'ProgramFiles(x86)', 'LocalAppData')

UNSUPPORTED_WARNING = (
    '未检测到 Chrome / Edge，已改用系统默认浏览器打开。\n'
    '该浏览不受支持，画廊功能受限。\n'
    '画廊的路径记忆与目录监控依赖 File System Access API（showDirectoryPicker），'
    '仅 Chrome / Edge 支持。'
)


def _registry_install_path(exe_name):
    """App Paths is the authoritative install location; returns None if absent."""
    if os.name != 'nt':
        return None
    try:
        import winreg
    except ImportError:
        return None
    for hive in (winreg.HKEY_LOCAL_MACHINE, winreg.HKEY_CURRENT_USER):
        try:
            with winreg.OpenKey(hive, APP_PATHS_KEY.format(exe_name)) as key:
                value, _ = winreg.QueryValueEx(key, None)
        except OSError:
            continue
        if value and os.path.exists(value):
            return value
    return None


def _common_paths(relative):
    """Candidate install paths across the usual roots, skipping unset ones."""
    candidates = []
    for var in INSTALL_ROOTS:
        base = os.environ.get(var)
        if base:
            candidates.append(os.path.join(base, *relative))
    return candidates


def _first_existing(candidates):
    for path in candidates:
        if path and os.path.exists(path):
            return path
    return None


def _find(exe_name, relative):
    return _registry_install_path(exe_name) or _first_existing(_common_paths(relative))


def find_chrome():
    return _find(CHROME_EXE, ('Google', 'Chrome', 'Application', CHROME_EXE))


def find_edge():
    return _find(EDGE_EXE, ('Microsoft', 'Edge', 'Application', EDGE_EXE))


def supported_browsers():
    """Installed supported browsers, Chrome before Edge."""
    found = []
    for name, finder in (('Chrome', find_chrome), ('Edge', find_edge)):
        path = finder()
        if path:
            found.append((name, path))
    return found


def open_url(url, browsers=None):
    """Open url in the first supported browser, else the system default.

    Returns (browser_name, path) for the supported case, or None when it fell
    back to the default browser.
    """
    candidates = supported_browsers() if browsers is None else list(browsers)
    if candidates:
        name, path = candidates[0]
        try:
            subprocess.Popen([path, url])
            return name, path
        except OSError as err:
            print('Failed to launch %s (%s); falling back to the default browser.' % (name, err))
    webbrowser.open(url)
    return None


def launch(url):
    """Open the app and report what happened. Returns True if a supported
    browser was used."""
    result = open_url(url)
    if result is None:
        _warn_unsupported()
        return False
    name, path = result
    print('Opened %s: %s' % (name, path))
    return True


def _warn_unsupported():
    for line in UNSUPPORTED_WARNING.split('\n'):
        print(line)


def _make_console_utf8_safe():
    """CJK output raises UnicodeEncodeError on a non-UTF-8 console code page."""
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding='utf-8', errors='replace')
        except (AttributeError, ValueError, OSError):
            pass
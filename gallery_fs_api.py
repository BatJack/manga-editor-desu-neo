"""Read-only local filesystem bridge for the gallery.

Isolated from 99_server.py so path and request logic is unit-testable
without opening a socket.
"""
import os
import secrets
import string
from urllib.parse import urlsplit, parse_qsl

LOCAL_HOSTS = ('localhost', '127.0.0.1')
ALLOWED_FETCH_SITES = ('same-origin', 'none')
IMAGE_EXTENSIONS = frozenset(('.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.avif'))


def new_token():
    return secrets.token_urlsafe(32)


def check_host(headers):
    host = (headers.get('Host') or '').strip().lower()
    if not host:
        return False
    if ':' in host:
        host = host.rsplit(':', 1)[0]
    return host in LOCAL_HOSTS


def is_api_request(headers):
    return (headers.get('Sec-Fetch-Site') or '').strip().lower() in ALLOWED_FETCH_SITES


def may_serve_api(headers, presented_token, expected_token):
    """Gate every API response on loopback host, same-origin fetch, and token.

    All three checks are required: the host check defeats DNS rebinding, the
    fetch-site check stops another site reaching this origin at all, and the
    token stops other local processes. An unconfigured expected_token fails
    closed - a server that never generated one must serve nothing.
    """
    if not check_host(headers):
        return False
    if not is_api_request(headers):
        return False
    if not expected_token or not presented_token:
        return False
    return secrets.compare_digest(str(presented_token), str(expected_token))


def parse_query(url):
    """Percent-decode a query string so non-ASCII paths survive the round trip."""
    return dict(parse_qsl(urlsplit(url).query, keep_blank_values=True))


# ── path hardening ──────────────────────────────────────────

def normalize_path(raw):
    """Return the realpath of an absolute, traversal-free path.

    Raises ValueError for anything the caller must not reach. '..' is rejected
    on the raw string before realpath so a symlink cannot be used to smuggle a
    traversal past the check.
    """
    if raw is None:
        raise ValueError('path is required')
    text = str(raw).strip().strip('"')
    if not text:
        raise ValueError('path is empty')
    if '\x00' in text:
        raise ValueError('path contains a null byte')
    if not os.path.isabs(text):
        raise ValueError('path must be absolute: %s' % text)
    parts = text.replace('\\', '/').split('/')
    if '..' in parts:
        raise ValueError('path must not traverse: %s' % text)
    resolved = os.path.realpath(text)
    if not os.path.isabs(resolved):
        raise ValueError('path did not resolve to an absolute path')
    return resolved


def validate_name(name):
    """Accept a bare file name only - no separators, no dot names."""
    if name is None:
        raise ValueError('name is required')
    text = str(name)
    if not text:
        raise ValueError('name is empty')
    if text in ('.', '..'):
        raise ValueError('name must not be a dot name')
    separators = {'/', os.sep}
    if os.altsep:
        separators.add(os.altsep)
    if any(sep in text for sep in separators):
        raise ValueError('name must not contain a path separator: %s' % text)
    if '\x00' in text:
        raise ValueError('name contains a null byte')
    return text


# ── directory scanning ──────────────────────────────────────

def scan_dir(path):
    """List one directory. Raises ValueError if it is missing or not a directory."""
    resolved = normalize_path(path)
    if not os.path.isdir(resolved):
        raise ValueError('not a directory: %s' % resolved)

    folders = []
    images = []
    for entry in os.scandir(resolved):
        try:
            if entry.is_dir(follow_symlinks=False):
                folders.append({'name': entry.name, 'path': entry.path})
            elif entry.is_file(follow_symlinks=False):
                if os.path.splitext(entry.name)[1].lower() not in IMAGE_EXTENSIONS:
                    continue
                stat = entry.stat()
                images.append({
                    'name': entry.name,
                    'path': entry.path,
                    'mtime': int(stat.st_mtime * 1000),
                    'size': stat.st_size,
                })
        except OSError:
            # A file removed mid-scan must not abort the whole listing.
            continue

    folders.sort(key=lambda f: f['name'])
    images.sort(key=lambda i: i['name'])

    parent = os.path.dirname(resolved)
    return {
        'path': resolved,
        'parent': parent if parent and parent != resolved else None,
        'folders': folders,
        'images': images,
    }


def find_image(scanned, name):
    """Locate one image entry by exact name. Raises KeyError when absent."""
    wanted = validate_name(name)
    for image in scanned.get('images', ()):
        if image['name'] == wanted:
            return image
    raise KeyError(wanted)


# ── root discovery (folder picker entry point) ──────────────

def list_roots():
    """Return browsable roots so the picker has somewhere to start.

    Entry shape matches scan_dir's folder entries, so the picker renders both
    with the same code. isdir() rather than exists() keeps empty optical drives
    and disconnected volumes out of the list.
    """
    roots = []
    if os.name == 'nt':
        for letter in string.ascii_uppercase:
            drive = letter + ':\\'
            try:
                if os.path.isdir(drive):
                    roots.append({'name': drive, 'path': drive})
            except OSError:
                continue
    else:
        if os.path.isdir('/'):
            roots.append({'name': '/', 'path': '/'})
        home = os.path.expanduser('~')
        if home and os.path.isdir(home):
            roots.append({'name': home, 'path': home})
    return roots
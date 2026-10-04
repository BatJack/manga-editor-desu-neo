"""Read-only local filesystem bridge for the gallery.

Isolated from 99_server.py so path and request logic is unit-testable
without opening a socket.
"""
import secrets

LOCAL_HOSTS = ('localhost', '127.0.0.1')
ALLOWED_FETCH_SITES = ('same-origin', 'none')


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
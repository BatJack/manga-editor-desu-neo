"""Development server for Manga Editor Desu.

Serves the app on loopback and opens it in a browser that can run the gallery
properly. The gallery's path memory and watch mode need the File System Access
API, which only Chromium browsers implement, so Chrome and Edge are preferred
and the fallback is announced rather than silent.
"""
from concurrent.futures import ThreadPoolExecutor
from http.server import SimpleHTTPRequestHandler
import socketserver
import os
import mimetypes

import browser_launcher

mimetypes.add_type('application/javascript', '.js')


class LocalOnlyRequestHandler(SimpleHTTPRequestHandler):
    """Static file server bound to loopback, with no CORS header.

    A browser-side endpoint that could read arbitrary paths once lived here.
    It is gone; the gallery now uses the File System Access API directly, so
    this handler only ever serves the project's own files.
    """

    protocol_version = 'HTTP/1.1'

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        self.send_header('Connection', 'keep-alive')
        self.send_header('Service-Worker-Allowed', '/')
        return super(LocalOnlyRequestHandler, self).end_headers()

    def do_GET(self):
        self.directory = os.getcwd()
        return SimpleHTTPRequestHandler.do_GET(self)

    def handle_one_request(self):
        try:
            super().handle_one_request()
        except ConnectionAbortedError:
            pass


class ThreadedTCPServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    daemon_threads = True
    allow_reuse_address = True
    request_queue_size = 500
    timeout = 60


def main():
    port = 8000
    address = "127.0.0.1"
    url = 'http://localhost:%d/index.html' % port
    browser_launcher._make_console_utf8_safe()

    socketserver.TCPServer.allow_reuse_address = True
    with ThreadedTCPServer((address, port), LocalOnlyRequestHandler) as httpd:
        with ThreadPoolExecutor(max_workers=500):
            print('Server running at http://localhost:%d' % port)
            supported = browser_launcher.launch(url)
            try:
                httpd.serve_forever()
            except KeyboardInterrupt:
                print('\nShutting down server...')
                httpd.shutdown()
    return supported


if __name__ == '__main__':
    main()
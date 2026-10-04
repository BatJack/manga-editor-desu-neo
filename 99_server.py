from concurrent.futures import ThreadPoolExecutor
from http.server import SimpleHTTPRequestHandler
import socketserver
import os
import json
import mimetypes
import gallery_fs_api

mimetypes.add_type('application/javascript', '.js')

API_PREFIX = '/api/fs/'


class CORSRequestHandler(SimpleHTTPRequestHandler):
    protocol_version = 'HTTP/1.1'

    # Set from __main__ so the handler can compare presented tokens without
    # importing server state into the pure gallery_fs_api module.
    api_token = None

    def end_headers(self):
        # No Access-Control-Allow-Origin: an endpoint that reads arbitrary
        # paths must never be readable cross-origin by another site.
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        self.send_header('Connection', 'keep-alive')
        self.send_header('Service-Worker-Allowed', '/')
        return super(CORSRequestHandler, self).end_headers()

    def _send_json(self, status, payload):
        body = json.dumps(payload).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _send_error_json(self, status, reason):
        self._send_json(status, {'error': reason})

    def _presented_token(self):
        return self.headers.get('X-Gallery-Token')

    def _serve_session(self):
        # Hands out the token, so it must never be reachable cross-origin.
        if not gallery_fs_api.check_host(self.headers):
            self._send_error_json(403, 'host not allowed')
            return
        if not gallery_fs_api.is_api_request(self.headers):
            self._send_error_json(403, 'not a same-origin request')
            return
        self._send_json(200, {'token': self.api_token})

    def _serve_list(self, query):
        raw = query.get('path')
        if not raw:
            self._send_error_json(400, 'path is required')
            return
        try:
            self._send_json(200, gallery_fs_api.scan_dir(raw))
        except ValueError as err:
            self._send_error_json(400, str(err))
        except OSError as err:
            self._send_error_json(404, str(err))

    def _serve_roots(self):
        # Entry point for the folder picker. Returns drive letters only - no
        # file contents - behind the same gate as every other endpoint.
        self._send_json(200, {'roots': gallery_fs_api.list_roots()})

    def _serve_image(self, query):
        raw = query.get('path')
        name = query.get('name')
        if not raw or not name:
            self._send_error_json(400, 'path and name are required')
            return
        try:
            scanned = gallery_fs_api.scan_dir(raw)
            entry = gallery_fs_api.find_image(scanned, name)
        except KeyError:
            self._send_error_json(404, 'image not found: %s' % name)
            return
        except ValueError as err:
            self._send_error_json(400, str(err))
            return

        content_type = mimetypes.guess_type(entry['name'])[0] or 'application/octet-stream'
        try:
            with open(entry['path'], 'rb') as handle:
                body = handle.read()
        except OSError as err:
            # Folder vanished or permissions changed between scan and read.
            self._send_error_json(404, str(err))
            return
        self.send_response(200)
        self.send_header('Content-Type', content_type)
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _serve_api(self):
        endpoint = self.path[len(API_PREFIX):].split('?', 1)[0]
        if endpoint == 'session':
            self._serve_session()
            return
        if not gallery_fs_api.may_serve_api(
                self.headers, self._presented_token(), self.api_token):
            self._send_error_json(403, 'forbidden')
            return
        query = gallery_fs_api.parse_query(self.path)
        if endpoint == 'list':
            self._serve_list(query)
        elif endpoint == 'roots':
            self._serve_roots()
        elif endpoint == 'image':
            self._serve_image(query)
        else:
            self._send_error_json(404, 'unknown endpoint: %s' % endpoint)

    def do_GET(self):
        self.directory = os.getcwd()
        if self.path.startswith(API_PREFIX):
            # Never fall through to static file serving.
            self._serve_api()
            return
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


if __name__ == '__main__':
    PORT = 8000
    ADDRESS = "127.0.0.1"
    socketserver.TCPServer.allow_reuse_address = True
    token = gallery_fs_api.new_token()
    CORSRequestHandler.api_token = token

    with ThreadedTCPServer((ADDRESS, PORT), CORSRequestHandler) as httpd:
        with ThreadPoolExecutor(max_workers=500) as executor:
            print(f"Server running at http://localhost:{PORT}")
            print(f"Gallery API token: {token}")
            try:
                httpd.serve_forever()
            except KeyboardInterrupt:
                print("\nShutting down server...")
                httpd.shutdown()
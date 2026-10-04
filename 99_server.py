from concurrent.futures import ThreadPoolExecutor
from http.server import SimpleHTTPRequestHandler
import socketserver
import os
import mimetypes
import gallery_fs_api

mimetypes.add_type('application/javascript', '.js')

class CORSRequestHandler(SimpleHTTPRequestHandler):
    protocol_version = 'HTTP/1.1'

    def end_headers(self):
        # No Access-Control-Allow-Origin: an endpoint that reads arbitrary
        # paths must never be readable cross-origin by another site.
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        self.send_header('Connection', 'keep-alive')
        self.send_header('Service-Worker-Allowed', '/')
        return super(CORSRequestHandler, self).end_headers()
        
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

if __name__ == '__main__':
    PORT = 8000
    ADDRESS = "127.0.0.1"
    socketserver.TCPServer.allow_reuse_address = True
    token = gallery_fs_api.new_token()

    with ThreadedTCPServer((ADDRESS, PORT), CORSRequestHandler) as httpd:
        with ThreadPoolExecutor(max_workers=500) as executor:
            print(f"Server running at http://localhost:{PORT}")
            print(f"Gallery API token: {token}")
            try:
                httpd.serve_forever()
            except KeyboardInterrupt:
                print("\nShutting down server...")
                httpd.shutdown()
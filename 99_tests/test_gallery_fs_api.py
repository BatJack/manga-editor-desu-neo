import unittest
from email.message import Message
import gallery_fs_api


def headers(host=None, fetch_site=None):
    m = Message()
    if host is not None:
        m['Host'] = host
    if fetch_site is not None:
        m['Sec-Fetch-Site'] = fetch_site
    return m


class TestHostCheck(unittest.TestCase):
    def test_allows_localhost_and_loopback(self):
        for host in ('localhost', 'localhost:8000', '127.0.0.1', '127.0.0.1:8000'):
            self.assertTrue(gallery_fs_api.check_host(headers(host)), host)

    def test_rejects_foreign_host(self):
        for host in ('evil.com', 'attacker.com:8000', '192.168.0.5:8000'):
            self.assertFalse(gallery_fs_api.check_host(headers(host)), host)

    def test_rejects_missing_host(self):
        self.assertFalse(gallery_fs_api.check_host(headers()))


class TestFetchSite(unittest.TestCase):
    def test_same_origin_and_none_allowed(self):
        self.assertTrue(gallery_fs_api.is_api_request(headers(fetch_site='same-origin')))
        self.assertTrue(gallery_fs_api.is_api_request(headers(fetch_site='none')))

    def test_cross_site_and_same_site_rejected(self):
        self.assertFalse(gallery_fs_api.is_api_request(headers(fetch_site='cross-site')))
        self.assertFalse(gallery_fs_api.is_api_request(headers(fetch_site='same-site')))


class TestToken(unittest.TestCase):
    def test_token_is_urlsafe_and_long(self):
        t = gallery_fs_api.new_token()
        self.assertGreaterEqual(len(t), 32)
        self.assertTrue(all(c.isalnum() or c in '-_' for c in t), t)


if __name__ == '__main__':
    unittest.main()
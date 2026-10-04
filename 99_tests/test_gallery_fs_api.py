import unittest
from email.message import Message
import os
import tempfile
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


class TestNormalizePath(unittest.TestCase):
    def test_accepts_absolute(self):
        d = tempfile.mkdtemp()
        self.assertEqual(gallery_fs_api.normalize_path(d), os.path.realpath(d))

    def test_rejects_empty_and_relative(self):
        for bad in ('', '   ', 'relative/path'):
            with self.assertRaises(ValueError):
                gallery_fs_api.normalize_path(bad)

    def test_rejects_traversal(self):
        with self.assertRaises(ValueError):
            gallery_fs_api.normalize_path(os.path.join(tempfile.gettempdir(), '..', 'etc'))


class TestValidateName(unittest.TestCase):
    def test_accepts_plain_name(self):
        self.assertEqual(gallery_fs_api.validate_name('a.png'), 'a.png')

    def test_rejects_separators_and_dotnames(self):
        for bad in ('../x', 'a/b', 'a\\b', '.', '..', ''):
            with self.assertRaises(ValueError):
                gallery_fs_api.validate_name(bad)


class TestScanDir(unittest.TestCase):
    def setUp(self):
        self.root = tempfile.mkdtemp()
        os.makedirs(os.path.join(self.root, 'sub'))
        for n in ('b.png', 'a.jpg', 'notes.txt'):
            open(os.path.join(self.root, n), 'w').close()

    def test_folders_and_images_sorted(self):
        out = gallery_fs_api.scan_dir(self.root)
        self.assertEqual([f['name'] for f in out['folders']], ['sub'])
        self.assertEqual([i['name'] for i in out['images']], ['a.jpg', 'b.png'])

    def test_image_entries_carry_mtime_and_size(self):
        out = gallery_fs_api.scan_dir(self.root)
        entry = [i for i in out['images'] if i['name'] == 'b.png'][0]
        self.assertIsInstance(entry['mtime'], int)
        self.assertIsInstance(entry['size'], int)

    def test_parent_present_for_nested_dir(self):
        out = gallery_fs_api.scan_dir(os.path.join(self.root, 'sub'))
        self.assertIsNotNone(out['parent'])

    def test_non_ascii_and_space_names(self):
        d = os.path.join(self.root, '漫画 #1')
        os.makedirs(d)
        open(os.path.join(d, '画像 01.png'), 'w').close()
        out = gallery_fs_api.scan_dir(d)
        self.assertEqual([i['name'] for i in out['images']], ['画像 01.png'])

    def test_rejects_file_and_missing(self):
        f = os.path.join(self.root, 'a.png')
        with self.assertRaises(ValueError):
            gallery_fs_api.scan_dir(f)
        with self.assertRaises(ValueError):
            gallery_fs_api.scan_dir(os.path.join(self.root, 'nope'))

    def test_find_image(self):
        out = gallery_fs_api.scan_dir(self.root)
        self.assertEqual(gallery_fs_api.find_image(out, 'b.png')['name'], 'b.png')
        with self.assertRaises(KeyError):
            gallery_fs_api.find_image(out, 'missing.png')


class TestAuthGate(unittest.TestCase):
    def test_session_requires_same_origin(self):
        self.assertFalse(gallery_fs_api.may_serve_api(
            headers(host='localhost', fetch_site='cross-site'), 'right', 'right'))

    def test_api_requires_matching_token(self):
        same_origin = headers(host='localhost', fetch_site='same-origin')
        self.assertFalse(gallery_fs_api.may_serve_api(same_origin, 'wrong', 'right'))
        self.assertTrue(gallery_fs_api.may_serve_api(same_origin, 'right', 'right'))

    def test_missing_token_rejected(self):
        same_origin = headers(host='localhost', fetch_site='same-origin')
        self.assertFalse(gallery_fs_api.may_serve_api(same_origin, None, 'right'))

    def test_foreign_host_never_served(self):
        self.assertFalse(gallery_fs_api.may_serve_api(
            headers(host='evil.com', fetch_site='same-origin'), 'right', 'right'))


class TestParseQuery(unittest.TestCase):
    def test_percent_decoded_values(self):
        q = gallery_fs_api.parse_query('/api/fs/list?path=' + 'D%3A%5C%E6%BC%AB%E7%94%BB%20%231')
        self.assertEqual(q['path'], 'D:\\漫画 #1')

    def test_missing_key_is_absent(self):
        self.assertNotIn('path', gallery_fs_api.parse_query('/api/fs/list'))


if __name__ == '__main__':
    unittest.main()
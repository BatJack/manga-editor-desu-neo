import os
import tempfile
import unittest
import browser_launcher


class TestFirstExisting(unittest.TestCase):
    def test_returns_first_existing_candidate(self):
        with tempfile.TemporaryDirectory() as tmp:
            a = os.path.join(tmp, 'a.exe')
            b = os.path.join(tmp, 'b.exe')
            open(b, 'w').close()
            self.assertEqual(browser_launcher._first_existing([a, b]), b)

    def test_returns_none_when_nothing_exists(self):
        with tempfile.TemporaryDirectory() as tmp:
            missing = os.path.join(tmp, 'nope.exe')
            self.assertIsNone(browser_launcher._first_existing([missing]))
            self.assertIsNone(browser_launcher._first_existing([]))
            self.assertIsNone(browser_launcher._first_existing([None, '']))

    def test_skips_empty_entries(self):
        with tempfile.TemporaryDirectory() as tmp:
            real = os.path.join(tmp, 'real.exe')
            open(real, 'w').close()
            self.assertEqual(browser_launcher._first_existing([None, '', real]), real)


class TestCommonPaths(unittest.TestCase):
    def test_covers_program_files_and_localappdata(self):
        # Chrome lives under Program Files / LocalAppData depending on install.
        roots = browser_launcher._common_paths(('Google', 'Chrome', 'Application', 'chrome.exe'))
        self.assertTrue(roots, 'no candidate roots produced')
        for path in roots:
            self.assertTrue(path.endswith(os.path.join('Google', 'Chrome', 'Application', 'chrome.exe')))

    def test_handles_missing_environment_variables(self):
        saved = dict(os.environ)
        try:
            for var in ('ProgramFiles', 'ProgramFiles(x86)', 'LocalAppData'):
                os.environ.pop(var, None)
            self.assertEqual(browser_launcher._common_paths(('x', 'y')), [])
        finally:
            os.environ.clear()
            os.environ.update(saved)


class TestDetection(unittest.TestCase):
    def test_found_browsers_point_at_real_executables(self):
        for name, path in browser_launcher.supported_browsers():
            self.assertTrue(os.path.isfile(path), '%s: %s is not a file' % (name, path))

    def test_chrome_is_preferred_over_edge(self):
        found = browser_launcher.supported_browsers()
        names = [name for name, _ in found]
        if 'Chrome' in names and 'Edge' in names:
            self.assertLess(names.index('Chrome'), names.index('Edge'))

    def test_find_chrome_and_edge_return_existing_path_or_none(self):
        for finder in (browser_launcher.find_chrome, browser_launcher.find_edge):
            path = finder()
            if path is not None:
                self.assertTrue(os.path.isfile(path), path)

    def test_registry_lookup_returns_existing_path_or_none(self):
        path = browser_launcher._registry_install_path('chrome.exe')
        if path is not None:
            self.assertTrue(os.path.exists(path), path)

    def test_unknown_executable_resolves_to_none(self):
        self.assertIsNone(browser_launcher._registry_install_path('definitely-not-installed-xyz.exe'))


class TestUnsupportedWarning(unittest.TestCase):
    def test_warning_mentions_the_gallery_limitation(self):
        text = browser_launcher.UNSUPPORTED_WARNING
        self.assertIn('Chrome', text)
        self.assertIn('Edge', text)
        self.assertTrue(text.strip())


if __name__ == '__main__':
    unittest.main()
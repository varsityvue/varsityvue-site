"""Post-release review boundaries and repeatability."""
import importlib.util
import json
import unittest
from pathlib import Path
spec = importlib.util.spec_from_file_location('refresh', Path(__file__).with_name('refresh-playoff-completion.py'))
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)

class CompletionTests(unittest.TestCase):
    def test_refresh_holds_and_is_reproducible(self):
        history = {p: p.read_bytes() for p in m.HISTORY.rglob('*.json')}
        m.refresh()
        output = m.PACKET / 'publication-disabled'
        first = {p: p.read_bytes() for p in output.glob('*.json')}
        m.refresh()
        self.assertEqual(first, {p: p.read_bytes() for p in output.glob('*.json')})
        self.assertEqual(history, {p: p.read_bytes() for p in m.HISTORY.rglob('*.json')})
        master = json.loads((output / 'all-candidates.json').read_text())
        self.assertEqual(master['summary']['total'], 192)
        self.assertEqual(master['summary']['coreScheduleEvidenceComplete'], 53)
        self.assertEqual(master['summary']['supportedSideMappings'], 22)
        self.assertEqual(sum(bool(r['existingGameId']) for r in master['records']), 7)
        for r in master['records']:
            self.assertFalse(r['executionEnabled'])
            self.assertFalse(r['insertAllowed'])
            self.assertIsNone(r['writePayload'])
            self.assertIsNone(r['schedule']['neutralSite'])
            if all(s['catalogState'] == 'released-record' for s in r['qualifiedSchools']):
                self.assertNotIn('catalog integration release required', r['publicationBlockers'])
        sterling = next(r for r in master['records'] if any(s['schoolSlug'] == 'houston-sterling' for s in r['qualifiedSchools']))
        self.assertIn('incomplete school metadata held', sterling['publicationBlockers'])

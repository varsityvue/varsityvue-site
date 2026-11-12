"""Regression checks for offline publication manifest boundaries."""
import copy
import importlib.util
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('manifests', HERE / 'prepare-playoff-publication-manifests.py')
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)


class PublicationManifestTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        def read(name):
            return json.loads((m.PACKET / name).read_text())
        cls.inputs = [read('reviewed-candidates.json')['candidates'], read('school-identity-review.json'),
                      read('school-catalog-proposals.json'), read('designated-sides-and-venues-review.json'),
                      read('schedule-expansion-20261111.json'), read('release-candidate-context-20261111.json')]

    def test_full_inventory_no_execution_or_duplicates(self):
        result = m.build(*self.inputs)
        self.assertEqual(result['summary']['total'], 192)
        self.assertEqual(result['summary']['coreScheduleEvidenceComplete'], 52)
        self.assertEqual(result['summary']['supportedSideMappings'], 21)
        self.assertEqual(result['summary']['bothDesignatedSidesExplicit'], 16)
        self.assertEqual(result['summary']['formalNeutralityConfirmed'], 0)
        self.assertEqual(len({row['manifestId'] for row in result['records']}), 192)
        for row in result['records']:
            self.assertFalse(row['executionEnabled'])
            self.assertFalse(row['insertAllowed'])
            self.assertFalse(row['readyForPublication'])
            self.assertIsNone(row['writePayload'])
            self.assertIsNone(row['schedule']['neutralSite'])
            self.assertTrue(row['publicationBlockers'])

    def test_seven_existing_records_never_become_insertions(self):
        result = m.build(*self.inputs)
        actual = {row['existingGameId'] for row in result['records'] if row['existingGameId']}
        expected = {row['existingGameId'] for row in self.inputs[0] if row['existingGameId']}
        self.assertEqual(actual, expected)
        self.assertEqual(len(actual), 7)
        self.assertEqual(result['summary']['proposedNewRecords'], 185)
        for row in result['records']:
            if row['existingGameId']:
                self.assertEqual(row['operation'], 'reconcile-existing-only')
                self.assertEqual(row['manifestId'], row['existingGameId'])

    def test_original_schedules_and_evidence_preserved(self):
        before = m.digest(self.inputs)
        result = m.build(*self.inputs)
        self.assertEqual(before, m.digest(self.inputs))
        self.assertEqual(result['summary']['supplementalScheduleDifferences'], 0)
        self.assertEqual({m.key(row['bracket']) for row in result['records']}, {m.key(row['bracket']) for row in self.inputs[0]})

    def test_duplicate_or_cross_qualified_identity_rejected(self):
        args = copy.deepcopy(self.inputs)
        args[0].append(args[0][0])
        with self.assertRaisesRegex(ValueError, 'duplicate candidate'):
            m.build(*args)
        args = copy.deepcopy(self.inputs)
        args[1]['games'][0]['identities'][0]['region'] = 'Region IV'
        with self.assertRaisesRegex(ValueError, 'qualified identity mismatch'):
            m.build(*args)

    def test_wrong_district_and_wrong_side_rejected(self):
        args = copy.deepcopy(self.inputs)
        args[2]['schoolProposals'][0]['proposedFields']['districtId'] = '2a-d1-district-32'
        with self.assertRaisesRegex(ValueError, 'district differs'):
            m.build(*args)
        args = copy.deepcopy(self.inputs)
        args[4]['rows'][0]['designatedSides']['homeTeam'] = 'Unrelated School'
        with self.assertRaisesRegex(ValueError, 'another matchup'):
            m.build(*args)

    def test_complementary_roles_and_sterling_stay_held(self):
        result = m.build(*self.inputs)
        complementary = [row for row in result['records'] if row['schedule']['designatedSides'] and
                         (row['schedule']['designatedSides'].get('homeExplicit') is False or
                          row['schedule']['designatedSides'].get('awayExplicit') is False)]
        self.assertEqual(len(complementary), 5)
        for row in complementary:
            self.assertTrue(any('complementary' in issue for issue in row['publicationBlockers']))
        sterling = [row for row in result['records'] if any(s['schoolSlug'] == 'houston-sterling' for s in row['qualifiedSchools'])]
        self.assertEqual(len(sterling), 1)
        self.assertIn('incomplete school metadata held', sterling[0]['publicationBlockers'])

    def test_expansion_reproduces_and_preserves_all_selected_values(self):
        generated = subprocess.check_output([sys.executable, str(HERE / 'review-playoff-schedule-expansion.py')])
        self.assertEqual(generated, (m.PACKET / 'schedule-expansion-20261111.json').read_bytes())
        base = {m.key(row['bracket']): row for row in self.inputs[0]}
        for row in self.inputs[4]['rows']:
            self.assertNotEqual(base[m.key(row['bracket'])]['provenance']['verificationStatus'], 'source-verified')
            self.assertEqual(row['selectedSchedule'], {name: base[m.key(row['bracket'])]['proposed'][name] for name in ('kickoff', 'venue', 'city')})
            self.assertFalse(row['readyForPublication'])

    def test_reproducible_output_and_no_execute_switch(self):
        with tempfile.TemporaryDirectory() as tmp:
            args = [sys.executable, str(HERE / 'prepare-playoff-publication-manifests.py'), '--output-dir', tmp]
            subprocess.run(args, check=True, capture_output=True)
            first = {p.name: p.read_bytes() for p in Path(tmp).glob('*.json')}
            subprocess.run(args, check=True, capture_output=True)
            self.assertEqual(first, {p.name: p.read_bytes() for p in Path(tmp).glob('*.json')})
            combined = json.loads(first['all-candidates.json'])
            subsets = [json.loads(value) for name, value in first.items() if name != 'all-candidates.json']
            self.assertEqual(sum(part['count'] for part in subsets), len(combined['records']))
        rejected = subprocess.run([sys.executable, str(HERE / 'prepare-playoff-publication-manifests.py'), '--execute'], capture_output=True)
        self.assertNotEqual(rejected.returncode, 0)


if __name__ == '__main__':
    unittest.main()

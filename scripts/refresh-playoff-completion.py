"""Offline post-release review refresh. Never writes to production or emits write payloads."""
import importlib.util
import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PACKET = ROOT / 'docs/playoffs/completion-20261111'
HISTORY = ROOT / 'docs/playoffs/research-20261110'
spec = importlib.util.spec_from_file_location('historical', ROOT / 'scripts/prepare-playoff-publication-manifests.py')
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)


def refresh():
    read = lambda path: json.loads(path.read_text())
    master = read(HISTORY / 'publication-staging-20261111/all-candidates.json')
    inventory = read(PACKET / 'released-inventory.json')
    catalog = {s['slug']: s for s in inventory['schools']}
    games = {g['id']: g for g in inventory['games']}
    master['releaseContext'] = {'main': inventory['main'], 'deployment': inventory['deployment'],
                              'historicalBaselinePreserved': True, 'productionInventory': 'released-inventory.json',
                              'schedulePublicationApproved': False}
    master['inputFingerprints']['historicalMaster'] = m.digest(read(HISTORY / 'publication-staging-20261111/all-candidates.json'))
    evidence = read(PACKET / 'new-evidence.json')
    additions = {m.key(r['bracket']): r for r in evidence['records']}
    for row in master['records']:
        new = additions.get(m.key(row['bracket']))
        if new:
            row['sourceEvidence']['completionSprint'] = new
            row['publicationBlockers'].extend(new.get('remainingGaps', []))
            if new.get('designatedSides'):
                row['schedule']['designatedSides'] = new['designatedSides']
        for school in row['qualifiedSchools']:
            released = catalog.get(school['schoolSlug'])
            if released:
                if released['id'] != school['schoolId'] or released['districtId'] != school['catalogDistrictId']:
                    raise ValueError('released identity mismatch')
                school['catalogState'] = 'released-record'
        if all(s['catalogState'] == 'released-record' for s in row['qualifiedSchools']):
            row['publicationBlockers'] = [b for b in row['publicationBlockers'] if b != 'catalog integration release required']
        if row['existingGameId'] and row['existingGameId'] not in games:
            raise ValueError('existing game disappeared')
        if row['existingGameId']:
            row['currentProductionRecord'] = games[row['existingGameId']]
        if (row['bracket']['division'], row['bracket']['region'], row['bracket']['slot']) == ('2A Division II', 'Region II', 8):
            assert new and new['coreScheduleEvidenceComplete']
            row['coreScheduleEvidenceComplete'] = True
            row['tier'] = 'core-supported-sides-held'
            row['publicationBlockers'] = [b for b in row['publicationBlockers'] if b != 'complete source-backed date/time/timezone/venue evidence required']
        assert row['executionEnabled'] is False and row['writePayload'] is None and row['insertAllowed'] is False
    counts = Counter(r['tier'] for r in master['records'])
    master['summary']['coreScheduleEvidenceComplete'] = sum(r['coreScheduleEvidenceComplete'] for r in master['records'])
    master['summary']['supportedSideMappings'] = sum(bool(r['schedule']['designatedSides']) for r in master['records'])
    master['summary']['tiers'] = dict(sorted(counts.items()))
    output = PACKET / 'publication-disabled'
    output.mkdir(exist_ok=True)
    files = {'all-candidates.json': master}
    for tier in counts:
        rows = [r for r in master['records'] if r['tier'] == tier and not r['existingGameId']]
        files[tier + '.json'] = {'executionEnabled': False, 'approval': None, 'count': len(rows), 'records': rows}
    rows = [r for r in master['records'] if r['existingGameId']]
    files['existing-record-reconciliation.json'] = {'executionEnabled': False, 'approval': None, 'count': len(rows), 'records': rows}
    inventory_rows = []
    for (division, region) in sorted({(r['bracket']['division'], r['bracket']['region']) for r in master['records']}):
        rows = [r for r in master['records'] if (r['bracket']['division'], r['bracket']['region']) == (division, region)]
        inventory_rows.append({'division': division, 'region': region,
                              'A_published_fully_verified': 0,
                              'B_published_reconciliation': sum(bool(r['existingGameId']) for r in rows),
                              'C_core_supported_unpublished': sum(r['coreScheduleEvidenceComplete'] and not r['existingGameId'] for r in rows),
                              'D_partial_evidence': sum(not r['coreScheduleEvidenceComplete'] and not r['existingGameId'] for r in rows),
                              'E_no_evidence': 0})
    files['coverage-inventory.json'] = {'note': 'D includes insufficient field evidence; no claim that a failed search proves absence.', 'rows': inventory_rows}
    for name, value in files.items():
        (output / name).write_text(json.dumps(value, indent=2) + '\n')
    print(json.dumps(master['summary']))


if __name__ == '__main__':
    refresh()

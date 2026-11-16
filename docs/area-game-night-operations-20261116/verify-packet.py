"""Validate the dated documentation snapshot; no network or production writes."""
import csv
from collections import Counter
from pathlib import Path
from urllib.parse import urlparse, parse_qs
root = Path(__file__).parent

def rows(name):
    with (root / name).open(newline='') as stream:
        return list(csv.DictReader(stream))

coverage = rows('coverage-matrix.csv')
solo = rows('solo-queue.csv')
batches = rows('final-only-batches.csv')
regional = rows('regional-advancement.csv')
ids = {r['game_id'] for r in coverage}
assert len(coverage) == len(ids) == len(solo) == 96
assert {r['game_id'] for r in solo} == ids
assert Counter(r['tier'].split()[0] for r in solo) == {'P0': 1, 'P1': 3, 'P2': 28, 'P3': 64}
assert len(batches) == len({r['game_id'] for r in batches}) == 64
assert {r['game_id'] for r in batches} == {r['game_id'] for r in solo if r['tier'].startswith('P3')}
assert all(not r['division'].startswith('2A') for r in batches)
assert len(Counter(r['batch'] for r in batches)) == 17
assert max(Counter(r['batch'] for r in batches).values()) <= 4
assert len(regional) == len({r['operational_slot_id'] for r in regional}) == 48
assert Counter(r[k] for r in regional for k in ['area_game_a', 'area_game_b']) == Counter(ids)
assert Counter(r['regional_destination'] for r in solo) == {r['operational_slot_id']: 2 for r in regional}
for r in solo:
    params = parse_qs(urlparse(r['editor']).query)
    assert params['game'] == [r['game_id']] and params['week'] == ['13']
    assert r['companion_area_game'] in ids and r['companion_area_game'] != r['game_id']
assert all('Owner' in r['proposed_primary'] and 'Owner' in r['proposed_backup'] for r in coverage)
assert sum(r['actual_school_assignment'] != 'None' for r in coverage) == 3
assert sum(r['kickoff_iso'] == 'TBD' for r in coverage) == 1
assert all(r['confirmed_winner_a'] == r['confirmed_winner_b'] == 'TBD' for r in regional)
assert all(v == 16 for v in Counter(r['division'] for r in coverage).values())
assert all(v == 8 for v in Counter(r['division'] for r in regional).values())
print('PASS: 96 solo tasks; P0=1/P1=3/P2=28/P3=64; all 64 non-2A games in 17 batches of at most four; 48 two-input Regional slots; exact editor links; owner-only responsibility; no hypothetical winners.')

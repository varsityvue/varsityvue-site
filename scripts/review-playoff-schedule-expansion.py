"""Normalize supplemental field evidence without editing original schedule candidates."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / 'docs/playoffs/research-20261110'


def normalize():
    class2a = json.loads((ROOT / 'schedule-expansion-2a-20261111.json').read_text())
    class3a = json.loads((ROOT / 'schedule-expansion-3a-20261111.json').read_text())
    rows = []
    for row in class2a['rows']:
        side = row.get('designatedSides')
        normalized = {**row, 'coreScheduleEvidenceComplete': row['sourceComplete']}
        normalized['selectedSchedule'] = {name: row['selectedSchedule'][name] for name in ('kickoff', 'venue', 'city')}
        normalized['designatedSides'] = ({'homeTeam': side['home'], 'awayTeam': side['visitor'],
                                         **{name: value for name, value in side.items() if name not in ('home', 'visitor')}} if side else None)
        rows.append(normalized)
    for row in class3a['candidates']:
        side = row.get('sideAssignment')
        rows.append({**row, 'selectedSchedule': {name: row['selectedSchedule'][name] for name in ('kickoff', 'venue', 'city')},
                     'designatedSides': side if side and side.get('homeTeam') else None,
                     'remainingGaps': row.get('publicationBlockers', [])})
    return {
        'reviewedDate': '2026-11-11', 'baseResearchHead': '5da0176f88ff06dfba9001b28b61d5dbb3191f17',
        'mode': 'offline-field-evidence-expansion', 'productionWrites': False, 'runtimeChanges': False,
        'rows': rows,
        'summary': {
            'newRows': len(rows), 'newCoreSourceComplete': sum(row['coreScheduleEvidenceComplete'] for row in rows),
            'newSideMappings': sum(bool(row['designatedSides']) for row in rows),
            'newBothSidesExplicit': sum(bool(row['designatedSides']) and row['designatedSides'].get('homeExplicit', True)
                                        and row['designatedSides'].get('awayExplicit', True) for row in rows),
            'readyForPublication': 0,
        },
    }


if __name__ == '__main__':
    print(json.dumps(normalize(), indent=2))

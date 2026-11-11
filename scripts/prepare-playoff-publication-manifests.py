"""Prepare review-only playoff manifests. No network, database, or execution mode."""
import argparse
import hashlib
import json
from collections import Counter
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PACKET = ROOT / 'docs/playoffs/research-20261110'
OUTPUT = PACKET / 'publication-staging-20261111'


def key(bracket):
    return (bracket['division'], bracket['region'], bracket['slot'])


def qualified(identity):
    return (identity['division'], identity['region'], identity['officialName'])


def digest(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(',', ':')).encode()).hexdigest()


def build(candidates, identities, proposals, side_review, expansion, context):
    by_identity = {}
    by_slug = {}
    for proposal in proposals['schoolProposals']:
        q = qualified(proposal['identity'])
        if q in by_identity:
            raise ValueError('duplicate qualified school proposal')
        by_identity[q] = proposal
        slug = proposal['proposedFields']['slug']
        if slug in by_slug:
            raise ValueError('duplicate proposed slug')
        by_slug[slug] = q
    identity_games = {key(row['bracket']): row for row in identities['games']}
    if len(identity_games) != len(identities['games']):
        raise ValueError('duplicate identity bracket slot')
    sides = {key(row['bracket']): row for row in side_review['rows']}
    additions = {key(row['bracket']): row for row in expansion['rows']}
    if len(additions) != len(expansion['rows']):
        raise ValueError('duplicate expansion bracket slot')
    if set(additions) - {key(row['bracket']) for row in candidates}:
        raise ValueError('expansion uses an unknown bracket slot')
    seen = set()
    records = []
    for row in candidates:
        bracket = row['bracket']
        slot = key(bracket)
        if slot in seen:
            raise ValueError('duplicate candidate slot')
        seen.add(slot)
        identity_game = identity_games[slot]
        if identity_game['bracket'] != bracket:
            raise ValueError('identity bracket/team mismatch')
        members = []
        for name, identity in zip(bracket['teams'], identity_game['identities']):
            if (identity['bracketName'] != name or identity['division'] != bracket['division']
                    or identity['region'] != bracket['region']):
                raise ValueError('qualified identity mismatch')
            existing = identity['existingCatalog']
            proposal = by_identity.get(qualified(identity))
            if existing:
                slug = existing['slug']
                school_id = context['existingSchoolIdsBySlug'].get(slug)
                if not school_id:
                    raise ValueError('existing school identifier missing')
                catalog_state = 'existing-record'
                district_id = existing['districtId']
            elif proposal:
                fields = proposal['proposedFields']
                slug = fields['slug']
                school_id = fields['id']
                district_id = fields['districtId']
                expected_district = f"{bracket['division'].split()[0].lower()}-{'d2' if bracket['division'].endswith(' II') else 'd1'}-district-{identity['district']}"
                if district_id != expected_district:
                    raise ValueError('proposed district differs from qualified UIL identity')
                if fields['classification'] != {'conference': bracket['division'].split()[0], 'division': 'D2' if bracket['division'].endswith(' II') else 'D1'}:
                    raise ValueError('proposed classification mismatch')
                catalog_state = 'proposed-complete-held-for-release' if proposal['proposedRecord'] else 'proposed-incomplete-held'
            else:
                raise ValueError('qualified identity has no catalog proposal')
            members.append({
                'bracketName': name, 'officialName': identity['officialName'],
                'qualifiedIdentity': {'division': identity['division'], 'region': identity['region'], 'uilDistrict': identity['district']},
                'schoolId': school_id, 'schoolSlug': slug, 'catalogDistrictId': district_id,
                'catalogState': catalog_state, 'identitySourceUrl': identity['sourceUrl'],
            })
        if len(members) != 2 or members[0]['schoolSlug'] == members[1]['schoolSlug']:
            raise ValueError('a matchup requires two distinct qualified identities')
        add = additions.get(slot)
        if add and add['bracket'] != bracket:
            raise ValueError('expansion bracket/team mismatch')
        original_schedule = {name: row['proposed'].get(name) for name in ('kickoff', 'venue', 'city')}
        selected_schedule = dict(original_schedule)
        if add and add.get('selectedSchedule'):
            selected_schedule.update(add['selectedSchedule'])
        # All intentional supplemental changes remain visible beside the original.
        differences = {name: {'previous': original_schedule[name], 'proposed': value}
                       for name, value in selected_schedule.items() if value != original_schedule.get(name)}
        timestamp = selected_schedule.get('kickoff') or ''
        valid_time = False
        try:
            parsed = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
            valid_time = parsed.tzinfo is not None and parsed.utcoffset() is not None
        except ValueError:
            pass
        side = (add or {}).get('designatedSides') or sides.get(slot, {}).get('designatedSides')
        if side:
            if set([side['homeTeam'], side['awayTeam']]) != set(bracket['teams']):
                raise ValueError('designated side belongs to another matchup')
            if not side.get('sourceUrl', '').startswith('https://'):
                raise ValueError('designated sides require source attribution')
        primary_core = row['provenance']['verificationStatus'] == 'source-verified'
        expanded_core = bool(add and add.get('coreScheduleEvidenceComplete'))
        core_supported = primary_core or expanded_core
        blockers = ['exact publication approval not granted']
        if any(member['catalogState'] != 'existing-record' for member in members):
            blockers.append('catalog integration release required')
        if any(member['catalogState'] == 'proposed-incomplete-held' for member in members):
            blockers.append('incomplete school metadata held')
        if not core_supported:
            blockers.append('complete source-backed date/time/timezone/venue evidence required')
        if not valid_time:
            blockers.append('valid timezone-aware kickoff required')
        if not side:
            blockers.append('explicit designated home/visitor assignment required')
        elif side.get('homeExplicit') is False or side.get('awayExplicit') is False:
            blockers.append('one designated role is complementary inference; explicit confirmation still held')
        blockers.extend((add or {}).get('remainingGaps', []))
        # Original publisher labels and location inferences never satisfy this field.
        neutral = None
        neutrality_evidence = (add or {}).get('formalNeutralSiteEvidence')
        if neutrality_evidence and neutrality_evidence.get('explicitPrimaryConfirmation') is True:
            neutral = neutrality_evidence['value']
        else:
            blockers.append('formal neutral-site status unconfirmed; existing safeguard retained')
        existing_game_id = row.get('existingGameId')
        if existing_game_id:
            blockers.append('existing game requires reconciliation; insertion forbidden')
        both_sides_explicit = bool(side and side.get('homeExplicit', True) and side.get('awayExplicit', True))
        tier = ('core-and-both-sides-explicit-held' if both_sides_explicit else 'core-and-one-side-explicit-held') if core_supported and side else 'core-supported-sides-held' if core_supported else 'partial-evidence-held'
        record_id = existing_game_id or f"2026-bi-district-{bracket['division'].split()[0].lower()}-{'d2' if bracket['division'].endswith(' II') else 'd1'}-{bracket['region'].replace('Region ', '').lower()}-{bracket['slot']}"
        records.append({
            'manifestId': record_id,
            'bracket': bracket, 'qualifiedSchools': members,
            'operation': 'reconcile-existing-only' if existing_game_id else 'proposed-new-record',
            'existingGameId': existing_game_id,
            'insertAllowed': False, 'executionEnabled': False, 'readyForPublication': False,
            'tier': tier, 'coreScheduleEvidenceComplete': core_supported,
            'schedule': {**selected_schedule, 'neutralSite': neutral, 'designatedSides': side},
            'reportedNeutralSiteClaim': {'value': row['proposed'].get('neutralSite'), 'scope': 'Preserved legacy reported claim, not adopted primary formal confirmation'},
            'originalSelectedSchedule': original_schedule, 'supplementalScheduleDifferences': differences,
            'sourceEvidence': {'original': row['provenance'], 'existingSideReview': sides.get(slot), 'newEvidence': add},
            'publicationBlockers': blockers,
            'writePayload': None,
        })
    records.sort(key=lambda row: (row['schedule'].get('kickoff') or '9999', key(row['bracket'])))
    counts = Counter(row['tier'] for row in records)
    return {
        'preparedDate': '2026-11-11', 'mode': 'offline-review-only',
        'executionEnabled': False, 'productionWrites': False, 'approval': None,
        'releaseContext': context,
        'inputFingerprints': {'candidates': digest(candidates), 'identities': digest(identities), 'catalogProposals': digest(proposals)},
        'summary': {
            'total': len(records), 'proposedNewRecords': sum(not row['existingGameId'] for row in records),
            'existingReconciliations': sum(bool(row['existingGameId']) for row in records),
            'coreScheduleEvidenceComplete': sum(row['coreScheduleEvidenceComplete'] for row in records),
            'supportedSideMappings': sum(bool(row['schedule']['designatedSides']) for row in records),
            'bothDesignatedSidesExplicit': sum(bool(row['schedule']['designatedSides']) and row['schedule']['designatedSides'].get('homeExplicit', True) and row['schedule']['designatedSides'].get('awayExplicit', True) for row in records),
            'formalNeutralityConfirmed': sum(row['schedule']['neutralSite'] is not None for row in records),
            'supplementalScheduleDifferences': sum(bool(row['supplementalScheduleDifferences']) for row in records),
            'readyForPublication': 0, 'tiers': dict(sorted(counts.items())),
        },
        'policyDecision': {
            'status': 'held-existing-rule-preserved',
            'question': 'May schedules publish with formal neutral-site status unknown, represented as unknown and without a Neutral site label?',
            'consequence': 'Current safeguards block these rows. This sprint does not relax them; location and designated sides are not substituted for formal neutrality.',
        },
        'records': records,
    }


def generate(packet=PACKET, output=OUTPUT):
    read = lambda name: json.loads((packet / name).read_text())
    master = build(read('reviewed-candidates.json')['candidates'], read('school-identity-review.json'),
                   read('school-catalog-proposals.json'), read('designated-sides-and-venues-review.json'),
                   read('schedule-expansion-20261111.json'), read('release-candidate-context-20261111.json'))
    output.mkdir(parents=True, exist_ok=True)
    files = {'all-candidates.json': master}
    for tier in ('core-and-both-sides-explicit-held', 'core-and-one-side-explicit-held', 'core-supported-sides-held', 'partial-evidence-held'):
        rows = [row for row in master['records'] if row['tier'] == tier and not row['existingGameId']]
        files[tier + '.json'] = {'executionEnabled': False, 'approval': None, 'count': len(rows), 'records': rows}
    reconciliations = [row for row in master['records'] if row['existingGameId']]
    files['existing-record-reconciliation.json'] = {'executionEnabled': False, 'approval': None, 'count': len(reconciliations), 'records': reconciliations}
    for name, value in files.items():
        (output / name).write_text(json.dumps(value, indent=2, ensure_ascii=True) + '\n')
    print(json.dumps(master['summary'], sort_keys=True))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output-dir', type=Path, default=OUTPUT)
    args = parser.parse_args()
    generate(output=args.output_dir)

"""Prepare exact branch-only schedule additions for owner approval; no network/database writes."""
import json
import hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'docs/playoffs/completion-20261111/publication-disabled/all-candidates.json'
OUT=ROOT/'docs/playoffs/live-20261112'

def build():
 master=json.loads(SOURCE.read_text()); rows=[]; held=[]
 for r in master['records']:
  b=r['bracket']; e=r['sourceEvidence']; s=dict(r['schedule'])
  priority=b['division'].startswith('2A') and b['region']=='Region II'
  if r['existingGameId']:continue
  if b['teams']==['Randall','Austin']:
   held.append({'manifestId':r['manifestId'],'reason':'Conflicting November 12/13 date; primary resolution still required.'});continue
  if not r['coreScheduleEvidenceComplete'] and not priority:continue
  # Region II local times corroborated by current DCTF CST list and historical independent reports.
  # An exact stadium name is nonessential where only the city is secure.
  if b['teams'] in [['Mason','Itasca'],['San Saba','Valley Mills']]:s['venue']=None
  if b['teams']==['Carlisle','Honey Grove']:s['venue']=None
  schools={q['bracketName']:q for q in r['qualifiedSchools']}
  if any(q['catalogState']!='released-record' for q in schools.values()):raise ValueError('unreleased identity')
  sides=s.get('designatedSides')
  explicit=bool(sides and sides.get('homeExplicit',True) and sides.get('awayExplicit',True))
  home=sides['homeTeam'] if explicit else b['teams'][0]
  away=sides['awayTeam'] if explicit else b['teams'][1]
  game={'id':r['manifestId'],'season':2026,'week':12,'gameType':'playoff',
        'playoff':{'round':'Bi-District','division':b['division'],'region':b['region'].replace('Region ','')},
        'homeSchoolSlug':schools[home]['schoolSlug'],'awaySchoolSlug':schools[away]['schoolSlug'],
        'homeTeam':home,'awayTeam':away,'kickoff':s['kickoff'],
        'isNeutralSite':None,'designatedSidesConfirmed':explicit,
        'status':'upcoming','districtGame':False,'coverageStatus':'none','sourceStatus':'verified',
        'sourceLabel':'2026 playoff schedule: source-backed kickoff; home/away and neutrality shown only when confirmed'}
  if s.get('venue'):game['venue']=s['venue']
  else:game['venue']=s['city']+', TX · Stadium details pending'
  rows.append({'bracket':b,'game':game,'existingGameId':None,'operation':'insert-new-only',
     'reviewCategory':'fully-supported' if explicit and s.get('venue') else 'nonessential-fields-unknown',
     'timezone':'America/Chicago','utcOffset':s['kickoff'][-6:],
     'sourceEvidenceReference':str(SOURCE.relative_to(ROOT))+'#'+r['manifestId'],
     'additionalSource':{'url':'https://www.davecampbells.com/articles/2026/11/07/txhsfb-playoffs-game-times-and-locations','retrievedDate':'2026-11-12','publishedDate':'2026-11-08','supports':'Region II kickoff and city; all listed times CST'} if priority else None,
     'unknownFields':[f for f,v in [('formalNeutrality',None),('designatedRoles',True if explicit else None),('exactStadium',s.get('venue'))] if v is None],
     'conflictDisposition':'Original contrary reports preserved in source evidence. Primary resolutions retained; venue alias conflicts suppress exact stadium. Axtell weekday/date typo resolved by three agreeing current reports; no conflicting value silently overwritten.'})
 rows.sort(key=lambda r:(r['game']['kickoff'],r['game']['id']))
 OUT.mkdir(exist_ok=True)
 packet={'approval':None,'executionEnabled':False,'productionWrites':False,'requiresExactOwnerPublicationApproval':True,
         'neutralityPolicy':'true confirmed neutral; false confirmed non-neutral; null unknown; no neutrality publication hold',
         'internalResearchPresumption':'Playoffs presumptively neutral; not adopted as public fact',
         'records':rows,'materialConflictHeld':held}
 (OUT/'publication-review.json').write_text(json.dumps(packet,indent=2)+'\n')
 text='// Branch-only proposed publication. Requires owner approval of this exact file before merge.\nimport type { Game } from "@/types/platform";\nexport const playoffScheduleAdditions: Game[] = '+json.dumps([r['game'] for r in rows],indent=2)+';\n'
 (ROOT/'data/playoff-schedule-additions-20261112.ts').write_text(text)
 packet['runtimeFileSha256']=hashlib.sha256(text.encode()).hexdigest()
 (OUT/'publication-review.json').write_text(json.dumps(packet,indent=2)+'\n')
 print(json.dumps({'newGames':len(rows),'fullySupported':sum(r['reviewCategory']=='fully-supported' for r in rows),'nonessentialUnknown':sum(r['reviewCategory']!='fully-supported' for r in rows),'materialConflictHeld':held}))
if __name__=='__main__':build()

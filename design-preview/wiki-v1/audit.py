"""Read-only seed inventory. Writes review artifacts only; never modifies game data."""
import csv,json,re
from pathlib import Path
from collections import Counter
ROOT=Path(__file__).resolve().parents[2]
OUT=Path(__file__).resolve().parent
load=lambda p:json.loads((ROOT/p).read_text(encoding='utf-8-sig'))
industries=load('backend/prisma/seed/industries.seed.json')['industries']
general=load('backend/prisma/seed/events.seed.json')['events']
family=load('backend/prisma/seed/family.seed.json')['events']
art=load('frontend/src/lib/static-event-art-index.json')['art']
variants=[('base',0,0),('input-shortage',15,2),('local-supplier',-12,2),('port-delay',8,1),('green-support',-10,2),('credit-tightening',6,1),('tech-transfer',-8,1),('new-standard',10,2)]
rows=[]
for industry in industries:
 for e in industry['events']:
  for variant,investment,years in variants:
   effect=e.get('effect')
   if variant!='base':effect={**(effect or {'years':years}),'years':max((effect or {}).get('years',0),years),'investmentPct':investment}
   mixed=bool(effect and any(effect.get(k,0)<0 for k in ['revenuePct','assetsPct','cashPerYear']) or effect and effect.get('costPct',0)>0)
   flags=[]
   if variant!='base' and not e.get('effect'):flags.append('BASE_EFFECT_REPLACED')
   if investment<0 and mixed:flags.append('GOOD_LABEL_MIXED_IMPACT')
   if effect and effect.get('assetsPct',0):flags.append('ASSET_PERCENT_INTEGER_ROUNDING')
   if effect and effect.get('cashPerYear',0):flags.append('FIXED_CASH_WITHOUT_OPERATING_GATE')
   rows.append({'id':e['id']+('' if variant=='base' else '--'+variant),'industry':industry['slug'],'title':e.get('title',''),'variant':variant,'visual':e.get('visual'),'art':art.get(e['id'],''),'effect':effect or {'fallbackVisual':e.get('visual'),'severity':e.get('severity')},'flags':flags})
for group,events in [('general',general),('family',family)]:
 for e in events:
  flags=[]
  if group=='general' and not e.get('effect') and e.get('visual')=='none':flags.append('NO_ECONOMIC_EFFECT')
  if group=='general' and not e.get('effect') and e.get('visual')=='expansion':flags.append('FRACTIONAL_CLUSTER_REWARD')
  rows.append({'id':e['id'],'industry':group,'title':e.get('title'),'variant':'base','visual':e.get('visual'),'art':art.get(e['id'],''),'effect':e.get('effect') or {'fallbackVisual':e.get('visual'),'severity':e.get('severity'),'trait':e.get('trait')},'flags':flags})
(OUT/'event-inventory.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2),encoding='utf-8')
with (OUT/'event-inventory.csv').open('w',encoding='utf-8-sig',newline='') as f:
 w=csv.DictWriter(f,fieldnames=list(rows[0]));w.writeheader()
 for row in rows:w.writerow({**row,'effect':json.dumps(row['effect'],ensure_ascii=False),'flags':' | '.join(row['flags'])})
summary={'industries':len(industries),'industryRoots':sum(len(i['events']) for i in industries),'industryExpanded':sum(len(i['events'])*8 for i in industries),'generalRoots':len(general),'generalNarrations':sum(len(e.get('variants',[])) for e in general),'family':len(family),'inventoryRows':len(rows),'flags':dict(Counter(f for r in rows for f in r['flags'])),'effectKeys':dict(Counter(k for i in industries for e in i['events'] for k in e.get('effect',{}))),'unmappedArt':[r['id'] for r in rows if not r['art']]}
(OUT/'inventory-summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(summary,ensure_ascii=False,indent=2))

import fs from 'node:fs'
import assert from 'node:assert/strict'
import {INDUSTRY_ECONOMY} from '../backend/src/game/industry-economy'
const root=new URL('../',import.meta.url)
const read=(path:string)=>JSON.parse(fs.readFileSync(new URL(path,root),'utf8'))
const catalog=read('frontend/src/lib/wiki-catalog.json')
const industries=read('backend/prisma/seed/industries.seed.json').industries
assert.equal(catalog.industries.length,64)
assert.equal(catalog.events.length,1388)
assert.equal(new Set(catalog.events.map((e:{id:string})=>e.id)).size,1388)
assert.equal(catalog.industryExpanded+catalog.generalCount+catalog.familyCount,10348)
for(const i of catalog.industries){
 assert(industries.some((row:{slug:string})=>row.slug===i.id))
 assert.equal(i.crew,INDUSTRY_ECONOMY[i.id].crew)
 assert.deepEqual(i.prices,INDUSTRY_ECONOMY[i.id].prices)
 assert(fs.existsSync(new URL(`frontend/public/assets/industries/${i.id}/factory-1.webp`,root)),i.id+' factory art')
 for(const line of ['eng','mac','sup','inf'])assert(fs.existsSync(new URL(`frontend/public/assets/investments/handdrawn-v1/${i.id}/${line}.webp`,root)),i.id+' '+line)
}
assert(fs.existsSync(new URL('frontend/public/assets/investments/handdrawn-v1/common/grn.webp',root)))
for(const e of catalog.events)assert(fs.existsSync(new URL(`frontend/public/assets/ui/static-events-v3/${e.art}.webp`,root)),e.id+' art')
console.log('Wiki snapshot: all 64 economy profiles, 1,388 roots, 10,348 expanded entries and every linked industry/event artwork checked.')

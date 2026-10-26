/** Public documentation only. Imports authored game data; no credentials or database connection. */
import fs from 'node:fs'
import {INDUSTRY_ECONOMY} from '../backend/src/game/industry-economy'
import {effectPayload} from '../backend/prisma/seed/effects'
const load=(path:string)=>JSON.parse(fs.readFileSync(new URL('../'+path,import.meta.url),'utf8'))
const source=load('backend/prisma/seed/industries.seed.json')
const general=load('backend/prisma/seed/events.seed.json').events
const family=load('backend/prisma/seed/family.seed.json').events
const art=load('frontend/src/lib/static-event-art-index.json').art
const row=(e:any,industry:string)=>({id:e.id,title:e.title,body:e.description??e.body??e.title,industry,visual:e.visual,good:e.tone?e.tone==='good':e.good,trait:e.trait??'',groups:e.groups??[],contexts:e.contexts??[],narrations:e.variants??[],art:art[e.id],effect:e.effect??effectPayload(e.visual,e.severity)})
const industries=source.industries.map((i:any)=>({id:i.slug,name:i.name,group:i.group,groupName:i.groupName,labels:i.investLabels,...INDUSTRY_ECONOMY[i.slug]}))
const events=[...source.industries.flatMap((i:any)=>i.events.map((e:any)=>row(e,i.slug))),...general.map((e:any)=>row(e,'general')),...family.map((e:any)=>row(e,'family'))]
const catalog={version:3,asOf:'2026-10-26',industries,events,industryExpanded:10240,generalCount:100,familyCount:8}
fs.writeFileSync(new URL('../frontend/src/lib/wiki-catalog.json',import.meta.url),JSON.stringify(catalog))
console.log(`Wiki: ${industries.length} industries, ${events.length} roots, 10,348 expanded seed entries`)

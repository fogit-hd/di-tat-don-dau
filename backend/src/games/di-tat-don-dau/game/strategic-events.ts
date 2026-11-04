import type {TeamState} from './types'
import type {Rng} from './rng'

export const PATENT_LEVY_ID='company-patent-expiry'
export const PATENT_LEVY_POLICY={minPercent:1,maxPercent:3,payerFraction:.1,payerCap:1000,collectorFraction:.2,collectorCap:1000} as const
export const STRATEGIC_IDS=new Set(['company-exclusive-technology','company-royalty','company-commission','company-monopoly-scale','company-final-benchmark','company-final-levy',PATENT_LEVY_ID])
export const TRANSFER_IDS=new Set(['company-royalty','company-commission'])
export type FinalClaim={eventId:string;title:string;percent:number;basis:'richest'|'own';direction:1|-1}
export type SettlementItem={eventId:string;title:string;percent:number;basis:number;delta:number;cap:number;receiptId?:string;counterpartyId?:string;counterpartyName?:string;requested?:number;limitReason?:string}
export type FinalSettlement={before:number;after:number;richestBefore:number;items:SettlementItem[]}
export type PatentLevy={percent:number;year:number}
export type StrategicParty={id:string;name:string;state:TeamState;value:number}
export type QueuedInteraction={id:string;eventId:string;title:string;body:string;originId:string;targetId:string;originYear:number;targetYear:number;percent:number;cap:number;createdAt:number;status:'pending'|'settled'|'cancelled';settledAt?:number;amount?:number;reason?:string}

export function transferTerms(rng:Rng,royalty=false){return {percent:rng.int(royalty?3:2,royalty?6:5),cap:royalty?100:75}}

/** Limit backlog on a slow CEO and prevent one fast CEO queuing the same fee repeatedly. */
export function canQueueInteraction(queue:QueuedInteraction[],originId:string,targetId:string,eventId:string){
 const pending=queue.filter(row=>row.status==='pending')
 return pending.filter(row=>row.targetId===targetId).length<3&&!pending.some(row=>row.originId===originId&&row.targetId===targetId&&row.eventId===eventId)
}

export function settleTransfer(payer:TeamState,payee:TeamState,terms:{percent:number;cap:number},available=payer.cash){
 const {percent,cap}=terms,before=payer.cash,receivedBefore=payee.cash
 const amount=Math.max(0,Math.min(cap,Math.floor(Math.max(0,Math.min(payer.cash,available))*percent)/100))
 payer.cash-=amount;payee.cash+=amount
 return {percent,cap,amount,before,after:payer.cash,receivedBefore,receivedAfter:payee.cash}
}

export function strategicEligible(id:string,state:TeamState,hasCounterparty:boolean,hasPatentOwner=false){
 if(id===PATENT_LEVY_ID)return !state.patentLevy&&hasPatentOwner
 if(TRANSFER_IDS.has(id)&&!hasCounterparty)return false
 if(id==='company-royalty'&&!state.exclusiveTechnology)return false
 if(id==='company-exclusive-technology'&&state.exclusiveTechnology)return false
 if(id==='company-monopoly-scale'&&state.machines<3)return false
 if(id.startsWith('company-final-')&&state.finalClaims?.some(c=>c.eventId===id))return false
 return true
}

/** Available cash only; no borrowing, resource theft or repricing of purchased upgrades. */
export function commissionTransfer(payer:TeamState,payee:TeamState,rng:Rng,royalty=false){
 return settleTransfer(payer,payee,transferTerms(rng,royalty))
}

export function rollPatentLevy(rng:Rng,year:number):PatentLevy{
 return {percent:rng.int(PATENT_LEVY_POLICY.minPercent,PATENT_LEVY_POLICY.maxPercent),year}
}

/** Simultaneous score transfers: neither a receipt nor an earlier bonus becomes a new fee basis. */
export function patentLevyTransfers(parties:StrategicParty[]){
 const policy=PATENT_LEVY_POLICY,ordered=[...parties].sort((a,b)=>a.id.localeCompare(b.id))
 const collectors=ordered.filter(p=>p.state.patentLevy&&p.value>0),owners=ordered.filter(p=>p.state.exclusiveTechnology&&p.value>0)
 const requests=owners.flatMap(payer=>collectors.filter(c=>c.id!==payer.id).map(collector=>({payer,collector,percent:Math.max(policy.minPercent,Math.min(policy.maxPercent,Math.round(collector.state.patentLevy!.percent))),requested:0,amount:0})))
 for(const row of requests)row.requested=Math.max(0,row.payer.value)*row.percent/100
 for(const payer of owners){
  const rows=requests.filter(row=>row.payer.id===payer.id),total=rows.reduce((n,row)=>n+row.requested,0)
  const cap=Math.min(payer.value*policy.payerFraction,policy.payerCap),factor=total>0?Math.min(1,cap/total):1
  for(const row of rows)row.amount=row.requested*factor
 }
 for(const collector of collectors){
  const rows=requests.filter(row=>row.collector.id===collector.id),total=rows.reduce((n,row)=>n+row.amount,0)
  const cap=Math.min(collector.value*policy.collectorFraction,policy.collectorCap),factor=total>0?Math.min(1,cap/total):1
  for(const row of rows)row.amount=Math.floor((row.amount*factor+1e-9)*100)/100
 }
 return requests.map(row=>({id:`patent:${row.payer.id}:${row.collector.id}`,payerId:row.payer.id,payerName:row.payer.name,collectorId:row.collector.id,collectorName:row.collector.name,percent:row.percent,basis:row.payer.value,requested:row.requested,amount:row.amount,limited:row.amount+1e-8<row.requested}))
}

/** All bonuses read one immutable baseline, never another CEO's adjusted prize. */
export function finalSettlementPlans(parties:StrategicParty[]){
  parties=parties.map(p=>({...p,value:p.state.finalSettlement?.before??p.value}))
 const richest=Math.max(0,...parties.map(p=>p.value))
  const transfers=patentLevyTransfers(parties)
 return parties.map(p=>{
  if(p.state.finalSettlement)return {id:p.id,settlement:p.state.finalSettlement}
  const before=Math.max(0,p.value),items:SettlementItem[]=(p.state.finalClaims??[]).map(claim=>{
   const basis=claim.basis==='richest'?richest:before
   const cap=claim.direction>0?Math.min(500,before*.2):Math.min(500,before)
   const delta=claim.direction*Math.min(cap,basis*claim.percent/100)
   return {eventId:claim.eventId,title:claim.title,percent:claim.percent,basis,delta,cap}
  })
  for(const row of transfers){
   const incoming=row.collectorId===p.id,outgoing=row.payerId===p.id
   if(!incoming&&!outgoing)continue
   items.push({eventId:PATENT_LEVY_ID,receiptId:row.id,counterpartyId:incoming?row.payerId:row.collectorId,counterpartyName:incoming?row.payerName:row.collectorName,title:`Hết hạn bảo hộ · ${incoming?'Thu từ':'Trả cho'} CEO ${incoming?row.payerName:row.collectorName}`,percent:row.percent,basis:row.basis,requested:row.requested,delta:incoming?row.amount:-row.amount,cap:row.amount,limitReason:row.limited?'Đã phân bổ theo trần tổng thu và tổng khấu trừ.':undefined})
  }
  if(p.state.patentLevy&&!items.some(item=>item.eventId===PATENT_LEVY_ID&&item.delta>=0))items.push({eventId:PATENT_LEVY_ID,title:'Hết hạn bảo hộ · Không có tài sản đủ điều kiện để thu',percent:p.state.patentLevy.percent,basis:0,delta:0,cap:0,limitReason:before<=0?'CEO đã chốt tài sản bằng 0, không phát sinh khoản nhận.':'Không có CEO khác sở hữu Công nghệ độc quyền và còn tài sản tại thời điểm chốt.'})
  return {id:p.id,settlement:{before,richestBefore:richest,after:Math.max(0,before+items.reduce((n,i)=>n+i.delta,0)),items}}
 })
}

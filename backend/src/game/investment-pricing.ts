import { investmentPrice } from './engine'
import type { Line, TeamState } from './types'

/** Millions of VND. Independent of room capital and independent between upgrade lines. */
export const INVESTMENT_BASE_PRICES: Record<Line,number> = {eng:50,mac:200,sup:75,inf:100,grn:60}

/** Arithmetic price ladder: bulk purchase is exactly the sum of successive single purchases. */
export function investmentQuote(state: TeamState, line: Line, base: number, quantity: 1|5|10|'max'|'crew', now: number) {
  const invoice = investmentPrice(state,base,now)
  const modern=state.productionVersion===3
  const increment = Math.max(1,Math.round(invoice*(modern?.04:.02)))
  const tier = modern ? Math.max(1,Math.round(invoice*.2)) : 0
  const bought = state.investmentCounts?.[line] ?? 0
  const block=modern && line==='eng'?Math.max(1,state.crewSize??1):1
  const unit=(n:number)=>invoice+increment*Math.floor(n/block)+tier*Math.floor(n/(10*block))**2
  const floors=(n:number)=>{const k=Math.floor(n/block),rest=n%block;return block*k*(k-1)/2+rest*k}
  const squares=(n:number)=>{const width=10*block,k=Math.floor(n/width),rest=n%width;return width*(k-1)*k*(2*k-1)/6+rest*k*k}
  const prefix=(n:number)=>invoice*n+increment*floors(n)+tier*squares(n)
  const price = unit(bought)
  const cost = (n:number) => prefix(bought+n)-prefix(bought)
  let count:number = quantity==='max'?0:quantity==='crew'?Math.max(1,(state.crewSize??1)-(state.engineers%(state.crewSize??1))):quantity
  if(quantity==='max'){
    let lo=0,hi=Math.max(0,Math.floor(state.cash/price))
    while(lo<hi){const mid=lo+Math.ceil((hi-lo)/2);if(cost(mid)<=state.cash+1e-8)lo=mid;else hi=mid-1}
    count=lo
  }
  return {count,price,total:cost(count),nextPrice:unit(bought+count)}
}

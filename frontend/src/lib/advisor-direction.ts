/** Aim from the advisor's current screen position, including stacked mobile layouts. */
export function advisorDirection(dx:number,dy:number){
  const side=dx<0?'left':'right',slope=-dy/Math.max(1,Math.abs(dx))
  if(slope>4)return 'point-up'
  if(slope>1.2)return 'point-steep-'+side
  if(slope>.55)return side==='right'?'point':'point-up-left'
  return dy>Math.abs(dx)*.65?'point-down-'+side:'point-'+side
}

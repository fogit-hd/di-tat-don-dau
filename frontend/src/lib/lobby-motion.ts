/** All new lobby motion is driven by the Web Animations API; no CSS animation loops. */
export function lobbyMotion(node: Element | null, frames: Keyframe[], options: number | KeyframeAnimationOptions = 240) {
  if (!node || !node.animate) return null
  const settings = typeof options === 'number' ? { duration: options } : options
  return node.animate(frames, { easing:'cubic-bezier(.2,.8,.2,1)', ...settings,
    ...((document.hidden || window.matchMedia('(prefers-reduced-motion: reduce)').matches) ? {duration:0,delay:0,iterations:1} : {}) })
}
export const riseIn = (node: Element | null, delay=0) => lobbyMotion(node,[{opacity:0,transform:'translateY(14px)'},{opacity:1,transform:'none'}],{duration:360,delay,fill:'backwards'})
const buttonAnimations = new WeakMap<Element,Animation>()
export function buttonMotion(node: Element, state:'over'|'out'|'down'|'up') {
  const scale = state==='down'?.96:state==='over'?1.025:1
  const transform=getComputedStyle(node).transform
  buttonAnimations.get(node)?.cancel()
  const animation=lobbyMotion(node,[{transform},{transform:`scale(${scale})`}],{duration:state==='down'?85:160,fill:'forwards'})
  if(animation)buttonAnimations.set(node,animation)
  return animation
}

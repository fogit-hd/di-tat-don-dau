import type { AvatarConfig } from '../lib/avatar'
import { avatarArt } from '../lib/avatar'
import { ArtText as T, PaintedArt as Art } from '../../../shared/ui/ArtText'
import { PublicArtText } from '../../../shared/ui/PublicArtText'
import { useLayoutEffect, useRef, useState } from 'react'
import letters from '../../../shared/ui/public-letter-paths.json'

const nameGlyphs=letters.bold as Record<string,(number|string)[]>
const glyphWidth=(letter:string)=>Number((nameGlyphs[letter]??nameGlyphs['?'])[0])

/** Measure the actual vector advances: no squashed letters or broken last word. */
function SingleLineName({text}:{text:string}){
 const root=useRef<HTMLSpanElement>(null),[capacity,setCapacity]=useState(Infinity)
 useLayoutEffect(()=>{
  const node=root.current;if(!node)return
  const measure=()=>{const fontSize=parseFloat(getComputedStyle(node).fontSize);setCapacity(node.clientWidth*64/fontSize)}
  const observer=new ResizeObserver(measure);observer.observe(node);window.addEventListener('resize',measure);measure()
  return()=>{observer.disconnect();window.removeEventListener('resize',measure)}
 },[])
 const characters=[...text],suffix=nameGlyphs['…']?['…']:['.','.','.']
 const total=characters.reduce((sum,c)=>sum+glyphWidth(c),0),suffixWidth=suffix.reduce((sum,c)=>sum+glyphWidth(c),0)
 const shown:string[]=[];let used=0
 for(const c of characters){if(total>capacity&&used+glyphWidth(c)+suffixWidth>capacity)break;shown.push(c);used+=glyphWidth(c)}
 if(shown.length<characters.length)shown.push(...suffix)
 let width=0
 const paths=shown.map((c,i)=>{const glyph=nameGlyphs[c]??nameGlyphs['?'],x=width;width+=Number(glyph[0]);return <path key={i} d={String(glyph[1])} transform={`translate(${x} 0)`}/>})
 return <span ref={root} className="ceo-name-single" aria-hidden="true"><svg viewBox={`0 0 ${Math.max(1,width)} 86`} style={{width:`${width/64}em`}} fill="currentColor" aria-hidden="true">{paths}</svg></span>
}

export function CeoAvatar({avatar,portrait=false,className=''}:{avatar?:Partial<AvatarConfig>|null;portrait?:boolean;className?:string}){
 return <Art className={`ceo-avatar${portrait?' portrait':''} ${className}`} src={avatarArt(avatar,portrait)} eager/>
}

/** Individual vector glyphs allow long unbroken names to wrap without shrinking the lettering. */
export function CeoName({name,full=false,publicLettering=false,singleLine=false}:{name:string;full?:boolean;publicLettering?:boolean;singleLine?:boolean}){
 const Text=publicLettering?PublicArtText:T
 const text=name.normalize('NFC')
 return <span className={`ceo-name${full?' full':''}${singleLine?' single-line':''}`} role="img" aria-label={text} title={text} data-ceo-name={text}>
  {singleLine?<SingleLineName text={text}/>:text.split(/(\s+)/).map((word,index)=>/^\s+$/.test(word)?<span className="ceo-space" key={index} aria-hidden="true"/>:<span className="ceo-word" key={index} aria-hidden="true">{[...word].map((letter,n)=><span className="ceo-letter" key={n}><Text text={letter} bold/></span>)}</span>)}
 </span>
}

import type { AvatarConfig } from '../lib/avatar'
import { avatarArt } from '../lib/avatar'
import { ArtText as T, PaintedArt as Art } from './ArtText'

export function CeoAvatar({avatar,portrait=false,className=''}:{avatar?:Partial<AvatarConfig>|null;portrait?:boolean;className?:string}){
 return <Art className={`ceo-avatar${portrait?' portrait':''} ${className}`} src={avatarArt(avatar,portrait)} eager/>
}

/** Individual vector glyphs allow long unbroken names to wrap without shrinking the lettering. */
export function CeoName({name,full=false}:{name:string;full?:boolean}){
 const text=name.normalize('NFC')
 return <span className={`ceo-name${full?' full':''}`} role="img" aria-label={text} title={text} data-ceo-name={text}>
  {text.split(/(\s+)/).map((word,index)=>/^\s+$/.test(word)?<span className="ceo-space" key={index} aria-hidden="true"/>:<span className="ceo-word" key={index} aria-hidden="true">{[...word].map((letter,n)=><span className="ceo-letter" key={n}><T text={letter} bold/></span>)}</span>)}
 </span>
}

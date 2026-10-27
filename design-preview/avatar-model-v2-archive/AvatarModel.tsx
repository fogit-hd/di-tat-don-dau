import { useId, type RefObject } from 'react'
import { avatarOf, avatarHeadArt, type AvatarConfig } from '../lib/avatar'
import { useAvatarRig } from '../lib/use-avatar-rig'

const PALETTES={ivory:['#f2caa0','#d59b70'],peach:['#dfaa7c','#bd8056'],honey:['#c68e59','#9f633c'],tan:['#a96e42','#804b2e'],brown:['#825032','#5d3524'],deep:['#553323','#352018']} as const
const FABRICS={shirt:['#fff1d2','#c9b28c'],suit:['#53535d','#25252e'],engineer:['#5984a5','#234d70'],jacket:['#ba8954','#77472c'],workwear:['#537596','#263e5b'],founder:['#fff0ce','#c4ad85']} as const

/** One paper-doll model: fixed anatomy, palette, shared garment anchors; no full-avatar bitmap swaps. */
export function AvatarModel({avatar,portrait=false,className='',animated=false}:{avatar?:Partial<AvatarConfig>|null;portrait?:boolean;className?:string;animated?:boolean}){
 const a=avatarOf(avatar),uid=useId().replace(/:/g,''),skin=PALETTES[a.skin],cloth=FABRICS[a.outfit]
 const {root:rigRoot,head:rigHead,leftUpper,leftLower,rightUpper,rightLower}=useAvatarRig(animated,a.outfit)
 const scale=a.body==='broad-male'?1.14:a.body==='slim-female'?.92:a.body==='curvy-female'?1.07:1
 const fill=(n:string)=>`url(#${uid}-${n})`
 return <svg className={`ceo-avatar avatar-model${portrait?' portrait':''} ${className}`} viewBox={portrait?'66 13 188 230':'0 0 320 620'} aria-hidden="true" focusable="false" data-avatar-model="layered-v1" data-body={a.body} data-skin={a.skin} data-outfit={a.outfit} onDragStart={e=>e.preventDefault()} onContextMenu={e=>e.preventDefault()}>
  <defs>
   <linearGradient id={`${uid}-skin`} x1="0" x2="1" y2=".4"><stop stopColor={skin[0]}/><stop offset=".68" stopColor={skin[0]}/><stop offset="1" stopColor={skin[1]}/></linearGradient>
   <linearGradient id={`${uid}-cloth`} x1="0" x2="1" y2=".6"><stop stopColor={cloth[0]}/><stop offset=".5" stopColor={cloth[0]}/><stop offset="1" stopColor={cloth[1]}/></linearGradient>
   <linearGradient id={`${uid}-trousers`} x2=".85" y2="1"><stop stopColor={a.outfit==='engineer'||a.outfit==='workwear'?cloth[0]:'#50505a'}/><stop offset="1" stopColor={a.outfit==='engineer'||a.outfit==='workwear'?cloth[1]:'#25232c'}/></linearGradient>
   <linearGradient id={`${uid}-shirt`} x1="0" x2="1" y2=".8"><stop stopColor="#fff6df"/><stop offset="1" stopColor="#cbb48c"/></linearGradient>
   <linearGradient id={`${uid}-wine`} x2="1" y2="1"><stop stopColor="#ae3f37"/><stop offset="1" stopColor="#612529"/></linearGradient>
   <linearGradient id={`${uid}-gold`} x2=".7" y2="1"><stop stopColor="#fff0a6"/><stop offset=".4" stopColor="#c89038"/><stop offset="1" stopColor="#805327"/></linearGradient>
   <linearGradient id={`${uid}-boots`} x2=".7" y2="1"><stop stopColor="#786051"/><stop offset=".5" stopColor="#352824"/><stop offset="1" stopColor="#1c171a"/></linearGradient>
   <pattern id={`${uid}-weave`} width="7" height="8" patternUnits="userSpaceOnUse"><path d="m0 1 7 1M1 0l1 8M6 0l1 8" stroke="#2e211a" strokeWidth=".55" opacity=".14"/></pattern>
   <pattern id={`${uid}-paint`} x="107" y="214" width="107" height="123" patternUnits="userSpaceOnUse"><image href={`/assets/avatars/model-v2/materials/${a.outfit}-torso.webp`} width="107" height="123" preserveAspectRatio="none"/></pattern>
   <pattern id={`${uid}-legpaint`} x="104" y="342" width="109" height="213" patternUnits="userSpaceOnUse"><image href={`/assets/avatars/model-v2/materials/${a.outfit}-legs.webp`} width="109" height="213" preserveAspectRatio="none"/></pattern>
   <clipPath id={`${uid}-head`}><rect x="82" y={a.outfit==='engineer'?90:0} width="156" height="185"/></clipPath>
  </defs>
  <g ref={rigRoot}>
  <g data-avatar-layer="body" transform={`translate(160 0) scale(${scale} 1) translate(-160 0)`} stroke="#3d2924" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round">
   <path d="M137 148h45v45l-22 17-23-17Z" fill={fill('skin')}/>
   <path d="M111 177q50-22 99 0l7 154q-10 23-17 28h-81q-9-18-14-31Z" fill={fill('shirt')}/>
   <path d="m117 339 86-1 10 65-9 148-41 2-5-141-10 140-42 1 4-150Z" fill={fill('trousers')}/>
   <path d="m117 339 86-1 10 65-9 148-41 2-5-141-10 140-42 1 4-150Z" fill={fill('legpaint')} stroke="none" opacity=".48"/>
   <path d="m117 353 18 54-14 126m73-174-16 53 10 123" stroke="#b0a79c" strokeWidth="1.7" opacity=".35" fill="none"/>
   <path d="m108 551 39-1 2 24q-8 13-50 9l-1-13Z" fill={fill('boots')}/><path d="m165 551 40-1 5 17 22 9q5 11-16 13l-54-5Z" fill={fill('boots')}/>
   <path d="m99 579 47 1m18 1 63 3m-118-22 29 2m37 0 23 2" fill="none" stroke="#ac9580" strokeWidth="2"/>
  </g>
  <g ref={rigHead} data-bone="head"><image data-avatar-layer="head" href={avatarHeadArt(a)} x="94" y="12" width="132" height="181" preserveAspectRatio="xMidYMax meet" clipPath={fill('head')}/>
  {a.outfit==='engineer'&&<g data-avatar-layer="headwear" transform="translate(0 20)" stroke="#6c471d" strokeWidth="2.4"><path d="M108 59q1-43 51-45 49 0 53 45Z" fill={fill('gold')}/><path d="M104 58q55-13 112 0l6 15q-62 10-125 0Z" fill="#eebc51"/><path d="M153 17v36m-24-25q-11 9-12 25m70-25q12 9 15 25" fill="none" stroke="#fff1a3" strokeWidth="3"/></g>}
  </g>
  <g data-avatar-layer="outfit" data-set={a.outfit} transform={`translate(160 0) scale(${scale} 1) translate(-160 0)`} stroke="#3d2924" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round">
   <path d="m112 177 25-10 23 24 22-24 26 10 6 161q-54 14-108 0Z" fill={fill('cloth')}/>
   <path d="m112 177 25-10 23 24 22-24 26 10 6 161q-54 14-108 0Z" fill={fill('weave')} stroke="none"/>
   <path d="m112 177 25-10 23 24 22-24 26 10 6 161q-54 14-108 0Z" fill={fill('paint')} opacity=".38" stroke="none"/>
   <path d="m138 168 22 23-12 27-18-39m51-11-21 23 13 27 17-39" fill={fill('shirt')}/>
   {a.outfit==='shirt'&&<g><path d="m121 177 12-3 10 155-12 2Zm65-3 12 3-8 154-12-2Z" fill={fill('wine')}/><path d="m133 309 9-1 1 16-9 1Zm46-1 10 1-1 16-10-1Z" fill={fill('gold')}/><path d="M159 204v120" stroke="#907f68" strokeWidth="1.2"/>{[225,249,273,296].map(y=><circle key={y} cx="162" cy={y} r="2" fill="#d7bf94"/>)}</g>}
   {a.outfit==='suit'&&<g><path d="m136 175 10 65 15 27-17 66-32-5-6-144Zm47 0-11 65-11 27 15 66 33-5 5-144Z" fill="#34333e"/><path d="m136 175-14 19 21 22-9 17 25 32m24-90 13 19-20 22 9 17-24 32" fill={fill('cloth')}/><path d="m154 202 8-4 7 5-7 14-8-7 1 18-7 57 15 13 12-14-13-67" fill={fill('wine')}/><path d="M166 273v54" stroke="#1e1c25"/>{[280,307].map(y=><circle key={y} cx="171" cy={y} r="3.8" fill={fill('gold')}/>)}<path d="M118 287h26m36 0h24M177 284q-7 25-32 16" stroke="#c2924b" strokeWidth="1.5" fill="none"/><path d="m185 219 13-3 3 8-15 1" fill="#fff1cf"/></g>}
   {a.outfit==='engineer'&&<g><path d="m118 179 12-3 7 73h46l7-73 12 3-5 159h-75Z" fill="#325f83"/><path d="m127 218 66 1-4 61h-59Z" fill={fill('cloth')}/><path d="M136 232h46v31h-46Z" fill="none" stroke="#d7b986" strokeWidth="1.3"/><circle cx="132" cy="218" r="4" fill={fill('gold')}/><circle cx="188" cy="218" r="4" fill={fill('gold')}/><path d="M160 282v54M124 303l22 4m30 0 20-4" fill="none" stroke="#c8b286" strokeWidth="1.2"/></g>}
   {a.outfit==='jacket'&&<g><path d="m138 172 9 75 3 91-41 5-1-161Zm43 0-9 75-2 91 41 5 1-161Z" fill={fill('cloth')}/><path d="m137 175-15 17 20 24m40-41 15 17-20 24" fill="#815434"/><path d="M144 213v120m31-120v120M118 280l17-5m51 0 16 5" fill="none" stroke="#d7b482" strokeWidth="1.5"/><path d="m121 237 12 1-1 16-11-1Zm67 1 12-1 1 16-11 1Z" fill="#98673f"/>{[226,258,290,320].map(y=><circle key={y} cx="178" cy={y} r="2.6" fill={fill('gold')}/>)}</g>}
   {a.outfit==='workwear'&&<g><path d="M160 191v145M117 224l28 1-1 34-27-2Zm59 1 28-1v33l-27 2Z" fill="none" stroke="#b8ad92" strokeWidth="1.2"/><path d="m117 224 13 8 15-7m31 0 14 7 14-8" fill="none"/><circle cx="163" cy="222" r="2.6" fill={fill('gold')}/><circle cx="163" cy="272" r="2.6" fill={fill('gold')}/><path d="m198 201 3 21" stroke="#c99b48" strokeWidth="3"/></g>}
   {a.outfit==='founder'&&<g><path d="m137 175 23 16 22-16 5 154-27 18-26-18Z" fill={fill('wine')}/><path d="m138 173 9 66-11 105-29-3 1-159Zm43 0-9 66 12 105 29-3-1-159Z" fill={fill('cloth')}/><path d="m137 175-14 18 21 25-10 16 23 32m25-91 14 18-21 25 10 16-24 32" fill={fill('shirt')}/><path d="m154 201 8-3 7 4-7 15-8 48 10 11 10-11-12-48Z" fill={fill('wine')}/>{[277,298,318].map(y=><circle key={y} cx="160" cy={y} r="3.3" fill={fill('gold')}/>)}<path d="m136 303q18 22 48-3" fill="none" stroke="#d6ad55" strokeWidth="1.4"/></g>}
   <path d="M107 335q53 10 107 0v14q-54 10-107 0Z" fill="#443229"/><path d="M148 336h24v15h-24Z" fill={fill('gold')}/><path d="M154 340h12v7h-12Z" fill="#382920"/>
   <path d="m121 389 11 55m63-55-12 55m-60 51 12 20m51-20-13 20" fill="none" stroke="#b0a79c" strokeWidth="1.3" opacity=".28"/>
  </g>
  <g transform={`translate(160 0) scale(${scale} 1) translate(-160 0)`}><ModelArm uid={uid} outfit={a.outfit} upper={leftUpper} lower={leftLower}/><g transform="translate(320 0) scale(-1 1)"><ModelArm uid={uid} outfit={a.outfit} upper={rightUpper} lower={rightLower}/></g></g>
  </g>
 </svg>
}

function ModelArm({uid,outfit,upper,lower}:{uid:string;outfit:AvatarConfig['outfit'];upper:RefObject<SVGGElement|null>;lower:RefObject<SVGGElement|null>}){
 const fill=(name:string)=>`url(#${uid}-${name})`,sleeve=outfit==='engineer'?fill('shirt'):fill('cloth'),long=['suit','jacket','founder'].includes(outfit)
 return <g ref={upper} data-bone="upper-arm" stroke="#3d2924" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round">
  <path d="M109 179q-21 1-27 24l-12 62 28 12 16-46 2-40Z" fill={sleeve}/><path d="m88 207-10 50m22-47-6 36" fill="none" stroke="#f8e2b8" strokeWidth="1.3" opacity=".28"/>
  <g ref={lower} data-bone="forearm"><path d="M72 260q-7 15 3 30l19 31q5 11 15 10l7-10-14-20-9-32Z" fill={fill('skin')}/>
   {long&&<path d="m72 261 23 10 13 35-14 10-21-30q-6-11-1-25Z" fill={sleeve}/>}
   <path d={long?'m95 303 14 5-2 10-15-6Z':'m72 255 25 10-3 12-26-10Z'} fill={fill('shirt')}/>
   <path d="m98 311 11 9m-13-5 11 10m-8-7 7 9" stroke="#985f3d" strokeWidth="1.15" fill="none"/>
  </g>
 </g>
}


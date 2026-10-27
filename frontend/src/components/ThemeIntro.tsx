import type { ThemeView } from '../api/types'
import type { AvatarConfig } from '../lib/avatar'
import { factoryArt } from '../lib/art'
import { clock, money } from '../lib/format'
import { FACTORY_NAME_MAX_LENGTH } from '../lib/form-limits'
import { ArtText as T, PaintedArt as Art } from './ArtText'
import { CeoAvatar, CeoName } from './CeoAvatar'
import { SessionShell } from './SessionUI'

export function ThemeIntro({theme,busy,onBegin,error,crewRequired,cash=0,workers=0,clusters=0,ceoName='',avatar,remainingMs}:{theme:ThemeView;busy:boolean;onBegin:(name:string)=>void;error?:string;crewRequired?:number;cash?:number;workers?:number;clusters?:number;ceoName?:string;avatar?:AvatarConfig;remainingMs?:number}){
 const name=theme.factoryName.trim().slice(0,FACTORY_NAME_MAX_LENGTH)
 return <SessionShell title="Doanh nghiệp của bạn" className="session-entry session-assignment session-overlay" action={<div className="session-identity"><CeoAvatar avatar={avatar} portrait/>{remainingMs!=null&&<T text={clock(remainingMs)} bold/>}</div>}>
  <section id="sIntro" className="session-frame assignment-card"><div className="assignment-art"><Art src={factoryArt(theme.industryId)} eager/></div><form onSubmit={e=>{e.preventDefault();if(!busy)onBegin(name)}}>
   <h2><T text={theme.industryName} bold/></h2><p className="assignment-ceo"><T text="CEO"/><CeoName name={ceoName} full/></p>
   <dl className="assignment-context"><div><dt><T text="Khu vực"/></dt><dd><T text={theme.regionName} bold/></dd></div><div><dt><T text="Quy mô"/></dt><dd><T text={theme.scaleName} bold/></dd></div><div><dt><T text="Bối cảnh"/></dt><dd><T text={theme.contextName}/></dd></div><div><dt><T text="Doanh nghiệp được giao"/></dt><dd><T text={name} bold/></dd></div><div><dt><T text="Vai trò của bạn"/></dt><dd><T text={theme.role}/></dd></div></dl>
   {theme.mission&&<p className="assignment-mission"><T text={theme.mission}/></p>}
   <div className="assignment-stats"><div><small><T text="Vốn khởi đầu"/></small><b><T text={money(cash)} bold/></b></div><div><small><T text="Công nhân"/></small><b><T text={String(Math.max(0,Math.floor(workers)))} bold/></b></div><div><small><T text="Cụm sản xuất"/></small><b><T text={String(Math.max(0,Math.floor(clusters)))} bold/></b></div>{crewRequired!=null&&<div><small><T text="Người / cụm"/></small><b><T text={String(crewRequired)} bold/></b></div>}</div>
   {error&&<p className="session-error" role="alert"><T text={error}/></p>}<button type="submit" className="session-button primary" disabled={busy}><T text="Bắt đầu" bold/></button>
  </form></section>
 </SessionShell>
}

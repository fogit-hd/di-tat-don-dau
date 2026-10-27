import { Link } from 'react-router-dom'
import { PaintedArt } from './ArtText'
import { PublicArtText as T } from './PublicArtText'
import { SessionShell } from './SessionUI'
import './room-loading.css'

export function RoomLoading({code,error,host=false}:{code:string;error?:string;host?:boolean}){
 const title=error?'Chưa kết nối được với phòng.':host?'Đang mở phòng…':'Đang vào phòng…'
 return <SessionShell title="" className="session-overlay session-loading">
  <section className="session-frame room-loading-card" aria-live="polite" aria-busy={!error}>
   <PaintedArt src="/assets/session-v2/room-door.webp" eager/>
   <h1 aria-label={title}>{error?<><T text="Chưa kết nối được" bold/><T text="với phòng." bold/></>:<T text={title} bold/>}</h1>
   <p className="room-loading-code"><T text={`Phòng ${code}`}/></p>
   {error?<><p className="session-error"><T text={error}/></p><div className="session-form-actions"><button type="button" className="session-button" onClick={()=>window.location.reload()}><T text="Thử lại" bold/></button><Link to="/" className="session-button secondary"><T text="Về trang chủ" bold/></Link></div></>:<><div className="room-loading-dots" aria-hidden="true"><i/><i/><i/></div><p><T text="Vui lòng chờ trong giây lát."/></p></>}
  </section>
 </SessionShell>
}

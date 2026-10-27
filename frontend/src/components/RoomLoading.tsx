import { Link } from 'react-router-dom'
import { ArtText as T, PaintedArt } from './ArtText'
import { SessionShell } from './SessionUI'

export function RoomLoading({code,error,host=false}:{code:string;error?:string;host?:boolean}){
 return <SessionShell title="" className="session-overlay session-loading">
  <section className="session-frame room-loading-card" aria-live="polite" aria-busy={!error}>
   <PaintedArt src="/assets/session-v2/room-door.webp" eager/>
   <h1><T text={error?'Chưa kết nối được với phòng.':host?'Đang mở phòng…':'Đang vào phòng…'} bold/></h1>
   <p><T text={`Phòng ${code}`}/></p>
   {error?<><p className="session-error"><T text={error}/></p><div className="session-form-actions"><button type="button" className="session-button" onClick={()=>window.location.reload()}><T text="Thử lại"/></button><Link to="/" className="session-button secondary"><T text="Về trang chủ"/></Link></div></>:<><div className="room-loading-dots" aria-hidden="true"><i/><i/><i/></div><p><T text="Vui lòng chờ trong giây lát."/></p></>}
  </section>
 </SessionShell>
}

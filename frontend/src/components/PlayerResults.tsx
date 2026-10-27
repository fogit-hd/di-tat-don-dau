import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Snapshot } from '../api/types'
import { money } from '../lib/format'
import { ArtText as T, PaintedArt as Art } from './ArtText'
import { CeoAvatar, CeoName } from './CeoAvatar'
import { SessionShell, SessionTabs } from './SessionUI'
import { SessionRanking } from './SessionRanking'
import { sessionArt } from '../lib/session-art'
import { YearLedger } from './YearLedger'
import { EventCardList } from './EventPanels'

export function PlayerResults({snap,onClose,provisional=false}:{snap:Snapshot;onClose?:()=>void;provisional?:boolean}){
 const [tab,setTab]=useState('overview'),you=snap.you,scene=you?.scene,row=snap.leaderboard.find(r=>r.teamId===you?.id)
 const endingKey=row?.ending??(scene?.trajectory==='build'?'lag':scene?.trajectory),ending=endingKey?snap.endings[endingKey]:null
 const handed=you?.succession,title=handed?.outcomeLabel||row?.endingTitle||ending?.title||'Đã kết thúc lượt chơi',detail=handed?.outcomeDetail||ending?.text||''
 return <SessionShell title="Kết quả của CEO" subtitle={`Phòng ${snap.room.code}${provisional?' · Xếp hạng tạm thời':''}`} className="session-overlay session-player-results" dialog action={<>{onClose&&<button className="session-button secondary" type="button" onClick={onClose}><T text="Xem lại sự kiện"/></button>}<Link className="session-button" to="/"><T text="Về trang chủ"/></Link></>}>
  <SessionTabs items={[["overview","Tổng quan"],["cash","Dòng tiền"],["events","Sự kiện"]]} value={tab} onChange={setTab}/>
  <div className="session-result-panel" role="tabpanel">
   {tab==='overview'&&<><section className="session-frame player-result-hero"><div className="player-victory-art"><Art src={sessionArt('victory')} eager/><CeoAvatar avatar={you?.avatar} portrait/></div><div className="player-result-numbers"><span className="player-rank"><T text={`${provisional?'Hạng tạm thời':'Hạng'} ${row?.rank??you?.rank??'—'}`} bold/></span><h2><CeoName name={you?.teamName??'CEO'} full/></h2><p><T text="Giá trị cuối"/></p><b className="player-final-value"><T text={money(row?.value??scene?.value??0)} bold/></b><div className="player-result-stats"><span><T text={`${handed?.year??scene?.cycles??0} năm`} bold/></span><span><T text={`${you?.correct??0} câu đúng`} bold/></span></div></div><div className="player-ending"><h3 className="session-ribbon"><T text="Kết thúc hành trình" bold/></h3><h4><T text={title} bold/></h4>{detail&&<p><T text={detail}/></p>}{handed?.causeText&&<p><T text={handed.causeText}/></p>}</div></section><SessionRanking rows={snap.leaderboard} teams={snap.teams} meId={you?.id}/></>}
   {tab==='cash'&&<section className="session-frame result-ledger"><YearLedger changes={scene?.yearChanges??[]} lines={scene?.lines} industryId={scene?.industryId}/></section>}
   {tab==='events'&&<section className="session-frame result-events"><h2><T text="Sự kiện trong hành trình" bold/></h2><EventCardList events={scene?.eventLog??[]} empty="Chưa có sự kiện nào."/></section>}
  </div>
 </SessionShell>
}

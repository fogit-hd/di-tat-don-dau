import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Snapshot, TeamRow } from '../api/types'
import { factoryArt } from '../lib/art'
import { clock, money, vnd } from '../lib/format'
import { ArtText as T, PaintedArt as Art } from './ArtText'
import { CeoAvatar, CeoName } from './CeoAvatar'
import { SessionRanking } from './SessionRanking'
import { SessionShell, SessionTabs } from './SessionUI'
import { HostQuestionStats } from './HostQuestionStats'
import { LiveRanking } from './LiveRanking'

export function HostLive({snap,now,busy,note,confirmEnd,onPause,onEnd,notice}:{snap:Snapshot;now:number;busy:boolean;note:string;confirmEnd:boolean;onPause:()=>void;onEnd:()=>void;notice?:React.ReactNode}){
 useEffect(()=>{try{sessionStorage.setItem('live-room:'+snap.room.code,'1')}catch{}},[snap.room.code])
 return <SessionShell title={`Phòng ${snap.room.code}`} className="session-lobby session-host-live" action={<><span className="session-live-clock"><T text={clock(snap.paused?(snap.room.remainingMs??0):(snap.room.endsAt??now)-now)} bold/></span><button type="button" className="session-button secondary" disabled={busy} onClick={onPause}><T text={snap.paused?'Tiếp tục':'Tạm dừng'}/></button><button type="button" className="session-button" disabled={busy} onClick={onEnd}><T text={confirmEnd?'Chốt kết thúc':'Kết thúc sớm'}/></button></>}>
  {note&&<p className="session-error" role="alert"><T text={note}/></p>}{notice}
  <LiveRanking rows={snap.leaderboard} teams={snap.teams}/>
 </SessionShell>
}

export function HostResults({snap}:{snap:Snapshot}){
 const [tab,setTab]=useState('ranking'),[selected,setSelected]=useState(snap.teams[0]?.id??'')
 const ceremonyKey=`ceremony:${snap.room.code}:${snap.room.endsAt??0}`
 const [ceremony,setCeremony]=useState(()=>{try{return Boolean(sessionStorage.getItem('live-room:'+snap.room.code))&&!sessionStorage.getItem(ceremonyKey)}catch{return false}})
 useEffect(()=>{try{sessionStorage.setItem(ceremonyKey,'1')}catch{}},[ceremonyKey])
 const team=snap.teams.find(t=>t.id===selected)??snap.teams[0]
 return <SessionShell title={`Kết quả phòng ${snap.room.code}`} subtitle={`${snap.teams.length} CEO · Đã kết thúc`} className="session-lobby session-host-results" action={<Link className="session-button secondary" to="/"><T text="Phòng mới"/></Link>}>
  <SessionTabs items={[["ranking","Bảng xếp hạng"],["ceos","Từng CEO"],["questions","Câu hỏi"]]} value={tab} onChange={id=>{setCeremony(false);setTab(id)}}/>
  <div className="session-result-panel" role="tabpanel">
   {tab==='ranking'&&<SessionRanking rows={snap.leaderboard} teams={snap.teams} ceremony={ceremony} onSelect={id=>{setCeremony(false);setSelected(id);setTab('ceos')}}/>}
   {tab==='ceos'&&<section className="session-frame host-ceo-tab"><label><T text="Chọn CEO" bold/><select value={selected} onChange={e=>setSelected(e.target.value)}>{snap.teams.map(t=><option key={t.id} value={t.id}>{t.teamName}</option>)}</select></label>{team&&<CeoBusinessDetail team={team} final/>}</section>}
   {tab==='questions'&&<div className="session-frame"><HostQuestionStats rows={snap.room.questionStats}/></div>}
  </div>
 </SessionShell>
}

function CeoBusinessDetail({team,final=false}:{team:TeamRow;final?:boolean}){
 return <section className="session-frame ceo-business-detail" aria-label={`Thông tin CEO ${team.teamName}`}>
  <h2 className="session-ribbon"><T text={final?'Kết quả CEO':'Đang xem CEO'} bold/></h2>
  <div className="ceo-business-picture">{team.industryId&&<Art src={factoryArt(team.industryId)} eager/>}</div>
  <div className="ceo-detail-identity"><CeoAvatar avatar={team.avatar} portrait/><h3><CeoName name={team.teamName} full/></h3></div>
  <p className="ceo-business-industry"><T text={team.themeName}/></p>
  <dl><div><dt><T text="Năm"/></dt><dd><T text={String(team.cycles)} bold/></dd></div><div><dt><T text="Tiền mặt"/></dt><dd><T text={team.cash==null?'—':money(team.cash)} bold/></dd></div><div><dt><T text={final?'Giá trị cuối':'Tài sản'}/></dt><dd><T text={money(team.value)} bold/></dd></div>{final&&<><div><dt><T text="Trả lời đúng"/></dt><dd><T text={team.correct==null?'—':`${team.correct}/${team.answered??0}`} bold/></dd></div><div><dt><T text="Kết quả"/></dt><dd><T text={team.succession?.outcomeLabel||team.endingTitle||'—'} bold/></dd></div></>}</dl>
  {final&&team.succession&&<p className="ceo-ending-detail"><T text={`${team.succession.causeText} · ${team.succession.outcomeDetail}`}/></p>}
  {!final&&team.finished&&<p className="ceo-ending-detail"><T text={`Đã kết thúc · ${team.endingTitle??'Đã chốt giá trị'} · ${vnd(team.value)}`}/></p>}
 </section>
}

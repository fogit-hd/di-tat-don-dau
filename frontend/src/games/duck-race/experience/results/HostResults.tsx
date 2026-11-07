import {useEffect,useRef,useState} from 'react'
import {Link} from 'react-router-dom'
import type Phaser from 'phaser'
import type {RaceLog,RaceSnapshot} from '../../contracts'
import {awardPad,resultPlayers,type ResultPlayer} from './motion'
import type {AwardsFrame,AwardsInput} from './createAwardsGame'
import './results.css'

const captions={intro:'Chuẩn bị trao giải',third:'Hạng 3 leo lên từ sau cúp, cúi chào',second:'Hạng 2 xuất hiện trong hộp quà',first:'Nhà vô địch đáp dù xuống cúp',stow:'Đã tiếp đất · gấp và cất dù',retrieve:'Lấy vương miện từ phía sau',raise:'Giơ cao vương miện',hold:'Khoảnh khắc chiến thắng',wear:'Đội vương miện lên đầu',final:'Chúc mừng các nhóm dẫn đầu'}
const points=(value:number)=>value.toLocaleString('vi-VN')+' điểm'
function Portrait({player}:{player:ResultPlayer}){return <img src={`/assets/duck-race/portraits-v6/duckee/${player.color}.webp`} alt="" draggable={false}/>}

function ResultsHistory({logs,onClose}:{logs:RaceLog[];onClose:()=>void}){
 const [page,setPage]=useState(0),close=useRef<HTMLButtonElement>(null)
 useEffect(()=>{close.current?.focus();const esc=(e:KeyboardEvent)=>{if(e.key==='Escape')onClose()};document.addEventListener('keydown',esc);return()=>document.removeEventListener('keydown',esc)},[onClose])
 return <div className="q4-scrim" onClick={e=>{if(e.currentTarget===e.target)onClose()}}><section className="q4-awards-history q4-paper" role="dialog" aria-modal="true" aria-labelledby="q4-results-history-title" onKeyDown={e=>{if(e.key!=='Tab')return;const all=[...e.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')],first=all[0],last=all.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}}}>
  <header><h2 id="q4-results-history-title">Lịch sử sự kiện</h2><button ref={close} className="q4-action q4-forest" onClick={onClose}>Đóng</button></header>
  <ul>{logs.slice(page*10,page*10+10).map(log=><li key={log.id}>{log.text}</li>)}</ul>
  {!logs.length&&<p>Chưa có sự kiện.</p>}
  {logs.length>10&&<nav className="q4-history-pages" aria-label="Trang lịch sử"><button disabled={!page} onClick={()=>setPage(p=>p-1)}>Trước</button><span>{page+1}/{Math.ceil(logs.length/10)}</span><button disabled={(page+1)*10>=logs.length} onClick={()=>setPage(p=>p+1)}>Sau</button></nav>}
 </section></div>
}

export function HostResults({snapshot,reduced}:{snapshot:RaceSnapshot;reduced:boolean}){
 // A terminal snapshot defines the ceremony once. Socket heartbeats must not restart it.
 const [players]=useState(()=>resultPlayers(snapshot.players)),[history,setHistory]=useState(false)
 const [paused,setPaused]=useState(false),[replay,setReplay]=useState(0),[ready,setReady]=useState(false),[error,setError]=useState(''),[attempt,setAttempt]=useState(0),[frame,setFrame]=useState<AwardsFrame|null>(null)
 const mount=useRef<HTMLDivElement>(null),historyTrigger=useRef<HTMLButtonElement>(null)
 const current=useRef<AwardsInput>({players,reduced,paused,replay})
 useEffect(()=>{current.current={players,reduced,paused:paused||history,replay}},[players,reduced,paused,history,replay])
 useEffect(()=>{
  let stopped=false,game:Phaser.Game|undefined,observer:ResizeObserver|undefined
  void import('./createAwardsGame').then(({createAwardsGame})=>{
   if(stopped||!mount.current)return
   game=createAwardsGame(mount.current,()=>current.current,{ready:()=>{if(!stopped)setReady(true)},frame:f=>{if(!stopped)setFrame(f)},error:message=>{if(!stopped)setError(message)}})
   observer=new ResizeObserver(([entry])=>{if(game?.isBooted&&entry.contentRect.width>0&&entry.contentRect.height>0)game.scale.resize(Math.round(entry.contentRect.width),Math.round(entry.contentRect.height))});observer.observe(mount.current)
  }).catch(()=>{if(!stopped)setError('Không mở được lễ trao giải. Vui lòng thử lại.')})
  return()=>{stopped=true;observer?.disconnect();game?.destroy(true,false)}
 },[attempt])
 const phase=frame?.phase??'intro',focusRank=phase==='third'?3:phase==='second'?2:1,focus=players.find(p=>p.rank===focusRank)
 const closeHistory=()=>{setHistory(false);historyTrigger.current?.focus()}
 return <section className="q4-host-results" aria-label="Tổng kết cuộc đua" data-results-phase={phase} data-results-ready={ready}>
  <div className="q4-awards-stage" data-award-phase={phase}>
   <div ref={mount} className="q4-awards-mount"/>
   <div className="q4-awards-heading" role="status"><p>{players.length?captions[phase]:'Cuộc đua đã khép lại'}</p><h1 title={focus?.name}>{phase==='intro'?'Một cuộc đua. Ba vị trí dẫn đầu.':!players.length?'Chưa có nhóm tham gia':phase==='final'?`Nhà vô địch: ${focus?.name??'—'}`:focus?`${focus.name} · ${points(focus.points)}`:''}</h1></div>
   {!ready&&!error&&<p className="q4-awards-loading" role="status">Đang mở lễ trao giải…</p>}
   {error&&<div className="q4-awards-error" role="alert"><p>{error}</p><button className="q4-action q4-amber" onClick={()=>{setError('');setReady(false);setFrame(null);setAttempt(n=>n+1)}}>Thử lại</button><ol>{players.map(p=><li key={p.id}>Hạng {p.rank} · {p.name} · {points(p.points)}</li>)}</ol></div>}
   {frame&&!error&&players.filter(p=>p.rank<=3).map(p=>{const pad=awardPad(p.rank,frame.layout);return <div key={p.id} className={`q4-awards-label ${frame.revealed.includes(p.rank)?'is-visible':''}`} style={{left:pad.x,top:pad.labelY,width:pad.labelWidth}} aria-hidden={!frame.revealed.includes(p.rank)}><b>Hạng {p.rank}</b><strong title={p.name}>{p.name}</strong><span>{points(p.points)}</span></div>})}
  </div>
  <div className="q4-awards-remaining"><h2>Các nhóm còn lại</h2><ol>{players.filter(p=>p.rank>3).map(p=><li key={p.id}><b>{p.rank}</b><Portrait player={p}/><div><strong title={p.name}>{p.name}</strong><span>{points(p.points)}</span></div></li>)}</ol>{!players.some(p=>p.rank>3)&&<p>{players.length} nhóm tham gia</p>}</div>
  <div className="q4-awards-actions"><button className="q4-action q4-forest" disabled={!ready} onClick={()=>{setPaused(false);setReplay(n=>n+1)}}>Phát lại trao giải</button><button className="q4-back-link" disabled={!ready||reduced||frame?.done} onClick={()=>setPaused(v=>!v)}>{paused?'Tiếp tục':'Tạm dừng'}</button><button ref={historyTrigger} className="q4-back-link" onClick={()=>setHistory(true)}>Lịch sử sự kiện</button><Link className="q4-action q4-amber" to="/duck-race">Về trang trò chơi</Link></div>
  <ol className="q4-sr" aria-label="Kết quả đã chốt">{players.map(p=><li key={p.id}>Hạng {p.rank}, {p.name}, {points(p.points)}</li>)}</ol>
  {history&&<ResultsHistory logs={snapshot.logs} onClose={closeHistory}/>}
 </section>
}

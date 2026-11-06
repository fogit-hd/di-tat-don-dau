import { useEffect, useRef, useState } from 'react'
import type { RaceSnapshot } from '../contracts'
import type { ChestKind } from '../experience-contracts'
import { PhaserView } from './PhaserView'
import { elapsedTime } from './motion'
import { Glyph, Hourglass, usePanelMotion } from './ui'

type Action=(type:string,extra?:Record<string,unknown>)=>Promise<void>
const CHESTS:{kind:ChestKind;name:string;detail:string}[]=[{kind:'safe',name:'An toàn',detail:'Có lợi cho bạn'},{kind:'single',name:'Bán phẩm',detail:'Tác động một người'},{kind:'explosive',name:'Bùng nổ',detail:'Tác động nhiều người'}]
export function ChestDock({snapshot:s,now,reduced,busy,action,onReady}:{snapshot:RaceSnapshot;now:number;reduced:boolean;busy:boolean;action:Action;onReady:(ready:boolean)=>void}){
 const phase=s.experience?.quiz?.phase,visible=!!phase&&['chests','opening','target'].includes(phase),[present,setPresent]=useState(visible),[armed,setArmed]=useState(false)
 const previous=useRef(visible)
 useEffect(()=>{if(visible){setPresent(true);setArmed(false);const t=setTimeout(()=>setArmed(true),reduced?0:380);return()=>clearTimeout(t)}if(previous.current){const t=setTimeout(()=>setPresent(false),reduced?0:240);return()=>clearTimeout(t)}},[visible,reduced])
 useEffect(()=>{previous.current=visible},[visible])
 const animation=usePanelMotion(String(visible)),result=s.experience?.chest?.result
 return <section className={`q4-chests ${present?'is-present':''} ${visible?'is-visible':''}`} aria-label="Chọn rương phần thưởng" aria-hidden={!visible} inert={!visible}>
  <div ref={animation} className="q4-chest-inner"><div className="q4-chest-caption" role="status">{phase==='chests'?<>Đúng rồi! <strong>+{s.answer?.reward||s.experience?.quiz?.reward} điểm</strong><span>Chọn một rương</span></>:result?<><strong>{result.title}</strong><span>{result.lines.length===1?result.lines[0].text:`Tác động ${result.lines.length} nhóm`}</span></>:<><strong>Đang mở rương…</strong><span>Phần thưởng sắp xuất hiện</span></>}</div>
  <div className="q4-chest-stage"><PhaserView kind="chests" input={{snapshot:s,now,host:false,reduced}} onReady={onReady}/><div className="q4-chest-hitboxes">{CHESTS.map(c=><button key={c.kind} className={s.experience?.chest?.kind===c.kind?'is-chosen':''} disabled={!visible||phase!=='chests'||busy||!armed} aria-label={`Mở rương ${c.name}`} onClick={()=>void action('chest',{kind:c.kind}).catch(()=>{})}><span>{c.name}</span><small>{c.detail}</small></button>)}</div></div></div>
 </section>
}
export function RacePanel({snapshot:s,now,busy,reduced,ready,action}:{snapshot:RaceSnapshot;now:number;busy:boolean;reduced:boolean;ready:boolean;action:Action}){
 const q=s.experience!.quiz!,phase=q.phase,elapsed=elapsedTime(s,now),left=Math.max(0,q.until-elapsed),panel=usePanelMotion(phase==='question'?`${phase}:${s.question?.id}`:phase),[selected,setSelected]=useState('')
 useEffect(()=>setSelected(''),[s.question?.id])
 const ask=()=>void action('question').catch(()=>{}),waiting=phase==='wait'||phase==='wrong',starAllowed=['ready','wait','wrong'].includes(phase)&&!s.starUsed&&!s.starArmed&&!s.experience!.paused
 const chest=['chests','opening','target'].includes(phase),receipt=s.experience?.chest?.result
 return <aside className={`q4-panel q4-paper ${phase==='ready'?'is-ready':''} ${chest?'is-chest-panel':''}`} aria-label="Câu hỏi và phần thưởng">
  <div ref={panel} className="q4-panel-body">
  {phase==='ready'&&<div className="q4-ready"><span className="q4-eyebrow">Kiến thức là lợi thế</span><h2>Sẵn sàng bứt phá?</h2><p>Trả lời đúng để nhận điểm và chọn một rương.</p><button className="q4-action q4-amber q4-wide" onClick={ask} disabled={!ready||busy||s.experience!.paused}>{ready?'Trả lời câu hỏi':'Đang chuẩn bị đường đua…'}</button></div>}
  {phase==='question'&&s.question&&<div className="q4-question"><div className="q4-question-top"><strong>Câu {s.question.number}</strong><time className={left<3000?'is-urgent':''}>{Math.ceil(left/1000)}s</time></div><progress aria-label="Thời gian trả lời" max="10000" value={left}/><h2>{s.question.prompt}</h2><div className="q4-answers">{s.question.options.map((o,i)=><button key={o.id} disabled={busy||!!selected||left<=0||s.experience!.paused} aria-pressed={selected===o.id} onClick={()=>{setSelected(o.id);void action('answer',{questionId:s.question!.id,choice:o.id}).catch(()=>setSelected(''))}}><b>{'ABCD'[i]}</b><span>{o.text}</span></button>)}</div><small className="q4-question-reward">Câu đúng: +{q.reward} điểm{s.starArmed?' · Ngôi sao ×2':''}</small></div>}
  {waiting&&<div className={`q4-wait ${phase==='wrong'?'is-wrong':''}`}><Hourglass reduced={reduced}/><span className="q4-eyebrow">{phase==='wrong'?'Chưa chính xác':'Một nhịp nghỉ'}</span><h2>{phase==='wrong'?'Thử lại sau':'Câu tiếp theo sau'} <strong>{Math.ceil(left/1000)}s</strong></h2>{phase==='wrong'&&s.answer&&<p>{s.answer.selected?'Đáp án vừa chọn chưa đúng.':'Hết thời gian trả lời.'}{s.answer.reward<0?` ${s.answer.reward} điểm.`:''}</p>}{phase==='wait'&&receipt?<div className="q4-receipt"><strong>{receipt.title}</strong>{receipt.lines.map(l=><div key={l.playerId}><span title={l.name}>{l.name}</span><b>{l.text}</b></div>)}</div>:<p>Đường đua vẫn tiếp tục.</p>}</div>}
  {chest&&<div className="q4-reward-state"><span className="q4-eyebrow">Phần thưởng</span><h2>{phase==='target'?'Chọn người nhận':phase==='chests'?'Bạn chọn rương nào?':'Rương đang mở'}</h2>{phase==='target'?<><p>Chọn một nhóm để áp dụng sự kiện.</p><div className="q4-targets">{s.players.filter(p=>s.experience?.chest?.targetIds?.includes(p.id)).map(p=><button className="q4-action q4-forest" key={p.id} disabled={busy||s.experience!.paused} onClick={()=>void action('target',{targetId:p.id}).catch(()=>{})}><img src={`/assets/duck-race/portraits-v6/duckee/${p.color}.webp`} alt=""/><span title={p.name}>{p.name}</span></button>)}</div></>:<p className="q4-reward-instruction">{phase==='chests'?'Ba lựa chọn ở ngay dưới đường đua.':'Phần thưởng được mở ngay tại rương bạn chọn.'}</p>}</div>}
  </div>
  {!chest&&<button className={`q4-hope ${s.starArmed?'is-armed':''}`} disabled={!starAllowed||busy} onClick={()=>void action('star').catch(()=>{})}><Glyph kind="star"/><span><strong>{s.starArmed?'Ngôi sao đã sẵn sàng':s.starUsed?'Đã dùng Ngôi sao':'Ngôi sao hi vọng'}</strong><small>{s.starArmed?'Câu kế tiếp: đúng ×2, sai mất điểm':s.starUsed?'Một lần mỗi trận':'Câu kế tiếp: đúng ×2, sai mất điểm'}</small></span></button>}
 </aside>
}

import { useCallback, useEffect, useRef, useState } from 'react'
import type { RaceSnapshot } from '../contracts'
import { createGameSocket } from '../../../shared/realtime'
import { duckSocketBase } from '../endpoints'
import { duckRequest, type DuckSession } from './api'

export function useExperienceRoom(code:string,session:DuckSession|null){
 const [snapshot,setSnapshot]=useState<RaceSnapshot|null>(null),[now,setNow]=useState(()=>Date.now()),[connected,setConnected]=useState(false),[error,setError]=useState(''),[busy,setBusy]=useState(false)
 const timing=useRef({revision:-1,server:now,local:0}),pending=useRef(new Set<string>())
 const accept=useCallback((s:RaceSnapshot)=>{if((s.revision??0)<=timing.current.revision)return;timing.current={revision:s.revision??0,server:s.serverTime,local:performance.now()};setSnapshot(s);setNow(s.serverTime)},[])
 useEffect(()=>{if(!code||!session)return;const timer=setInterval(()=>{if(timing.current.revision>=0)setNow(timing.current.server+performance.now()-timing.current.local)},80);return()=>clearInterval(timer)},[code,session])
 useEffect(()=>{
  if(!code||!session)return
  let alive=true;const abort=new AbortController()
  const socket=createGameSocket(`${duckSocketBase()}/duck-race`,{path:'/duck-socket',auth:{code,token:session.token},transports:['websocket','polling']})
  socket.on('connect',()=>{if(alive){setConnected(true);setError('')}});socket.on('disconnect',()=>{if(alive)setConnected(false)})
  socket.on('race:snapshot',(s:RaceSnapshot)=>{if(alive)accept(s)})
  socket.on('connect_error',()=>{if(alive){setConnected(false);setError('Mất kết nối. Đang thử kết nối lại…')}})
  void duckRequest<RaceSnapshot>(`/rooms/${code}`,undefined,session.token,abort.signal).then(s=>{if(alive)accept(s)}).catch(e=>{if(alive&&!abort.signal.aborted)setError((e as Error).message)})
  return()=>{alive=false;abort.abort();socket.disconnect()}
 },[code,session,accept])
 const action=useCallback(async(type:string,extra:Record<string,unknown>={})=>{
  if(!session||pending.current.has(type))return
  pending.current.add(type);setBusy(true)
  try{accept(await duckRequest<RaceSnapshot>(`/rooms/${code}/action`,{type,...extra},session.token));setError('')}
  catch(e){setError((e as Error).message);throw e}
  finally{pending.current.delete(type);setBusy(pending.current.size>0)}
 },[session,code,accept])
 const hasSnapshot=!!snapshot
 useEffect(()=>{if(!error||!hasSnapshot)return;const timer=setTimeout(()=>setError(''),6000);return()=>clearTimeout(timer)},[error,hasSnapshot])
 return {snapshot,now,connected,error,setError,busy,action}
}

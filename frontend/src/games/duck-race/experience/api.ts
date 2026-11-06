import { duckApiBase } from '../endpoints'
export type DuckSession={token:string;role:'host'|'player'}
const key=(code:string)=>`quiz-duck-race:v1:${code}`
export function readSession(code:string):DuckSession|null{try{const s=JSON.parse(localStorage.getItem(key(code))||'null');return s&&typeof s.token==='string'&&['host','player'].includes(s.role)?s:null}catch{return null}}
export function storeSession(code:string,value:DuckSession){localStorage.setItem(key(code),JSON.stringify(value))}
export function forgetSession(code:string){localStorage.removeItem(key(code))}
export class DuckRequestError extends Error{status:number;constructor(message:string,status:number){super(message);this.status=status}}
export async function duckRequest<T>(path:string,body?:unknown,token?:string,signal?:AbortSignal):Promise<T>{
 const response=await fetch(`${duckApiBase()}/api/duck-race${path}`,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',...(token?{'x-duck-token':token}:{}),...(localStorage.getItem('host-session')?{'x-host-session':localStorage.getItem('host-session')!}:{})},body:body===undefined?undefined:JSON.stringify(body),signal})
 const data=await response.json().catch(()=>({}));if(!response.ok)throw new DuckRequestError(data.error||'Không kết nối được phòng. Hãy thử lại.',response.status);return data
}

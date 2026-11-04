import {describe,it,expect,vi} from 'vitest'
import express from 'express'
import {createServer} from 'node:http'
import type {AddressInfo} from 'node:net'
const auth=vi.hoisted(()=>({signInGoogle:vi.fn(),requireHostUser:vi.fn(),revokeHostSession:vi.fn()}))
vi.mock('./auth',()=>auth)
import {createAuthRouter} from './auth-routes'

describe('the same account endpoints in both deployments',()=>{
 it('logs in, reads identity and logs out with the same credential at both game prefixes',async()=>{
  const app=express();app.use(express.json());app.use('/api/auth',createAuthRouter());app.use('/api/duck-race/auth',createAuthRouter())
  const server=createServer(app);await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve))
  const base=`http://127.0.0.1:${(server.address() as AddressInfo).port}`,user={id:'host',name:'Chủ phòng',email:'test@example.invalid',picture:null}
  auth.signInGoogle.mockResolvedValue({token:'test-session',user});auth.requireHostUser.mockResolvedValue(user);auth.revokeHostSession.mockResolvedValue(undefined)
  try{
   for(const prefix of ['/api/auth','/api/duck-race/auth']){
    const login=await fetch(base+prefix+'/google',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({credential:'local-test-credential-12345'})})
    expect(await login.json()).toEqual({token:'test-session',user})
    const me=await fetch(base+prefix+'/me',{headers:{'x-host-session':'test-session'}});expect(await me.json()).toEqual({user})
    const logout=await fetch(base+prefix+'/logout',{method:'POST',headers:{'x-host-session':'test-session'}});expect(await logout.json()).toEqual({ok:true})
   }
   expect(auth.revokeHostSession).toHaveBeenCalledWith('test-session')
  }finally{await new Promise<void>((resolve,reject)=>server.close(e=>e?reject(e):resolve()))}
 })
})

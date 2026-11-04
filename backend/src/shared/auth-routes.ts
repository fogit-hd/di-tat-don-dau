import { Router } from 'express'
import { z } from 'zod'
import { requireHostUser, revokeHostSession, signInGoogle } from './auth'

/** Same identity service mounted by each independent game backend. No game-runtime import. */
export function createAuthRouter() {
  const router=Router()
  router.post('/google', async(req,res,next)=>{
    try{const body=z.object({credential:z.string().min(20)}).parse(req.body);res.json(await signInGoogle(body.credential))}catch(error){next(error)}
  })
  router.get('/me',async(req,res,next)=>{
    try{const user=await requireHostUser(req.header('x-host-session')||'');res.json({user:{id:user.id,name:user.name,email:user.email,picture:user.picture}})}catch(error){next(error)}
  })
  router.post('/logout',async(req,res,next)=>{
    try{await revokeHostSession(req.header('x-host-session')||'');res.json({ok:true})}catch(error){next(error)}
  })
  return router
}

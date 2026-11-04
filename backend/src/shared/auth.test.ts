import {describe,it,expect,vi,beforeEach} from 'vitest'
import {createHmac} from 'node:crypto'
const db=vi.hoisted(()=>({findUnique:vi.fn(),deleteMany:vi.fn()}))
vi.mock('./prisma',()=>({prisma:{hostSession:db}}))
import {requireHostUser,revokeHostSession} from './auth'
import {HttpError} from './http-error'
beforeEach(()=>{vi.clearAllMocks();process.env.GOOGLE_CLIENT_ID='local-test-client';process.env.AUTH_SESSION_SECRET='test-session-secret-with-more-than-32-characters'})
describe('shared host identity',()=>{
 it('accepts the same hashed session for either game and revokes it server-side on logout',async()=>{
  const user={id:'host',name:'Host'},token='local-test-token'
  db.findUnique.mockResolvedValue({expiresAt:new Date(Date.now()+60000),user});db.deleteMany.mockResolvedValue({count:1})
  expect(await requireHostUser(token)).toEqual(user)
  await revokeHostSession(token)
  expect(db.deleteMany).toHaveBeenCalledWith({where:{tokenHash:createHmac('sha256',process.env.AUTH_SESSION_SECRET!).update(token).digest('hex')}})
  db.findUnique.mockResolvedValue(null)
  await expect(requireHostUser(token)).rejects.toBeInstanceOf(HttpError)
 })
 it('rejects expired sessions, never treating a local signed-in label as authority',async()=>{
  db.findUnique.mockResolvedValue({expiresAt:new Date(0),user:{id:'host'}})
  await expect(requireHostUser('expired')).rejects.toMatchObject({status:401})
 })
})

import { createHmac, randomBytes } from 'crypto'
import { OAuth2Client } from 'google-auth-library'
import { prisma } from './prisma'
import { HttpError } from './runtime'

const client = new OAuth2Client()

function config() {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const secret = process.env.AUTH_SESSION_SECRET
  if (!clientId || !secret || secret.length < 32) throw new HttpError(503, 'Đăng nhập Google chưa được cấu hình trên máy chủ')
  return { clientId, secret }
}

function tokenHash(token: string, secret: string) {
  return createHmac('sha256', secret).update(token).digest('hex')
}

export async function signInGoogle(credential: string) {
  const { clientId, secret } = config()
  let payload
  try {
    payload = (await client.verifyIdToken({ idToken: credential, audience: clientId })).getPayload()
  } catch {
    throw new HttpError(401, 'Không xác thực được tài khoản Google')
  }
  if (!payload?.sub || !payload.email || !payload.email_verified) throw new HttpError(401, 'Tài khoản Google chưa xác thực email')
  const user = await prisma.hostUser.upsert({
    where: { googleSub: payload.sub },
    create: { googleSub: payload.sub, email: payload.email, name: payload.name || payload.email, picture: payload.picture || null },
    update: { email: payload.email, name: payload.name || payload.email, picture: payload.picture || null },
  })
  const token = randomBytes(32).toString('base64url')
  await prisma.hostSession.create({ data: { tokenHash: tokenHash(token, secret), userId: user.id, expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30) } })
  return { token, user: { id: user.id, name: user.name, email: user.email, picture: user.picture } }
}

export async function requireHostUser(token: string) {
  const { secret } = config()
  const session = await prisma.hostSession.findUnique({ where: { tokenHash: tokenHash(token, secret) }, include: { user: true } })
  if (!session || session.expiresAt.getTime() <= Date.now()) throw new HttpError(401, 'Hãy đăng nhập Google để tạo phòng')
  return session.user
}

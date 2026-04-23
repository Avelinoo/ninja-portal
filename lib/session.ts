import { createHmac } from 'crypto'

export interface SessionPayload {
  userId: number
  username: string
  role: string
  exp: number  // unix timestamp
}

function sign(data: string, secret: string): string {
  return createHmac('sha256', secret).update(data).digest('hex')
}

const SESSION_TTL_S = 60 * 60 * 24 * 30  // 30 dias

export function encodeSession(payload: Omit<SessionPayload, 'exp'>, secret: string): string {
  const full: SessionPayload = { ...payload, exp: Math.floor(Date.now() / 1000) + SESSION_TTL_S }
  const data = Buffer.from(JSON.stringify(full)).toString('base64url')
  const sig = sign(data, secret)
  return `${data}.${sig}`
}

export function decodeSession(token: string, secret: string): SessionPayload | null {
  try {
    const dot = token.lastIndexOf('.')
    if (dot === -1) return null
    const data = token.slice(0, dot)
    const sig = token.slice(dot + 1)
    if (sign(data, secret) !== sig) return null
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString()) as SessionPayload
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null  // expirado
    return payload
  } catch {
    return null
  }
}

export const SESSION_COOKIE = 'ninja_session'
export const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 24 * 30,
  path: '/',
}

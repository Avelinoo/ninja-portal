import { createHmac } from 'crypto'

export interface SessionPayload {
  userId: number
  username: string
  role: string
}

function sign(data: string, secret: string): string {
  return createHmac('sha256', secret).update(data).digest('hex')
}

export function encodeSession(payload: SessionPayload, secret: string): string {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url')
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
    return JSON.parse(Buffer.from(data, 'base64url').toString()) as SessionPayload
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

import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import pool, { ensureSchema } from '@/lib/db'
import { encodeSession, SESSION_COOKIE, COOKIE_OPTS } from '@/lib/session'
import { checkRateLimit } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
  const rl = checkRateLimit(`login:${ip}`, 5, 15 * 60 * 1000)
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Muitas tentativas. Tente novamente em 15 minutos.' }, { status: 429 })
  }

  let body: { username?: unknown; password?: unknown }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Requisição inválida' }, { status: 400 })
  }

  const { username, password } = body
  if (typeof username !== 'string' || typeof password !== 'string') {
    return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 })
  }

  await ensureSchema()

  const { rows } = await pool.query(
    `SELECT id, username, password_hash, role, is_active FROM portal.users WHERE username = $1 LIMIT 1`,
    [username.toLowerCase().trim()]
  )
  const user = rows[0]

  if (!user || !user.is_active) {
    return NextResponse.json({ error: 'Usuário ou senha incorretos' }, { status: 401 })
  }

  const match = await bcrypt.compare(password, user.password_hash)
  if (!match) {
    return NextResponse.json({ error: 'Usuário ou senha incorretos' }, { status: 401 })
  }

  const secret = process.env.SESSION_SECRET!
  const token = encodeSession({ userId: user.id, username: user.username, role: user.role }, secret)
  const res = NextResponse.json({ ok: true, role: user.role })
  res.cookies.set(SESSION_COOKIE, token, COOKIE_OPTS)
  return res
}

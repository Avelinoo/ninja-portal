import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import pool, { ensureSchema } from '@/lib/db'
import { decodeSession, SESSION_COOKIE } from '@/lib/session'
import { checkRateLimit } from '@/lib/rate-limit'

function getSession(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value
  if (!token) return null
  return decodeSession(token, process.env.SESSION_SECRET!)
}

function rateGuard(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
  return checkRateLimit(`users:${ip}`, 20, 60 * 1000)  // 20 req/min por IP
}

async function writeAudit(actorId: number, action: string, target: string) {
  try {
    await pool.query(
      `INSERT INTO portal.audit_log (actor_id, action, target, created_at) VALUES ($1, $2, $3, NOW())`,
      [actorId, action, target]
    )
  } catch {
    // audit failures nunca bloqueam a operação principal
  }
}

export async function GET(req: NextRequest) {
  const rl = rateGuard(req)
  if (!rl.allowed) return NextResponse.json({ error: 'Rate limit excedido' }, { status: 429 })

  const session = getSession(req)
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }
  await ensureSchema()
  const { rows } = await pool.query(
    `SELECT id, username, role, is_active, created_at FROM portal.users ORDER BY created_at`
  )
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const rl = rateGuard(req)
  if (!rl.allowed) return NextResponse.json({ error: 'Rate limit excedido' }, { status: 429 })

  const session = getSession(req)
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  let body: { username?: unknown; password?: unknown; role?: unknown }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Requisição inválida' }, { status: 400 })
  }

  const { username, password, role } = body
  if (typeof username !== 'string' || typeof password !== 'string') {
    return NextResponse.json({ error: 'username e password são obrigatórios' }, { status: 400 })
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'Senha mínima de 6 caracteres' }, { status: 400 })
  }

  const allowedRoles = ['admin', 'user']
  const userRole = typeof role === 'string' && allowedRoles.includes(role) ? role : 'user'

  await ensureSchema()
  const hash = await bcrypt.hash(password, 10)

  try {
    const { rows } = await pool.query(
      `INSERT INTO portal.users (username, password_hash, role) VALUES ($1, $2, $3) RETURNING id, username, role, created_at`,
      [username.toLowerCase().trim(), hash, userRole]
    )
    await writeAudit(session.userId, 'user.create', rows[0].username)
    return NextResponse.json(rows[0], { status: 201 })
  } catch (err: unknown) {
    if ((err as { code?: string }).code === '23505') {
      return NextResponse.json({ error: 'Usuário já existe' }, { status: 409 })
    }
    throw err
  }
}

export async function DELETE(req: NextRequest) {
  const rl = rateGuard(req)
  if (!rl.allowed) return NextResponse.json({ error: 'Rate limit excedido' }, { status: 429 })

  const session = getSession(req)
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const id = parseInt(searchParams.get('id') ?? '', 10)
  if (!id) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

  await ensureSchema()
  const { rows } = await pool.query(
    `SELECT username FROM portal.users WHERE id = $1`, [id]
  )
  if (!rows[0]) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
  if (rows[0].username === 'admin') {
    return NextResponse.json({ error: 'Não é possível remover o admin' }, { status: 400 })
  }

  await pool.query(`UPDATE portal.users SET is_active = false WHERE id = $1`, [id])
  await writeAudit(session.userId, 'user.deactivate', rows[0].username)
  return NextResponse.json({ ok: true })
}

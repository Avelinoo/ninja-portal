import { NextRequest, NextResponse } from 'next/server'
import pool, { ensureSchema } from '@/lib/db'
import { decodeSession, SESSION_COOKIE } from '@/lib/session'

function getSession(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value
  if (!token) return null
  return decodeSession(token, process.env.SESSION_SECRET!)
}

export async function GET(req: NextRequest) {
  const session = getSession(req)
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  await ensureSchema()
  const { rows } = await pool.query(
    `SELECT id, account_id, account_name, metric, condition, threshold, telegram_chat_id, is_active, last_triggered, created_at
     FROM portal.gestor_alerts WHERE user_id = $1 ORDER BY created_at DESC`,
    [session.userId]
  )
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const session = getSession(req)
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const body = await req.json()
  const { account_id, account_name, metric, condition, threshold, telegram_chat_id } = body

  const ALLOWED_METRICS = ['ctr', 'cpm', 'cpc', 'cost_per_result', 'spend', 'result_count']
  const ALLOWED_CONDITIONS = ['above', 'below']

  if (!account_id || !ALLOWED_METRICS.includes(metric) || !ALLOWED_CONDITIONS.includes(condition)) {
    return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 })
  }
  if (typeof threshold !== 'number' || threshold < 0) {
    return NextResponse.json({ error: 'Threshold inválido' }, { status: 400 })
  }

  await ensureSchema()
  const { rows } = await pool.query(
    `INSERT INTO portal.gestor_alerts (user_id, account_id, account_name, metric, condition, threshold, telegram_chat_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [session.userId, account_id, account_name ?? '', metric, condition, threshold, telegram_chat_id ?? process.env.TELEGRAM_CHAT_ID ?? '']
  )
  return NextResponse.json(rows[0], { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const session = getSession(req)
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const id = parseInt(req.nextUrl.searchParams.get('id') ?? '', 10)
  if (!id) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

  await ensureSchema()
  await pool.query(
    `DELETE FROM portal.gestor_alerts WHERE id = $1 AND user_id = $2`,
    [id, session.userId]
  )
  return NextResponse.json({ ok: true })
}

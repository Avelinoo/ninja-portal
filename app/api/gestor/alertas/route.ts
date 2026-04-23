import { NextRequest, NextResponse } from 'next/server'
import pool, { ensureSchema } from '@/lib/db'
import { decodeSession, SESSION_COOKIE } from '@/lib/session'

function getSession(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value
  if (!token) return null
  return decodeSession(token, process.env.SESSION_SECRET!)
}

const ALLOWED_METRICS    = new Set(['ctr', 'cpm', 'cpc', 'cost_per_result', 'spend', 'result_count'])
const ALLOWED_CONDITIONS = new Set(['above', 'below'])

export async function GET(req: NextRequest) {
  const session = getSession(req)
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  try {
    await ensureSchema()
    const { rows } = await pool.query(
      `SELECT id, account_id, account_name, metric, condition, threshold,
              telegram_chat_id, is_active, last_triggered, created_at
       FROM portal.gestor_alerts WHERE user_id = $1 ORDER BY created_at DESC`,
      [session.userId]
    )
    return NextResponse.json(rows)
  } catch (err) {
    console.error('[gestor/alertas GET]', err)
    return NextResponse.json({ error: 'Erro ao buscar alertas' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = getSession(req)
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  let body: Record<string, unknown>
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const { account_id, account_name, metric, condition, threshold, telegram_chat_id } = body

  if (!account_id || typeof account_id !== 'string') {
    return NextResponse.json({ error: 'account_id obrigatório' }, { status: 400 })
  }
  if (!ALLOWED_METRICS.has(String(metric))) {
    return NextResponse.json({ error: 'Métrica inválida' }, { status: 400 })
  }
  if (!ALLOWED_CONDITIONS.has(String(condition))) {
    return NextResponse.json({ error: 'Condição inválida (above|below)' }, { status: 400 })
  }
  const thresh = Number(threshold)
  if (!isFinite(thresh) || thresh < 0) {
    return NextResponse.json({ error: 'Threshold inválido' }, { status: 400 })
  }

  try {
    await ensureSchema()
    const { rows } = await pool.query(
      `INSERT INTO portal.gestor_alerts
         (user_id, account_id, account_name, metric, condition, threshold, telegram_chat_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [
        session.userId,
        account_id,
        typeof account_name === 'string' ? account_name : '',
        metric,
        condition,
        thresh,
        typeof telegram_chat_id === 'string' ? telegram_chat_id : (process.env.TELEGRAM_CHAT_ID ?? ''),
      ]
    )
    return NextResponse.json(rows[0], { status: 201 })
  } catch (err) {
    console.error('[gestor/alertas POST]', err)
    return NextResponse.json({ error: 'Erro ao criar alerta' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const session = getSession(req)
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const id = parseInt(req.nextUrl.searchParams.get('id') ?? '', 10)
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
  }

  try {
    await ensureSchema()
    const result = await pool.query(
      `DELETE FROM portal.gestor_alerts WHERE id = $1 AND user_id = $2`,
      [id, session.userId]
    )
    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Alerta não encontrado' }, { status: 404 })
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[gestor/alertas DELETE]', err)
    return NextResponse.json({ error: 'Erro ao remover alerta' }, { status: 500 })
  }
}

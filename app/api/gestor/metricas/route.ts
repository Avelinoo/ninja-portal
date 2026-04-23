import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function validateDate(s: string | null): string | null {
  if (!s) return null
  return DATE_RE.test(s) ? s : null
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const accountId = searchParams.get('accountId') ?? searchParams.get('account_id')
  const from      = validateDate(searchParams.get('from'))
  const to        = validateDate(searchParams.get('to'))
  const maximum   = searchParams.get('maximum') === 'true'
  const days      = Math.min(Math.max(0, parseInt(searchParams.get('days') ?? '0')), 365)

  const conditions: string[] = []
  const values: unknown[] = []
  let i = 1

  if (accountId) { conditions.push(`m.account_id = $${i++}`); values.push(accountId) }
  if (to)        { conditions.push(`m.date <= $${i++}`); values.push(to) }
  if (from && !maximum) { conditions.push(`m.date >= $${i++}`); values.push(from) }
  if (days > 0 && !from && !maximum) {
    conditions.push(`m.date >= CURRENT_DATE - INTERVAL '${days} days'`)
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

  try {
    const { rows } = await pool.query(
      `SELECT
         m.account_id,
         COALESCE(aa.account_name, m.account_id)  AS account_name,
         m.date,
         COALESCE(m.spend::float, 0)              AS spend,
         COALESCE(m.impressions::int, 0)          AS impressions,
         COALESCE(m.clicks::int, 0)               AS clicks,
         COALESCE(m.reach::int, 0)                AS reach,
         COALESCE(m.ctr::float, 0)                AS ctr,
         COALESCE(m.cpc::float, 0)                AS cpc,
         COALESCE(m.cpm::float, 0)                AS cpm,
         COALESCE(m.result_count::int, 0)         AS result_count,
         COALESCE(m.cost_per_result::float, 0)    AS cost_per_result,
         COALESCE(m.conversions::int, 0)          AS conversions,
         COALESCE(m.active_campaigns::int, 0)     AS active_campaigns,
         COALESCE(m.paused_campaigns::int, 0)     AS paused_campaigns,
         COALESCE(m.result_type, '')              AS result_type,
         COALESCE(m.result_label, 'Resultados')   AS result_label
       FROM daily_account_metrics m
       LEFT JOIN ad_accounts aa ON aa.account_id = m.account_id
       ${where}
       ORDER BY m.account_id, m.date ASC`,
      values
    )
    return NextResponse.json(rows)
  } catch (err) {
    console.error('[gestor/metricas]', err)
    return NextResponse.json({ error: 'Erro ao buscar métricas' }, { status: 500 })
  }
}

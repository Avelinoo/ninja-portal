import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const validateDate = (s: string | null) => s && DATE_RE.test(s) ? s : null

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const accountId = searchParams.get('accountId') ?? searchParams.get('account_id')
  const from      = validateDate(searchParams.get('from'))
  const to        = validateDate(searchParams.get('to'))
  const maximum   = searchParams.get('maximum') === 'true'

  const conditions: string[] = []
  const values: unknown[] = []
  let i = 1

  if (accountId) { conditions.push(`account_id = $${i++}`); values.push(accountId) }
  if (to)        { conditions.push(`snapshot_date <= $${i++}`); values.push(to) }
  if (from && !maximum) { conditions.push(`snapshot_date >= $${i++}`); values.push(from) }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

  try {
    const { rows } = await pool.query(
      `SELECT
         account_id, campaign_id, campaign_name, objective, status,
         daily_budget::float        AS daily_budget,
         lifetime_budget::float     AS lifetime_budget,
         budget_remaining::float    AS budget_remaining,
         COALESCE(spend::float, 0)            AS spend,
         COALESCE(impressions::int, 0)        AS impressions,
         COALESCE(clicks::int, 0)             AS clicks,
         COALESCE(reach::int, 0)              AS reach,
         COALESCE(ctr::float, 0)              AS ctr,
         COALESCE(cpc::float, 0)              AS cpc,
         COALESCE(cpm::float, 0)              AS cpm,
         COALESCE(result_count::int, 0)       AS result_count,
         COALESCE(cost_per_result::float, 0)  AS cost_per_result,
         COALESCE(conversions::int, 0)        AS conversions,
         COALESCE(result_type, '')            AS result_type,
         COALESCE(result_label, 'Resultados') AS result_label,
         snapshot_date
       FROM campaign_snapshots
       ${where}
       ORDER BY snapshot_date DESC, spend DESC`,
      values
    )
    return NextResponse.json(rows)
  } catch (err) {
    console.error('[gestor/campanhas]', err)
    return NextResponse.json({ error: 'Erro ao buscar campanhas' }, { status: 500 })
  }
}

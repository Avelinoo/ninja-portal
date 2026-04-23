import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const accountId = searchParams.get('accountId') ?? searchParams.get('account_id')
  const from      = searchParams.get('from')
  const to        = searchParams.get('to')
  const maximum   = searchParams.get('maximum') === 'true'
  const days      = parseInt(searchParams.get('days') ?? '0')

  const conditions: string[] = []
  const values: unknown[] = []
  let i = 1

  if (accountId) { conditions.push(`account_id = $${i++}`); values.push(accountId) }
  if (to)        { conditions.push(`date <= $${i++}`);       values.push(to) }
  if (from && !maximum) { conditions.push(`date >= $${i++}`); values.push(from) }
  if (days > 0 && !from && !maximum) {
    conditions.push(`date >= CURRENT_DATE - INTERVAL '${Math.min(days, 365)} days'`)
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

  const { rows } = await pool.query(
    `SELECT
       account_id,
       COALESCE(account_name, account_id)         AS account_name,
       date,
       COALESCE(spend::float, 0)                  AS spend,
       COALESCE(impressions::int, 0)              AS impressions,
       COALESCE(clicks::int, 0)                   AS clicks,
       COALESCE(reach::int, 0)                    AS reach,
       COALESCE(ctr::float, 0)                    AS ctr,
       COALESCE(cpc::float, 0)                    AS cpc,
       COALESCE(cpm::float, 0)                    AS cpm,
       COALESCE(result_count::int, 0)             AS result_count,
       COALESCE(cost_per_result::float, 0)        AS cost_per_result,
       COALESCE(conversions::int, 0)              AS conversions,
       COALESCE(active_campaigns::int, 0)         AS active_campaigns,
       COALESCE(paused_campaigns::int, 0)         AS paused_campaigns,
       COALESCE(result_type, '')                   AS result_type,
       COALESCE(result_label, 'Resultados')        AS result_label
     FROM daily_account_metrics
     ${where}
     ORDER BY account_id, date ASC`,
    values
  )
  return NextResponse.json(rows)
}

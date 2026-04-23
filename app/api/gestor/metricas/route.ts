import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const accountId = searchParams.get('account_id')
  const days = Math.min(parseInt(searchParams.get('days') ?? '7'), 90)

  const conditions = [`date >= CURRENT_DATE - INTERVAL '${days} days'`]
  const values: unknown[] = []

  if (accountId) {
    conditions.push(`account_id = $1`)
    values.push(accountId)
  }

  const { rows } = await pool.query(
    `SELECT
       account_id, account_name, date,
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
       COALESCE(active_campaigns::int, 0)   AS active_campaigns
     FROM daily_account_metrics
     WHERE ${conditions.join(' AND ')}
     ORDER BY account_id, date ASC`,
    values
  )
  return NextResponse.json(rows)
}

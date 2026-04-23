import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const accountId = searchParams.get('account_id')
  const date = searchParams.get('date') // YYYY-MM-DD, default yesterday

  const targetDate = date ?? `(CURRENT_DATE - INTERVAL '1 day')::date`
  const conditions: string[] = []
  const values: unknown[] = []

  if (date) {
    conditions.push(`date = $${values.length + 1}`)
    values.push(date)
  } else {
    conditions.push(`date = (CURRENT_DATE - INTERVAL '1 day')::date`)
  }

  if (accountId) {
    conditions.push(`account_id = $${values.length + 1}`)
    values.push(accountId)
  }

  const { rows } = await pool.query(
    `SELECT
       account_id, campaign_id, campaign_name, status, date,
       COALESCE(spend::float, 0)            AS spend,
       COALESCE(impressions::int, 0)        AS impressions,
       COALESCE(clicks::int, 0)             AS clicks,
       COALESCE(ctr::float, 0)              AS ctr,
       COALESCE(cpc::float, 0)              AS cpc,
       COALESCE(cpm::float, 0)              AS cpm,
       COALESCE(result_count::int, 0)       AS result_count,
       COALESCE(cost_per_result::float, 0)  AS cost_per_result,
       COALESCE(conversions::int, 0)        AS conversions
     FROM campaign_snapshots
     WHERE ${conditions.join(' AND ')}
     ORDER BY spend DESC`,
    values
  )
  return NextResponse.json(rows)
}

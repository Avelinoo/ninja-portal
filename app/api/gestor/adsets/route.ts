import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const vd = (s: string | null) => s && DATE_RE.test(s) ? s : null

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const accountId  = searchParams.get('accountId')
  const campaignId = searchParams.get('campaignId')
  const from       = vd(searchParams.get('from'))
  const to         = vd(searchParams.get('to'))
  const maximum    = searchParams.get('maximum') === 'true'

  const conds: string[] = []
  const vals: unknown[] = []
  let i = 1
  if (accountId)            { conds.push(`account_id = $${i++}`);   vals.push(accountId) }
  if (campaignId)           { conds.push(`campaign_id = $${i++}`);  vals.push(campaignId) }
  if (to)                   { conds.push(`snapshot_date <= $${i++}`); vals.push(to) }
  if (from && !maximum)     { conds.push(`snapshot_date >= $${i++}`); vals.push(from) }

  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : ''

  try {
    const { rows } = await pool.query(
      `SELECT
         account_id, campaign_id, adset_id, adset_name, status,
         optimization_goal,
         COALESCE(spend::float, 0)           AS spend,
         COALESCE(impressions::int, 0)       AS impressions,
         COALESCE(clicks::int, 0)            AS clicks,
         COALESCE(reach::int, 0)             AS reach,
         COALESCE(ctr::float, 0)             AS ctr,
         COALESCE(cpc::float, 0)             AS cpc,
         COALESCE(result_count::int, 0)      AS result_count,
         COALESCE(cost_per_result::float, 0) AS cost_per_result,
         snapshot_date
       FROM adset_snapshots ${where}
       ORDER BY snapshot_date DESC, spend DESC`,
      vals
    )
    return NextResponse.json(rows)
  } catch (err) {
    console.error('[gestor/adsets]', err)
    return NextResponse.json({ error: 'Erro ao buscar conjuntos' }, { status: 500 })
  }
}

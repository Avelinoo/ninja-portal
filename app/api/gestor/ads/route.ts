import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const vd = (s: string | null) => s && DATE_RE.test(s) ? s : null

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const accountId  = searchParams.get('accountId')
  const campaignId = searchParams.get('campaignId')
  const adsetId    = searchParams.get('adsetId')
  const from       = vd(searchParams.get('from'))
  const to         = vd(searchParams.get('to'))
  const maximum    = searchParams.get('maximum') === 'true'

  const conds: string[] = []
  const vals: unknown[] = []
  let i = 1
  if (accountId)        { conds.push(`account_id = $${i++}`);  vals.push(accountId) }
  if (campaignId)       { conds.push(`campaign_id = $${i++}`); vals.push(campaignId) }
  if (adsetId)          { conds.push(`adset_id = $${i++}`);    vals.push(adsetId) }
  if (to)               { conds.push(`snapshot_date <= $${i++}`); vals.push(to) }
  if (from && !maximum) { conds.push(`snapshot_date >= $${i++}`); vals.push(from) }

  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : ''

  try {
    const { rows } = await pool.query(
      `SELECT
         account_id, campaign_id, adset_id, ad_id,
         MAX(ad_name) AS ad_name,
         (SELECT status FROM ad_snapshots s2
          WHERE s2.ad_id = s.ad_id
          ORDER BY s2.snapshot_date DESC LIMIT 1) AS status,
         SUM(COALESCE(spend::float, 0))     AS spend,
         SUM(COALESCE(impressions::int, 0)) AS impressions,
         SUM(COALESCE(clicks::int, 0))      AS clicks,
         SUM(COALESCE(result_count::int, 0)) AS result_count,
         CASE WHEN SUM(impressions::int) > 0
              THEN SUM(clicks::int)::float / SUM(impressions::int) * 100
              ELSE 0 END AS ctr,
         CASE WHEN SUM(clicks::int) > 0
              THEN SUM(spend::float) / SUM(clicks::int)
              ELSE 0 END AS cpc,
         CASE WHEN SUM(result_count::int) > 0
              THEN SUM(spend::float) / SUM(result_count::int)
              ELSE 0 END AS cost_per_result,
         MAX(snapshot_date) AS snapshot_date
       FROM ad_snapshots s ${where}
       GROUP BY account_id, campaign_id, adset_id, ad_id
       ORDER BY spend DESC`,
      vals
    )
    return NextResponse.json(rows)
  } catch (err) {
    console.error('[gestor/ads]', err)
    return NextResponse.json({ error: 'Erro ao buscar anúncios' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'

import GestorDashboard from './GestorDashboard'
import pool from '@/lib/db'

async function getContas() {
  try {
    const { rows } = await pool.query(`
      SELECT m.account_id, COALESCE(aa.account_name, m.account_id) AS account_name
      FROM (SELECT DISTINCT account_id FROM daily_account_metrics) m
      LEFT JOIN ad_accounts aa USING (account_id)
      ORDER BY COALESCE(aa.account_name, m.account_id)
    `)
    return rows as { account_id: string; account_name: string }[]
  } catch {
    return []
  }
}

export default async function GestorPage() {
  const contas = await getContas()
  return <GestorDashboard contas={contas} />
}

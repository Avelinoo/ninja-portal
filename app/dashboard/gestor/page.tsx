export const dynamic = 'force-dynamic'

import GestorDashboard from './GestorDashboard'
import pool from '@/lib/db'

async function getContas() {
  try {
    const { rows } = await pool.query(`
      SELECT DISTINCT account_id, MAX(COALESCE(account_name, account_id)) AS account_name
      FROM daily_account_metrics
      GROUP BY account_id
      ORDER BY MAX(COALESCE(account_name, account_id))
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

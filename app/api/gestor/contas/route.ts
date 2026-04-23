import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET() {
  try {
    const { rows } = await pool.query(`
      SELECT m.account_id, COALESCE(aa.account_name, m.account_id) AS account_name
      FROM (SELECT DISTINCT account_id FROM daily_account_metrics) m
      LEFT JOIN ad_accounts aa USING (account_id)
      ORDER BY COALESCE(aa.account_name, m.account_id)
    `)
    return NextResponse.json(rows)
  } catch (err) {
    console.error('[gestor/contas]', err)
    return NextResponse.json({ error: 'Erro ao buscar contas' }, { status: 500 })
  }
}

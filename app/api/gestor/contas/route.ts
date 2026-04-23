import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET() {
  const { rows } = await pool.query(`
    SELECT DISTINCT account_id, MAX(account_name) as account_name
    FROM daily_account_metrics
    GROUP BY account_id
    ORDER BY MAX(account_name)
  `)
  return NextResponse.json(rows)
}

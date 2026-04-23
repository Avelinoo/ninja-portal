import { Pool } from 'pg'
import bcrypt from 'bcryptjs'

declare global {
  // eslint-disable-next-line no-var
  var _ninjaPool: Pool | undefined
  var _ninjaDbReady: boolean | undefined
}

function getPool(): Pool {
  if (!global._ninjaPool) {
    global._ninjaPool = new Pool({ connectionString: process.env.DATABASE_URL })
  }
  return global._ninjaPool
}

export default getPool()

export async function ensureSchema(): Promise<void> {
  if (global._ninjaDbReady) return
  const pool = getPool()

  await pool.query(`CREATE SCHEMA IF NOT EXISTS portal`)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS portal.users (
      id        SERIAL PRIMARY KEY,
      username  VARCHAR(50)  UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role      VARCHAR(20)  NOT NULL DEFAULT 'user',
      is_active BOOLEAN      NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)

  // Seed default admin — runs only if row doesn't exist yet
  const adminPass = process.env.ADMIN_PASSWORD ?? 'Avelino@123'
  const { rowCount } = await pool.query(
    `SELECT 1 FROM portal.users WHERE username = 'admin' LIMIT 1`
  )
  if (!rowCount) {
    const hash = await bcrypt.hash(adminPass, 10)
    await pool.query(
      `INSERT INTO portal.users (username, password_hash, role) VALUES ('admin', $1, 'admin')`,
      [hash]
    )
  }

  global._ninjaDbReady = true
}

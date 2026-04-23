import { Pool } from 'pg'
import bcrypt from 'bcryptjs'

declare global {
  // eslint-disable-next-line no-var
  var _ninjaPool: Pool | undefined
  var _ninjaDbReady: boolean | undefined
}

function getPool(): Pool {
  if (!global._ninjaPool) {
    if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL não definida')
    global._ninjaPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      // Evita que pg logue a connection string (com senha) em erros
      log: undefined,
    })
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

  await pool.query(`
    CREATE TABLE IF NOT EXISTS portal.audit_log (
      id        SERIAL PRIMARY KEY,
      actor_id  INTEGER REFERENCES portal.users(id),
      action    VARCHAR(50) NOT NULL,
      target    VARCHAR(100),
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS portal.gestor_alerts (
      id               SERIAL PRIMARY KEY,
      user_id          INTEGER REFERENCES portal.users(id) ON DELETE CASCADE,
      account_id       VARCHAR(50)  NOT NULL,
      account_name     VARCHAR(255) DEFAULT '',
      metric           VARCHAR(30)  NOT NULL,
      condition        VARCHAR(10)  NOT NULL,
      threshold        DECIMAL(12,4) NOT NULL,
      telegram_chat_id VARCHAR(50)  DEFAULT '',
      is_active        BOOLEAN      NOT NULL DEFAULT true,
      last_triggered   TIMESTAMPTZ,
      created_at       TIMESTAMPTZ DEFAULT NOW()
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

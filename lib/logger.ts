// Logger estruturado — JSON em produção, legível em dev
// Mascara automaticamente campos sensíveis antes de qualquer escrita

const SENSITIVE_KEYS = /password|secret|token|authorization|cookie|database_url/i

function mask(obj: unknown, depth = 0): unknown {
  if (depth > 5 || obj === null || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(v => mask(v, depth + 1))
  return Object.fromEntries(
    Object.entries(obj as Record<string, unknown>).map(([k, v]) => [
      k,
      SENSITIVE_KEYS.test(k) ? '[REDACTED]' : mask(v, depth + 1),
    ])
  )
}

type Level = 'debug' | 'info' | 'warn' | 'error'

function log(level: Level, message: string, meta?: Record<string, unknown>) {
  if (level === 'debug' && process.env.NODE_ENV === 'production') return

  const entry = {
    ts: new Date().toISOString(),
    level,
    message,
    ...(meta ? (mask(meta) as object) : {}),
  }

  const out = process.env.NODE_ENV === 'production'
    ? JSON.stringify(entry)
    : `[${level.toUpperCase()}] ${message}${meta ? ' ' + JSON.stringify(mask(meta)) : ''}`

  if (level === 'error' || level === 'warn') {
    console.error(out)
  } else {
    console.log(out)
  }
}

export const logger = {
  debug: (msg: string, meta?: Record<string, unknown>) => log('debug', msg, meta),
  info:  (msg: string, meta?: Record<string, unknown>) => log('info',  msg, meta),
  warn:  (msg: string, meta?: Record<string, unknown>) => log('warn',  msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => log('error', msg, meta),
}

const store = new Map<string, { count: number; resetAt: number }>()

export function checkRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now()
  const entry = store.get(key)
  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs }
  }
  entry.count++
  const allowed = entry.count <= limit
  return { allowed, remaining: Math.max(0, limit - entry.count), resetAt: entry.resetAt }
}

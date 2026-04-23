// Web Crypto version for Edge runtime (middleware)
// Usa o mesmo formato de assinatura que session.ts: HMAC-SHA256 em HEX
const encoder = new TextEncoder()

async function hmacHex(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(data))
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function verifySessionEdge(token: string, secret: string): Promise<boolean> {
  try {
    const dot = token.lastIndexOf('.')
    if (dot === -1) return false
    const data = token.slice(0, dot)
    const sig  = token.slice(dot + 1)
    const expected = await hmacHex(secret, data)
    if (expected.length !== sig.length) return false
    // comparação em tempo constante
    let diff = 0
    for (let i = 0; i < expected.length; i++) {
      diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i)
    }
    return diff === 0
  } catch {
    return false
  }
}

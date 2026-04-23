// Web Crypto version for Edge runtime (middleware)
const encoder = new TextEncoder()

function toBase64Url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function fromBase64Url(str: string): Uint8Array {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/').padEnd(
    str.length + ((4 - (str.length % 4)) % 4), '='
  )
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

async function hmacSign(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(data))
  return toBase64Url(sig)
}

export async function verifySessionEdge(token: string, secret: string): Promise<boolean> {
  try {
    const dot = token.lastIndexOf('.')
    if (dot === -1) return false
    const data = token.slice(0, dot)
    const sig = token.slice(dot + 1)
    const expected = await hmacSign(secret, data)
    // constant-time compare
    const ka = await crypto.subtle.importKey('raw', encoder.encode('__ts__'), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
    const [a, b] = await Promise.all([
      crypto.subtle.sign('HMAC', ka, encoder.encode(expected)),
      crypto.subtle.sign('HMAC', ka, encoder.encode(sig)),
    ])
    const ba = new Uint8Array(a); const bb = new Uint8Array(b)
    if (ba.length !== bb.length) return false
    let diff = 0
    for (let i = 0; i < ba.length; i++) diff |= ba[i] ^ bb[i]
    return diff === 0
  } catch {
    return false
  }
}

export function decodeSessionEdge(token: string): { userId: number; username: string; role: string } | null {
  try {
    const dot = token.lastIndexOf('.')
    if (dot === -1) return null
    const data = token.slice(0, dot)
    return JSON.parse(new TextDecoder().decode(fromBase64Url(data)))
  } catch {
    return null
  }
}

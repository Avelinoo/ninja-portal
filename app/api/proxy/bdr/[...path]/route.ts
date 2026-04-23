import { NextRequest, NextResponse } from 'next/server'

const BDR_BASE = process.env.BDR_API_URL ?? 'http://10.0.1.11:8001'
const BDR_TOKEN = process.env.BDR_API_TOKEN ?? 'bdr2026avelon'

// Allowlist de prefixos permitidos — evita SSRF para serviços internos arbitrários
const ALLOWED_PREFIXES = ['leads', 'export', 'import', 'health', 'ready']

async function proxy(req: NextRequest, params: { path: string[] }) {
  const path = params.path.join('/')
  // Rejeita path traversal e prefixos não permitidos
  if (path.includes('..') || !ALLOWED_PREFIXES.some(p => path.startsWith(p))) {
    return new NextResponse('Not found', { status: 404 })
  }
  const search = req.nextUrl.search
  const url = `${BDR_BASE}/${path}${search}`

  const headers: Record<string, string> = {
    Authorization: `Bearer ${BDR_TOKEN}`,
    'Content-Type': 'application/json',
  }

  const body = req.method !== 'GET' && req.method !== 'HEAD'
    ? await req.text()
    : undefined

  const upstream = await fetch(url, { method: req.method, headers, body })
  const data = await upstream.text()

  return new NextResponse(data, {
    status: upstream.status,
    headers: { 'Content-Type': upstream.headers.get('Content-Type') ?? 'application/json' },
  })
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, await params)
}
export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, await params)
}
export async function PUT(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, await params)
}
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, await params)
}

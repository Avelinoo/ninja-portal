import { NextRequest, NextResponse } from 'next/server'

const API = process.env.BDR_API_URL!
const TOKEN = process.env.BDR_API_TOKEN!

// Allowlist explícita — impede path traversal e endpoints não autorizados
const ALLOWED_TIPOS = new Set(['csv', 'json', 'whatsapp'])

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tipo: string }> },
) {
  const { tipo } = await params

  if (!ALLOWED_TIPOS.has(tipo)) {
    return NextResponse.json({ error: 'Tipo de export inválido' }, { status: 400 })
  }

  const search = req.nextUrl.searchParams.toString()
  const url = `${API}/export/${tipo}${search ? `?${search}` : ''}`

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  })

  if (!res.ok) {
    return NextResponse.json(
      { error: 'Erro ao buscar dados para exportação' },
      { status: res.status },
    )
  }

  if (tipo === 'csv') {
    const blob = await res.blob()
    return new NextResponse(blob, {
      status: res.status,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="leads.csv"',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  }

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}

import { NextRequest, NextResponse } from 'next/server'

const API = process.env.BDR_API_URL!
const TOKEN = process.env.BDR_API_TOKEN!

const headers = () => ({ Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' })

export async function GET(req: NextRequest) {
  try {
    const qs = req.nextUrl.searchParams.toString()
    const res = await fetch(`${API}/leads/?${qs}`, { headers: headers() })
    const text = await res.text()
    const data = JSON.parse(text)
    return NextResponse.json(data, { status: res.status })
  } catch (e) {
    return NextResponse.json({ error: 'Erro ao conectar com a API' }, { status: 502 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const res = await fetch(`${API}/leads/gerar`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(body),
    })
    const text = await res.text()
    const data = JSON.parse(text)
    return NextResponse.json(data, { status: res.status })
  } catch (e) {
    return NextResponse.json({ error: 'Erro ao conectar com a API' }, { status: 502 })
  }
}

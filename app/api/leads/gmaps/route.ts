import { NextRequest, NextResponse } from 'next/server'

const API = process.env.BDR_API_URL!
const TOKEN = process.env.BDR_API_TOKEN!
const GMAPS_KEY = process.env.GOOGLE_MAPS_KEY!

const PLACES_URL = 'https://maps.googleapis.com/maps/api/place'

async function buscarLugares(query: string, pageToken?: string) {
  const params = new URLSearchParams({ query, key: GMAPS_KEY, language: 'pt-BR' })
  if (pageToken) params.set('pagetoken', pageToken)
  const r = await fetch(`${PLACES_URL}/textsearch/json?${params}`)
  return r.json()
}

async function buscarDetalhes(placeId: string) {
  const params = new URLSearchParams({
    place_id: placeId,
    fields: 'name,formatted_address,formatted_phone_number,website',
    key: GMAPS_KEY,
    language: 'pt-BR',
  })
  const r = await fetch(`${PLACES_URL}/details/json?${params}`)
  const data = await r.json()
  return data.result || {}
}

function extrairUF(endereco: string): string {
  const m = endereco.match(/\b([A-Z]{2}),\s*Brazil/)
  return m ? m[1] : ''
}

function extrairCidade(endereco: string): string {
  const partes = endereco.split(',')
  return partes.length >= 3 ? partes[partes.length - 3].trim() : ''
}

async function salvarLead(lugar: any, detalhes: any, uf: string, tipo: string) {
  const placeId = lugar.place_id || ''
  const cnpj = `GMAPS${placeId.slice(0, 9).toUpperCase()}`
  const endereco = lugar.formatted_address || ''

  const body = {
    cnpj,
    razao_social: lugar.name || '',
    nome_fantasia: lugar.name || '',
    cnae: '0000000',
    descricao_cnae: tipo,
    telefone: detalhes.formatted_phone_number || null,
    email: null,
    uf: extrairUF(endereco) || uf,
    municipio_nome: extrairCidade(endereco) || null,
    porte: 'N/INF',
    data_abertura: null,
    status: 'novo',
  }

  try {
    const r = await fetch(`${API}/leads/inserir`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    return r.ok
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const rawTipo: unknown = body.tipo
    const rawCidade: unknown = body.cidade
    const rawUf: unknown = body.uf
    const rawLimite: unknown = body.limite

    if (typeof rawTipo !== 'string' || typeof rawCidade !== 'string') {
      return NextResponse.json({ error: 'tipo e cidade são obrigatórios' }, { status: 400 })
    }

    // Sanitiza: só alfanumérico, espaço e hífen — evita injeção em query string
    const tipo   = rawTipo.replace(/[^a-zA-ZÀ-ÿ0-9 \-]/g, '').trim().slice(0, 80)
    const cidade = rawCidade.replace(/[^a-zA-ZÀ-ÿ0-9 \-]/g, '').trim().slice(0, 80)
    const uf     = typeof rawUf === 'string' ? rawUf.replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 2) : ''
    const limite = Math.min(Math.max(1, Number(rawLimite) || 100), 500)

    if (!tipo || !cidade) {
      return NextResponse.json({ error: 'tipo e cidade inválidos' }, { status: 400 })
    }

    const query = `${tipo} ${cidade}`
    let inseridos = 0
    let pageToken: string | undefined
    let pagina = 0

    while (inseridos < limite && pagina < 3) {
      if (pagina > 0 && pageToken) {
        await new Promise(r => setTimeout(r, 2000))
      }

      const data = await buscarLugares(query, pageToken)

      if (!['OK', 'ZERO_RESULTS'].includes(data.status)) {
        return NextResponse.json({ error: `Google Maps: ${data.status}` }, { status: 502 })
      }

      const resultados: any[] = data.results || []
      if (!resultados.length) break

      for (const lugar of resultados) {
        if (inseridos >= limite) break
        const detalhes = await buscarDetalhes(lugar.place_id)
        await new Promise(r => setTimeout(r, 150))
        const ok = await salvarLead(lugar, detalhes, uf, tipo)
        if (ok) inseridos++
      }

      pageToken = data.next_page_token
      if (!pageToken) break
      pagina++
    }

    return NextResponse.json({ inseridos, duplicados: 0, total_gerado: inseridos })
  } catch (e) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

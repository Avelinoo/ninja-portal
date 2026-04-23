'use client'

import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface Conta { account_id: string; account_name: string }
interface Campanha {
  campaign_id: string; campaign_name: string; status: string
  spend: number; impressions: number; clicks: number
  ctr: number; cpc: number; cpm: number; result_count: number; cost_per_result: number
}

const fmt_brl = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const fmt_pct = (v: number) => `${v.toFixed(2)}%`

function Trend({ value, good }: { value: number; good: 'high' | 'low' }) {
  if (value === 0) return <Minus size={12} className="text-gray-400" />
  const positive = good === 'high' ? value > 0 : value < 0
  return positive
    ? <TrendingUp size={12} className="text-green-500" />
    : <TrendingDown size={12} className="text-red-500" />
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-700',
    PAUSED: 'bg-yellow-100 text-yellow-700',
    ARCHIVED: 'bg-gray-100 text-gray-500',
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[status] ?? 'bg-gray-100 text-gray-500'}`}>
      {status === 'ACTIVE' ? 'Ativa' : status === 'PAUSED' ? 'Pausada' : status}
    </span>
  )
}

export default function CampanhasPage() {
  const [contas, setContas] = useState<Conta[]>([])
  const [contaSel, setContaSel] = useState('')
  const [campanhas, setCampanhas] = useState<Campanha[]>([])
  const [loading, setLoading] = useState(false)
  const [sortBy, setSortBy] = useState<keyof Campanha>('spend')

  useEffect(() => {
    fetch('/api/gestor/contas').then(r => r.json()).then((d: Conta[]) => {
      setContas(d)
      if (d.length) setContaSel(d[0].account_id)
    })
  }, [])

  const loadCampanhas = useCallback(async () => {
    if (!contaSel) return
    setLoading(true)
    const res = await fetch(`/api/gestor/campanhas?account_id=${contaSel}`)
    setCampanhas(await res.json())
    setLoading(false)
  }, [contaSel])

  useEffect(() => { loadCampanhas() }, [loadCampanhas])

  const sorted = [...campanhas].sort((a, b) => (b[sortBy] as number) - (a[sortBy] as number))

  const headers: { key: keyof Campanha; label: string }[] = [
    { key: 'campaign_name', label: 'Campanha' },
    { key: 'status',        label: 'Status' },
    { key: 'spend',         label: 'Gasto' },
    { key: 'impressions',   label: 'Impressões' },
    { key: 'clicks',        label: 'Cliques' },
    { key: 'ctr',           label: 'CTR' },
    { key: 'cpc',           label: 'CPC' },
    { key: 'cpm',           label: 'CPM' },
    { key: 'result_count',  label: 'Resultados' },
    { key: 'cost_per_result', label: 'CPR' },
  ]

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>Campanhas</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Métricas de ontem por campanha</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={contaSel}
            onChange={e => setContaSel(e.target.value)}
            className="px-3 py-2 rounded-lg border text-sm outline-none"
            style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
          >
            {contas.map(c => (
              <option key={c.account_id} value={c.account_id}>{c.account_name || c.account_id}</option>
            ))}
          </select>
          <button
            onClick={loadCampanhas}
            disabled={loading}
            className="p-2 rounded-lg border transition-colors hover:bg-gray-50 disabled:opacity-60"
            style={{ borderColor: 'var(--border)' }}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        {loading ? (
          <div className="flex items-center justify-center py-16 text-sm" style={{ color: 'var(--text-muted)' }}>
            <RefreshCw size={16} className="animate-spin mr-2" /> Carregando campanhas...
          </div>
        ) : campanhas.length === 0 ? (
          <div className="py-16 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
            Nenhuma campanha com dados para ontem.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}>
                  {headers.map(h => (
                    <th
                      key={h.key}
                      onClick={() => h.key !== 'campaign_name' && h.key !== 'status' && setSortBy(h.key)}
                      className={`px-4 py-3 text-left text-xs font-semibold whitespace-nowrap ${h.key !== 'campaign_name' && h.key !== 'status' ? 'cursor-pointer hover:text-[#19a66a]' : ''}`}
                      style={{ color: sortBy === h.key ? 'var(--brand)' : 'var(--text-muted)' }}
                    >
                      {h.label} {sortBy === h.key ? '↓' : ''}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map(c => (
                  <tr key={c.campaign_id} className="border-b last:border-0 hover:bg-gray-50 transition-colors" style={{ borderColor: 'var(--border)' }}>
                    <td className="px-4 py-3 font-medium max-w-[200px] truncate" style={{ color: 'var(--foreground)' }} title={c.campaign_name}>
                      {c.campaign_name}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                    <td className="px-4 py-3 font-medium" style={{ color: '#19a66a' }}>{fmt_brl(c.spend)}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>{c.impressions.toLocaleString('pt-BR')}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>{c.clicks.toLocaleString('pt-BR')}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Trend value={c.ctr - 1} good="high" />
                        <span className={c.ctr >= 1 ? 'text-green-600' : c.ctr >= 0.5 ? 'text-yellow-600' : 'text-red-600'}>
                          {fmt_pct(c.ctr)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>{fmt_brl(c.cpc)}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>{fmt_brl(c.cpm)}</td>
                    <td className="px-4 py-3 font-medium" style={{ color: 'var(--foreground)' }}>{c.result_count.toLocaleString('pt-BR')}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>{fmt_brl(c.cost_per_result)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

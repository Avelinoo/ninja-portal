'use client'

import { useState, useEffect, useCallback } from 'react'
import { RefreshCw } from 'lucide-react'
import DrilldownTable, { type Row } from '@/components/gestor/DrilldownTable'
import DateRangePicker from '@/components/gestor/DateRangePicker'
import { type PresetPeriod, type DateRange } from '@/lib/gestor/types'
import { getPresetRange } from '@/lib/gestor/utils'

interface Conta { account_id: string; account_name: string }

export default function CampanhasPage() {
  const [contas, setContas]     = useState<Conta[]>([])
  const [contaSel, setContaSel] = useState('')
  const [rows, setRows]         = useState<Row[]>([])
  const [loading, setLoading]   = useState(false)
  const [period, setPeriod]     = useState<PresetPeriod>('30d')
  const [customRange, setCustomRange] = useState<DateRange>(getPresetRange('30d'))

  const activeRange = period === 'custom' ? customRange : getPresetRange(period)
  const maximum     = period === 'maximum'

  useEffect(() => {
    fetch('/api/gestor/contas').then(r => r.json()).then((d: Conta[]) => {
      setContas(d)
      if (d.length) setContaSel(d[0].account_id)
    })
  }, [])

  const load = useCallback(async () => {
    if (!contaSel) return
    setLoading(true)
    const p = new URLSearchParams({ accountId: contaSel, to: activeRange.to })
    if (maximum) p.set('maximum', 'true')
    else p.set('from', activeRange.from)

    type CampRow = Record<string, unknown>
    // Data já vem agregada (SUM por campaign_id) — sem deduplication necessária
    const data: CampRow[] = await fetch(`/api/gestor/campanhas?${p}`).then(r => r.json()).catch(() => [])

    const mapped: Row[] = data.map(r => ({
      id:              String(r.campaign_id),
      name:            String(r.campaign_name || r.campaign_id),
      status:          String(r.status ?? ''),
      spend:           Number(r.spend) || 0,
      impressions:     Number(r.impressions) || 0,
      clicks:          Number(r.clicks) || 0,
      ctr:             Number(r.ctr) || 0,
      cpc:             Number(r.cpc) || 0,
      cpm:             Number(r.impressions) > 0 ? (Number(r.spend) / Number(r.impressions)) * 1000 : 0,
      result_count:    Number(r.result_count) || 0,
      cost_per_result: Number(r.cost_per_result) || 0,
      level:           'campaign' as const,
    }))

    setRows(mapped)
    setLoading(false)
  }, [contaSel, activeRange.from, activeRange.to, maximum]) // eslint-disable-line

  useEffect(() => { load() }, [load])

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>Campanhas</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Clique numa linha para ver conjuntos e anúncios
          </p>
        </div>
        <div className="flex items-center gap-2">
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
          <DateRangePicker
            period={period}
            customRange={customRange}
            onChange={(p, r) => { setPeriod(p); setCustomRange(r) }}
          />
          <button
            onClick={load}
            disabled={loading}
            className="p-2 rounded-lg border transition-colors hover:bg-gray-50 disabled:opacity-50"
            style={{ borderColor: 'var(--border)' }}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw size={20} className="animate-spin mr-2" style={{ color: 'var(--text-muted)' }} />
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Carregando campanhas...</span>
        </div>
      ) : (
        <DrilldownTable
          campaigns={rows}
          accountId={contaSel}
          from={activeRange.from}
          to={activeRange.to}
          maximum={maximum}
        />
      )}
    </div>
  )
}

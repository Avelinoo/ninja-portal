'use client'

import React, { useState, useCallback } from 'react'
import { ChevronRight, ChevronDown, Loader2 } from 'lucide-react'

/* ─────────────────── types ─────────────────── */
export interface Row {
  id: string
  name: string
  status: string
  spend: number | null
  impressions: number | null
  clicks: number | null
  ctr: number | null
  cpc: number | null
  cpm?: number | null
  result_count: number | null
  cost_per_result: number | null
  level: 'campaign' | 'adset' | 'ad'
  campaign_id?: string
  adset_id?: string
  hasData?: boolean  // flag: false = row existe na DB mas sem métricas no período
}

type SortKey = keyof Omit<Row, 'id' | 'name' | 'status' | 'level' | 'campaign_id' | 'adset_id'>

/* ─────────────────── helpers ─────────────────── */
// Mostra valor formatado; null/undefined → "—"; 0 → "R$ 0,00" / "0" / "0,00%"
const brl = (v: number | null | undefined) => {
  if (v == null) return '—'
  return `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
const num = (v: number | null | undefined) => v == null ? '—' : v.toLocaleString('pt-BR')
const pct = (v: number | null | undefined) => v == null ? '—' : `${v.toFixed(2)}%`

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  ACTIVE:   { label: 'Ativa',     color: '#19a66a', bg: '#e8f8f1' },
  PAUSED:   { label: 'Pausada',   color: '#6b7280', bg: '#f3f4f6' },
  ARCHIVED: { label: 'Arquivada', color: '#f59e0b', bg: '#fffbeb' },
  DELETED:  { label: 'Deletada',  color: '#ef4444', bg: '#fef2f2' },
}

const INDENT = { campaign: 0, adset: 20, ad: 40 }

const COLUMNS: { key: SortKey | 'name' | 'status'; label: string; align?: 'right' }[] = [
  { key: 'name',           label: 'Nome' },
  { key: 'status',         label: 'Status' },
  { key: 'spend',          label: 'Gasto',       align: 'right' },
  { key: 'impressions',    label: 'Impressões',  align: 'right' },
  { key: 'clicks',         label: 'Cliques',     align: 'right' },
  { key: 'ctr',            label: 'CTR',         align: 'right' },
  { key: 'cpc',            label: 'CPC',         align: 'right' },
  { key: 'cpm',            label: 'CPM',         align: 'right' },
  { key: 'result_count',   label: 'Resultados',  align: 'right' },
  { key: 'cost_per_result', label: 'CPR',        align: 'right' },
]

/* ─────────────────── component ─────────────────── */
interface Props {
  campaigns: Row[]
  accountId: string
  from: string
  to: string
  maximum?: boolean
}

export default function DrilldownTable({ campaigns, accountId, from, to, maximum }: Props) {
  const [sortKey, setSortKey] = useState<string>('spend')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState<Set<string>>(new Set())
  const [children, setChildren] = useState<Record<string, Row[]>>({})

  function buildParams(extra: Record<string, string>) {
    const p = new URLSearchParams({ accountId, to, ...extra })
    if (maximum) p.set('maximum', 'true')
    else if (from) p.set('from', from)
    return p.toString()
  }

  const fetchChildren = useCallback(async (row: Row) => {
    const key = row.id
    if (expanded.has(key)) {
      setExpanded(prev => { const s = new Set(prev); s.delete(key); return s })
      return
    }
    if (children[key]) {
      setExpanded(prev => new Set(prev).add(key))
      return
    }

    setLoading(prev => new Set(prev).add(key))
    try {
      let url = ''
      if (row.level === 'campaign') {
        url = `/api/gestor/adsets?${buildParams({ campaignId: row.id })}`
      } else if (row.level === 'adset') {
        url = `/api/gestor/ads?${buildParams({ campaignId: row.campaign_id!, adsetId: row.id })}`
      }
      if (!url) return

      // Data already aggregated (SUM per id) — no deduplication needed
      const data: Record<string, unknown>[] = await fetch(url).then(r => r.json())

      const mapped: Row[] = data.map(r => {
        const sp  = r.spend     != null ? Number(r.spend)           : null
        const imp = r.impressions != null ? Number(r.impressions)   : null
        const cl  = r.clicks    != null ? Number(r.clicks)          : null
        const res = r.result_count != null ? Number(r.result_count) : null
        return {
          id:              String(row.level === 'campaign' ? r.adset_id : r.ad_id),
          name:            String(row.level === 'campaign' ? r.adset_name : r.ad_name),
          status:          String(r.status ?? ''),
          spend:           sp,
          impressions:     imp,
          clicks:          cl,
          ctr:             r.ctr != null ? Number(r.ctr) : null,
          cpc:             r.cpc != null ? Number(r.cpc) : null,
          cpm:             row.level === 'campaign'
                             ? ((imp != null && imp > 0 && sp != null) ? (sp / imp) * 1000 : null)
                             : undefined,
          result_count:    res,
          cost_per_result: r.cost_per_result != null ? Number(r.cost_per_result) : null,
          level:           row.level === 'campaign' ? 'adset' : 'ad',
          campaign_id:     String(r.campaign_id ?? row.campaign_id ?? row.id),
          adset_id:        row.level === 'adset' ? row.id : String(r.adset_id ?? ''),
          hasData:         (sp != null && sp > 0) || (imp != null && imp > 0),
        }
      })

      setChildren(prev => ({ ...prev, [key]: mapped }))
      setExpanded(prev => new Set(prev).add(key))
    } finally {
      setLoading(prev => { const s = new Set(prev); s.delete(key); return s })
    }
  }, [expanded, children, accountId, from, to, maximum]) // eslint-disable-line

  function handleSort(key: string) {
    if (key === sortKey) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  function sortRows(rows: Row[]): Row[] {
    return [...rows].sort((a, b) => {
      const av = (a as unknown as Record<string, unknown>)[sortKey] ?? 0
      const bv = (b as unknown as Record<string, unknown>)[sortKey] ?? 0
      if (typeof av === 'number' && typeof bv === 'number') {
        return sortDir === 'desc' ? bv - av : av - bv
      }
      return sortDir === 'desc'
        ? String(bv).localeCompare(String(av))
        : String(av).localeCompare(String(bv))
    })
  }

  function renderRow(row: Row, depth: number, maxSpend = 0, rank = 0): React.ReactElement[] {
    const canExpand = row.level !== 'ad'
    const isExpanded = expanded.has(row.id)
    const isLoading = loading.has(row.id)
    const s = STATUS_STYLE[row.status] ?? { label: row.status, color: '#6b7280', bg: '#f3f4f6' }
    const indent = INDENT[row.level]
    const bgRow = depth === 0 ? 'bg-white' : depth === 1 ? 'bg-gray-50/60' : 'bg-blue-50/30'
    const spend = row.spend ?? 0
    const spendPct = maxSpend > 0 && spend > 0 ? Math.max(4, (spend / maxSpend) * 100) : 0
    const isTop = depth === 0 && rank === 0 && spend > 0
    const RANK_COLORS = ['#f59e0b', '#9ca3af', '#b45309']
    const rankColor = depth === 0 && rank < 3 && spend > 0 ? RANK_COLORS[rank] : null
    const ctr = row.ctr ?? 0

    return [
      <tr
        key={row.id}
        onClick={() => canExpand && fetchChildren(row)}
        className={`border-b transition-colors ${bgRow} ${canExpand ? 'cursor-pointer hover:bg-green-50/40' : ''} ${isTop ? 'ring-1 ring-inset ring-amber-200' : ''}`}
        style={{ borderColor: 'var(--border)' }}
      >
        {/* Nome */}
        <td className="px-3 py-3" style={{ paddingLeft: `${indent + 12}px` }}>
          <div className="flex items-center gap-2">
            {canExpand && (
              isLoading
                ? <Loader2 size={13} className="animate-spin shrink-0 text-gray-400" />
                : isExpanded
                  ? <ChevronDown size={13} className="shrink-0" style={{ color: '#19a66a' }} />
                  : <ChevronRight size={13} className="shrink-0 text-gray-400" />
            )}
            {!canExpand && <span className="w-3 shrink-0" />}
            <div className="flex items-center gap-1.5 min-w-0">
              {rankColor && (
                <span className="shrink-0 text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center text-white"
                      style={{ backgroundColor: rankColor }}>
                  {rank + 1}
                </span>
              )}
              <span
                className="text-sm font-medium truncate max-w-[200px]"
                style={{ color: depth === 0 ? 'var(--foreground)' : 'var(--text-muted)' }}
                title={row.name}
              >
                {row.name || `(sem nome)`}
              </span>
            </div>
          </div>
        </td>
        {/* Status */}
        <td className="px-3 py-3">
          <span className="px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap"
                style={{ color: s.color, backgroundColor: s.bg }}>
            {s.label}
          </span>
        </td>
        {/* Gasto com barra de performance relativa */}
        <td className="px-3 py-3 text-right text-sm font-medium" style={{ color: '#19a66a' }}>
          <div className="flex flex-col items-end gap-1">
            <span>{brl(row.spend)}</span>
            {spendPct > 0 && (
              <div className="w-16 h-1 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${spendPct}%`, backgroundColor: '#19a66a' }} />
              </div>
            )}
          </div>
        </td>
        <td className="px-3 py-3 text-right text-sm" style={{ color: 'var(--text-muted)' }}>{num(row.impressions)}</td>
        <td className="px-3 py-3 text-right text-sm" style={{ color: 'var(--text-muted)' }}>{num(row.clicks)}</td>
        <td className="px-3 py-3 text-right text-sm">
          <span className={ctr >= 1 ? 'text-green-600' : ctr >= 0.5 ? 'text-yellow-600' : 'text-red-500'}>
            {pct(row.ctr)}
          </span>
        </td>
        <td className="px-3 py-3 text-right text-sm" style={{ color: 'var(--text-muted)' }}>{brl(row.cpc)}</td>
        <td className="px-3 py-3 text-right text-sm" style={{ color: 'var(--text-muted)' }}>
          {row.cpm != null ? brl(row.cpm) : '—'}
        </td>
        <td className="px-3 py-3 text-right text-sm font-medium" style={{ color: 'var(--foreground)' }}>
          {num(row.result_count)}
        </td>
        <td className="px-3 py-3 text-right text-sm" style={{ color: 'var(--text-muted)' }}>
          {brl(row.cost_per_result)}
        </td>
      </tr>,
      // Filhos
      ...(isExpanded && children[row.id]
        ? (() => {
            const ch = sortRows(children[row.id])
            const childMax = ch.length > 0 ? Math.max(...ch.map(c => c.spend ?? 0)) : 0
            return ch.flatMap((child, ci): React.ReactElement[] => renderRow(child, depth + 1, childMax, ci))
          })()
        : [] as React.ReactElement[]
      ),
    ]
  }

  const sorted = sortRows(campaigns)
  const maxSpend = sorted.length > 0 ? Math.max(...sorted.map(r => r.spend ?? 0)) : 0

  return (
    <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead>
            <tr className="border-b" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}>
              {COLUMNS.map(col => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className={`px-3 py-3 text-xs font-semibold whitespace-nowrap select-none cursor-pointer hover:text-[#19a66a] transition-colors ${col.align === 'right' ? 'text-right' : 'text-left'}`}
                  style={{ color: sortKey === col.key ? '#19a66a' : 'var(--text-muted)' }}
                >
                  {col.label}{' '}
                  {sortKey === col.key
                    ? sortDir === 'desc' ? '↓' : '↑'
                    : <span className="opacity-30">↕</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0
              ? <tr><td colSpan={10} className="py-12 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                  Nenhuma campanha encontrada.
                </td></tr>
              : sorted.flatMap((row, idx) => renderRow(row, 0, maxSpend, idx))
            }
          </tbody>
        </table>
      </div>
      {sorted.length > 0 && (
        <div className="px-4 py-3 border-t text-xs" style={{ borderColor: 'var(--border)', color: 'var(--text-subtle)' }}>
          {sorted.length} campanha{sorted.length !== 1 ? 's' : ''} · Clique em uma linha para expandir conjuntos e anúncios
        </div>
      )}
    </div>
  )
}

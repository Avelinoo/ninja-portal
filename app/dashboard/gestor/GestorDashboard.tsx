'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Bell, DollarSign, Users, MousePointerClick, TrendingUp, BarChart3, Target, Activity, Zap } from 'lucide-react'

import KpiCard from '@/components/gestor/KpiCard'
import FunnelCard from '@/components/gestor/FunnelCard'
import SpendChart from '@/components/gestor/SpendChart'
import MetricsChart from '@/components/gestor/MetricsChart'
import CampaignsTable from '@/components/gestor/CampaignsTable'
import DateRangePicker from '@/components/gestor/DateRangePicker'

import { DailyMetric, CampaignSnapshot, PresetPeriod, DateRange } from '@/lib/gestor/types'
import { formatCurrency, formatNumber, formatPercent, getPresetRange } from '@/lib/gestor/utils'

type ChartMetric = 'spend' | 'clicks' | 'impressions' | 'reach'

const CHART_TABS: { label: string; value: ChartMetric }[] = [
  { label: 'Investimento', value: 'spend' },
  { label: 'Cliques',      value: 'clicks' },
  { label: 'Impressões',   value: 'impressions' },
  { label: 'Alcance',      value: 'reach' },
]

interface Props {
  contas: { account_id: string; account_name: string }[]
}

export default function GestorDashboard({ contas }: Props) {
  const [contaSel, setContaSel] = useState(contas[0]?.account_id ?? '')
  const [period, setPeriod]     = useState<PresetPeriod>('30d')
  const [customRange, setCustomRange] = useState<DateRange>(getPresetRange('30d'))
  const [metrics, setMetrics]   = useState<DailyMetric[]>([])
  const [campaigns, setCampaigns] = useState<CampaignSnapshot[]>([])
  const [loading, setLoading]   = useState(true)
  const [chartMetric, setChartMetric] = useState<ChartMetric>('spend')

  const activeRange = period === 'custom' ? customRange : getPresetRange(period)

  function handleDateChange(p: PresetPeriod, range: DateRange) {
    setPeriod(p)
    setCustomRange(range)
  }

  useEffect(() => {
    if (!contaSel) return
    setLoading(true)
    const isMax = period === 'maximum'
    const params = new URLSearchParams({
      accountId: contaSel,
      to: activeRange.to,
      ...(isMax ? { maximum: 'true' } : { from: activeRange.from }),
    })
    Promise.all([
      fetch(`/api/gestor/metricas?${params}`).then(r => r.json()),
      fetch(`/api/gestor/campanhas?${params}`).then(r => r.json()),
    ]).then(([m, c]) => {
      setMetrics(Array.isArray(m) ? m : [])
      setCampaigns(Array.isArray(c) ? c : [])
    }).catch(() => {
      setMetrics([]); setCampaigns([])
    }).finally(() => setLoading(false))
  }, [contaSel, period, activeRange.from, activeRange.to]) // eslint-disable-line

  // Aggregations — spend/impressions/clicks/reach vêm de daily_account_metrics (mais preciso a nível de conta)
  const totalSpend       = metrics.reduce((s, m) => s + m.spend, 0)
  const totalImpressions = metrics.reduce((s, m) => s + m.impressions, 0)
  const totalClicks      = metrics.reduce((s, m) => s + m.clicks, 0)
  const totalReach       = metrics.reduce((s, m) => s + m.reach, 0)
  const avgCtr           = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0
  const avgCpc           = totalClicks > 0 ? totalSpend / totalClicks : 0
  const avgCpm           = totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0
  const lastMetric       = metrics[metrics.length - 1]
  const activeCampaigns  = lastMetric?.active_campaigns || 0

  // Resultados e CPR calculados a partir dos campaign_snapshots (igual ao que o Meta exibe)
  // Agrupa por result_label para lidar com múltiplos objetivos por conta
  const latestCampaigns = Object.values(
    campaigns.reduce((acc, c) => {
      if (!c.campaign_id) return acc
      if (!acc[c.campaign_id] || c.snapshot_date > acc[c.campaign_id].snapshot_date)
        acc[c.campaign_id] = c
      return acc
    }, {} as Record<string, CampaignSnapshot>)
  ).sort((a, b) => b.spend - a.spend)

  // Soma de resultados por tipo (da lista de campanhas deduplicated)
  const resultsByType = latestCampaigns.reduce((acc, c) => {
    if (!c.result_label || c.result_count === 0) return acc
    const key = c.result_label
    acc[key] = (acc[key] || 0) + c.result_count
    return acc
  }, {} as Record<string, number>)

  const resultTypes = Object.entries(resultsByType).sort((a, b) => b[1] - a[1])
  const multipleTypes = resultTypes.length > 1
  const totalResults = resultTypes.reduce((s, [, v]) => s + v, 0)
  // Label: tipo dominante ou "Múltiplas conversões" quando há mais de um objetivo
  const resultLabel = multipleTypes
    ? 'Múltiplas conversões'
    : (resultTypes[0]?.[0] || lastMetric?.result_label || 'Resultados')
  // CPR correto: gasto total / total de resultados das campanhas (mesmo cálculo do Meta)
  const avgCpr = totalResults > 0 ? totalSpend / totalResults : 0

  const contaAtual = contas.find(c => c.account_id === contaSel)

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          {/* Seletor de conta */}
          <div>
            <h1 className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>
              {contaAtual?.account_name || 'Gestor de Tráfego JR'}
            </h1>
            {contas.length > 1 && (
              <select
                value={contaSel}
                onChange={e => setContaSel(e.target.value)}
                className="mt-1 text-xs border rounded-lg px-2 py-1 outline-none"
                style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
              >
                {contas.map(c => (
                  <option key={c.account_id} value={c.account_id}>
                    {c.account_name || c.account_id}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <DateRangePicker period={period} customRange={customRange} onChange={handleDateChange} />
          <Link
            href="/dashboard/gestor/alertas"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-white whitespace-nowrap"
            style={{ backgroundColor: 'var(--brand)' }}
          >
            <Bell size={14} /> Alertas
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => <div key={i} className="h-28 bg-gray-100 rounded-xl" />)}
          </div>
        </div>
      ) : contas.length === 0 ? (
        <div className="bg-white rounded-xl border p-16 text-center" style={{ borderColor: 'var(--border)' }}>
          <p style={{ color: 'var(--text-muted)' }}>Nenhuma conta Meta encontrada. O sync diário roda às 06:00.</p>
        </div>
      ) : metrics.length === 0 ? (
        <div className="bg-white rounded-xl border p-16 text-center" style={{ borderColor: 'var(--border)' }}>
          <p style={{ color: 'var(--text-muted)' }}>Nenhum dado para este período.</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-subtle)' }}>Tente um período maior ou aguarde o sync das 06:00.</p>
        </div>
      ) : (
        <>
          {/* KPI Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <KpiCard label="Investimento"  value={formatCurrency(totalSpend)}      icon={DollarSign} />
            <KpiCard label="Alcance"       value={formatNumber(totalReach)}        icon={Users} />
            <KpiCard label="Impressões"    value={formatNumber(totalImpressions)}  icon={Activity} />
            <KpiCard label="Cliques"       value={formatNumber(totalClicks)}       icon={MousePointerClick} />
            <KpiCard label="CTR"           value={formatPercent(avgCtr)}           icon={TrendingUp} />
            <KpiCard label="CPC"           value={formatCurrency(avgCpc)}          icon={Zap} />
            <KpiCard label="CPM"           value={formatCurrency(avgCpm)}          icon={BarChart3} />
            <KpiCard
              label={resultLabel}
              value={formatNumber(totalResults)}
              sub={
                totalResults > 0
                  ? multipleTypes
                    ? `${formatCurrency(avgCpr)}/resultado · ${resultTypes.length} tipos`
                    : `${formatCurrency(avgCpr)}/resultado`
                  : undefined
              }
              icon={Target}
              highlight
            />
          </div>

          {/* Breakdown de resultados quando há múltiplos objetivos */}
          {multipleTypes && (
            <div className="mb-6 bg-white rounded-xl border p-4" style={{ borderColor: 'var(--border)' }}>
              <p className="text-xs font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>
                Resultados por tipo de objetivo
              </p>
              <div className="flex flex-wrap gap-3">
                {resultTypes.map(([label, count]) => {
                  const campSpend = latestCampaigns
                    .filter(c => c.result_label === label)
                    .reduce((s, c) => s + c.spend, 0)
                  const cpr = count > 0 ? campSpend / count : 0
                  return (
                    <div key={label} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--brand)' }} />
                      <span className="text-xs font-medium" style={{ color: 'var(--foreground)' }}>{label}</span>
                      <span className="text-xs font-bold" style={{ color: 'var(--foreground)' }}>{formatNumber(count)}</span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>· {formatCurrency(cpr)}/result.</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Status badges */}
          <div className="flex items-center gap-3 mb-6">
            <span className="text-xs px-3 py-1 rounded-full font-medium"
                  style={{ backgroundColor: '#e8f8f1', color: '#19a66a' }}>
              {activeCampaigns} campanha{activeCampaigns !== 1 ? 's' : ''} ativa{activeCampaigns !== 1 ? 's' : ''}
            </span>
            {(lastMetric?.paused_campaigns ?? 0) > 0 && (
              <span className="text-xs px-3 py-1 rounded-full font-medium bg-gray-100 text-gray-500">
                {lastMetric.paused_campaigns} pausada{lastMetric.paused_campaigns !== 1 ? 's' : ''}
              </span>
            )}
            <span className="text-xs text-gray-400 ml-auto">
              {metrics.length} dia{metrics.length !== 1 ? 's' : ''} de dados
            </span>
          </div>

          {/* Funil + Gráfico */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
            <div className="lg:col-span-2">
              <FunnelCard
                impressions={totalImpressions}
                reach={totalReach}
                clicks={totalClicks}
                results={totalResults}
                resultLabel={resultLabel}
                spend={totalSpend}
                costPerResult={avgCpr}
                ctr={avgCtr}
                cpc={avgCpc}
              />
            </div>
            <div className="lg:col-span-3">
              <div className="bg-white rounded-xl border p-5 h-full" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-1 mb-5 overflow-x-auto pb-1">
                  {CHART_TABS.map(tab => (
                    <button
                      key={tab.value}
                      onClick={() => setChartMetric(tab.value)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0"
                      style={chartMetric === tab.value
                        ? { backgroundColor: '#19a66a', color: '#fff' }
                        : { color: 'var(--text-muted)' }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                <SpendChart data={metrics} metric={chartMetric} />
              </div>
            </div>
          </div>

          {/* CTR / CPC chart */}
          <div className="mb-6">
            <MetricsChart data={metrics} />
          </div>

          {/* Campaigns Table */}
          <CampaignsTable campaigns={latestCampaigns} />
        </>
      )}
    </div>
  )
}

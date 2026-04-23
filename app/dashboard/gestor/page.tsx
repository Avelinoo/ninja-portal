export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { DollarSign, MousePointerClick, Eye, Target, Bell, BarChart2 } from 'lucide-react'
import pool from '@/lib/db'

async function getData() {
  try {
    // Métricas agregadas dos últimos 7 dias por conta
    const { rows: metricas } = await pool.query(`
      SELECT
        account_id,
        MAX(account_name)           AS account_name,
        SUM(spend::float)           AS spend,
        SUM(impressions::int)       AS impressions,
        SUM(clicks::int)            AS clicks,
        SUM(result_count::int)      AS result_count,
        AVG(ctr::float)             AS ctr,
        AVG(cpc::float)             AS cpc,
        AVG(cpm::float)             AS cpm,
        AVG(cost_per_result::float) AS cost_per_result,
        MAX(active_campaigns::int)  AS active_campaigns
      FROM daily_account_metrics
      WHERE date >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY account_id
      ORDER BY SUM(spend::float) DESC
    `)
    // Totais gerais
    const total_spend = metricas.reduce((a: number, r: Record<string, number>) => a + (r.spend || 0), 0)
    const total_results = metricas.reduce((a: number, r: Record<string, number>) => a + (r.result_count || 0), 0)
    const avg_ctr = metricas.length ? metricas.reduce((a: number, r: Record<string, number>) => a + (r.ctr || 0), 0) / metricas.length : 0
    const avg_cpm = metricas.length ? metricas.reduce((a: number, r: Record<string, number>) => a + (r.cpm || 0), 0) / metricas.length : 0
    return { metricas, total_spend, total_results, avg_ctr, avg_cpm }
  } catch {
    return { metricas: [], total_spend: 0, total_results: 0, avg_ctr: 0, avg_cpm: 0 }
  }
}

function fmt_brl(v: number) { return `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` }
function fmt_pct(v: number) { return `${v.toFixed(2)}%` }

export default async function GestorOverviewPage() {
  const { metricas, total_spend, total_results, avg_ctr, avg_cpm } = await getData()

  const kpis = [
    { label: 'Gasto total (7d)', value: fmt_brl(total_spend), icon: DollarSign, color: '#19a66a' },
    { label: 'Resultados (7d)',  value: total_results.toLocaleString('pt-BR'), icon: Target, color: '#3b82f6' },
    { label: 'CTR médio',        value: fmt_pct(avg_ctr), icon: MousePointerClick, color: '#f59e0b' },
    { label: 'CPM médio',        value: fmt_brl(avg_cpm), icon: Eye, color: '#8b5cf6' },
  ]

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>Gestor de Tráfego JR</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Métricas Meta Ads — últimos 7 dias</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/gestor/campanhas"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors hover:bg-gray-50"
            style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
            <BarChart2 size={13} /> Campanhas
          </Link>
          <Link href="/dashboard/gestor/alertas"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white"
            style={{ backgroundColor: 'var(--brand)' }}>
            <Bell size={13} /> Alertas
          </Link>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl border p-5" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{label}</span>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}>
                <Icon size={16} style={{ color }} />
              </div>
            </div>
            <p className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Tabela por conta */}
      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Desempenho por conta</h2>
        </div>
        {metricas.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
            Nenhum dado disponível. O sync diário roda às 06:00.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                  {['Conta', 'Gasto', 'Impressões', 'Cliques', 'CTR', 'CPC', 'CPM', 'CPR', 'Resultados', 'Camps.'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {metricas.map((r: any) => {
                  const ctr = parseFloat(r.ctr) || 0
                  const cpm = parseFloat(r.cpm) || 0
                  const cpc = parseFloat(r.cpc) || 0
                  const cpr = parseFloat(r.cost_per_result) || 0
                  const name: string = r.account_name || r.account_id || ''
                  return (
                    <tr key={r.account_id} className="border-b last:border-0 hover:bg-gray-50 transition-colors" style={{ borderColor: 'var(--border)' }}>
                      <td className="px-4 py-3 font-medium max-w-[160px] truncate" style={{ color: 'var(--foreground)' }} title={name}>
                        {name}
                      </td>
                      <td className="px-4 py-3 font-medium" style={{ color: '#19a66a' }}>{fmt_brl(parseFloat(r.spend) || 0)}</td>
                      <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>{(parseInt(r.impressions) || 0).toLocaleString('pt-BR')}</td>
                      <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>{(parseInt(r.clicks) || 0).toLocaleString('pt-BR')}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ctr >= 1 ? 'bg-green-100 text-green-700' : ctr >= 0.5 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                          {fmt_pct(ctr)}
                        </span>
                      </td>
                      <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>{fmt_brl(cpc)}</td>
                      <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>{fmt_brl(cpm)}</td>
                      <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>{fmt_brl(cpr)}</td>
                      <td className="px-4 py-3 font-medium" style={{ color: 'var(--foreground)' }}>{(parseInt(r.result_count) || 0).toLocaleString('pt-BR')}</td>
                      <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>{r.active_campaigns ?? 0}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

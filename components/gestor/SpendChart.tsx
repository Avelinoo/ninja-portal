'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { formatDate, formatCurrency, formatNumber } from '@/lib/gestor/utils'
import { DailyMetric } from '@/lib/gestor/types'

interface SpendChartProps {
  data: DailyMetric[]
  metric?: 'spend' | 'clicks' | 'impressions' | 'reach'
}

const METRIC_CONFIG = {
  spend: { label: 'Investimento', format: formatCurrency, color: '#19a66a', yFormat: (v: number) => `R$${v.toFixed(0)}` },
  clicks: { label: 'Cliques', format: formatNumber, color: '#6366f1', yFormat: (v: number) => String(v) },
  impressions: { label: 'Impressões', format: formatNumber, color: '#f59e0b', yFormat: (v: number) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : String(v) },
  reach: { label: 'Alcance', format: formatNumber, color: '#ec4899', yFormat: (v: number) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : String(v) },
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-xl px-4 py-3 min-w-[140px]">
      <p className="text-xs font-medium text-gray-400 mb-2">{label}</p>
      {payload.map((entry: any) => {
        const cfg = Object.values(METRIC_CONFIG).find(c => c.color === entry.stroke)
        return (
          <div key={entry.dataKey} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.stroke }} />
              <span className="text-xs text-gray-500">{entry.name}</span>
            </div>
            <span className="text-sm font-bold text-gray-900">
              {cfg ? cfg.format(entry.value) : entry.value}
            </span>
          </div>
        )
      })}
    </div>
  )
}

const CustomDot = (props: any) => {
  const { cx, cy, stroke } = props
  return (
    <circle cx={cx} cy={cy} r={3} fill={stroke} stroke="white" strokeWidth={2} />
  )
}

const CustomActiveDot = (props: any) => {
  const { cx, cy, stroke } = props
  return (
    <circle cx={cx} cy={cy} r={5} fill={stroke} stroke="white" strokeWidth={2} />
  )
}

export default function SpendChart({ data, metric = 'spend' }: SpendChartProps) {
  const cfg = METRIC_CONFIG[metric]

  const chartData = [...data]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(d => ({
      date: formatDate(d.date),
      [metric]: d[metric as keyof DailyMetric],
    }))

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-gray-400 hidden sm:block">Passe o mouse para ver detalhes</p>
        <p className="text-xs text-gray-400 sm:hidden">Toque no gráfico para ver detalhes</p>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={cfg.yFormat}
            width={55}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#e5e7eb', strokeWidth: 1 }} />
          <Line
            type="monotone"
            dataKey={metric}
            stroke={cfg.color}
            strokeWidth={2.5}
            name={cfg.label}
            dot={chartData.length <= 14 ? <CustomDot /> : false}
            activeDot={<CustomActiveDot />}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}


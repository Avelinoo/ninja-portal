'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { formatDate } from '@/lib/gestor/utils'
import { DailyMetric } from '@/lib/gestor/types'

interface MetricsChartProps {
  data: DailyMetric[]
}

export default function MetricsChart({ data }: MetricsChartProps) {
  const chartData = [...data]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(d => ({
      date: formatDate(d.date),
      ctr: isFinite(d.ctr) ? parseFloat(d.ctr.toFixed(2)) : 0,
      cpc: isFinite(d.cpc) ? parseFloat(d.cpc.toFixed(2)) : 0,
    }))

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-gray-900">CTR e CPC</h3>
        <p className="text-xs text-gray-400 mt-0.5">Taxa de clique e custo por clique</p>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData} margin={{ top: 0, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
            width={35}
          />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #f0f0f0' }}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
          />
          <Line
            type="monotone"
            dataKey="ctr"
            stroke="#19a66a"
            strokeWidth={2}
            dot={false}
            name="CTR (%)"
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
          <Line
            type="monotone"
            dataKey="cpc"
            stroke="#6366f1"
            strokeWidth={2}
            dot={false}
            name="CPC (R$)"
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

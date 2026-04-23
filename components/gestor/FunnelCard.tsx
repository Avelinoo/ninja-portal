import { formatCurrency, formatNumber, formatPercent } from '@/lib/gestor/utils'

interface FunnelStep {
  label: string
  value: number
  sub?: string
  color: string
  width: number // percentage bar width
}

interface FunnelCardProps {
  impressions: number
  reach: number
  clicks: number
  results: number
  resultLabel: string
  spend: number
  costPerResult: number
  ctr: number
  cpc: number
}

export default function FunnelCard({
  impressions, reach, clicks, results, resultLabel,
  spend, costPerResult, ctr, cpc,
}: FunnelCardProps) {
  const max = Math.max(impressions, 1)

  const steps: FunnelStep[] = [
    {
      label: 'Impressões',
      value: impressions,
      sub: `CPM ${formatCurrency(impressions > 0 ? spend / (impressions / 1000) : 0)}`,
      color: '#19a66a',
      width: 100,
    },
    {
      label: 'Alcance',
      value: reach,
      sub: reach > 0 ? `${formatPercent((reach / impressions) * 100, 1)} das impressões` : '—',
      color: '#22c57e',
      width: impressions > 0 ? (reach / max) * 100 : 0,
    },
    {
      label: 'Cliques',
      value: clicks,
      sub: `CTR ${formatPercent(ctr)} · CPC ${formatCurrency(cpc)}`,
      color: '#34d899',
      width: impressions > 0 ? (clicks / max) * 100 : 0,
    },
    {
      label: resultLabel || 'Resultados',
      value: results,
      sub: results > 0 ? `Custo/resultado ${formatCurrency(costPerResult)}` : 'Sem conversões',
      color: '#10b981',
      width: impressions > 0 ? Math.max((results / max) * 100, results > 0 ? 2 : 0) : 0,
    },
  ]

  // Taxas de conversão entre etapas
  const rates = [
    null,
    impressions > 0 ? (reach / impressions) * 100 : null,
    reach > 0 ? (clicks / reach) * 100 : null,
    clicks > 0 ? (results / clicks) * 100 : null,
  ]

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-gray-900">Funil de Conversão</h3>
        <p className="text-xs text-gray-400 mt-0.5">Do alcance à conversão</p>
      </div>

      <div className="space-y-3">
        {steps.map((step, i) => (
          <div key={step.label}>
            {/* Taxa entre etapas */}
            {rates[i] !== null && (
              <div className="flex items-center gap-2 mb-1 ml-2">
                <div className="w-px h-3 bg-gray-200" />
                <span className="text-[10px] text-gray-400">
                  {rates[i]!.toFixed(1)}% de conversão
                </span>
              </div>
            )}

            <div className="relative">
              {/* Background bar */}
              <div className="h-11 bg-gray-50 rounded-lg overflow-hidden">
                {/* Fill bar */}
                <div
                  className="h-full rounded-lg transition-all duration-500"
                  style={{
                    width: `${Math.max(step.width, step.value > 0 ? 8 : 0)}%`,
                    backgroundColor: step.color,
                    opacity: 0.15 + (i * 0.05),
                  }}
                />
              </div>

              {/* Content overlay */}
              <div className="absolute inset-0 flex items-center justify-between px-3">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: step.color }}
                  />
                  <span className="text-xs font-medium text-gray-700">{step.label}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-gray-900">
                    {formatNumber(step.value)}
                  </span>
                  {step.sub && (
                    <span className="text-[10px] text-gray-400 ml-2">{step.sub}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Total spend */}
      <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
        <span className="text-xs text-gray-400">Total investido</span>
        <span className="text-sm font-bold" style={{ color: '#19a66a' }}>
          {formatCurrency(spend)}
        </span>
      </div>
    </div>
  )
}

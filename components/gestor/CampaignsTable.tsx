import { CampaignSnapshot } from '@/lib/gestor/types'
import { formatCurrency, formatNumber, formatPercent } from '@/lib/gestor/utils'

interface CampaignsTableProps {
  campaigns: CampaignSnapshot[]
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  ACTIVE: { label: 'Ativa', color: '#19a66a', bg: '#e8f8f1' },
  PAUSED: { label: 'Pausada', color: '#6b7280', bg: '#f3f4f6' },
  DELETED: { label: 'Deletada', color: '#ef4444', bg: '#fef2f2' },
  ARCHIVED: { label: 'Arquivada', color: '#f59e0b', bg: '#fffbeb' },
}

const objectiveLabels: Record<string, string> = {
  OUTCOME_SALES: 'Venda',
  OUTCOME_LEADS: 'Geração de Leads',
  OUTCOME_AWARENESS: 'Reconhecimento',
  OUTCOME_ENGAGEMENT: 'Engajamento',
  OUTCOME_TRAFFIC: 'Tráfego',
  OUTCOME_APP_PROMOTION: 'Promoção de App',
  LINK_CLICKS: 'Tráfego',
  CONVERSIONS: 'Conversões',
  LEAD_GENERATION: 'Geração de Leads',
  BRAND_AWARENESS: 'Reconhecimento',
  REACH: 'Alcance',
  VIDEO_VIEWS: 'Visualizações de Vídeo',
  APP_INSTALLS: 'Instalações de App',
  MESSAGES: 'Mensagens',
  PAGE_LIKES: 'Curtidas na Página',
  POST_ENGAGEMENT: 'Engajamento',
}

export default function CampaignsTable({ campaigns }: CampaignsTableProps) {
  if (!campaigns.length) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
        <p className="text-gray-400 text-sm">Nenhuma campanha encontrada para este período.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-50">
        <h3 className="text-sm font-semibold text-gray-900">Campanhas</h3>
        <p className="text-xs text-gray-400 mt-0.5">{campaigns.length} campanha{campaigns.length !== 1 ? 's' : ''} no período</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-50">
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Campanha</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden sm:table-cell">Status</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Invest.</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Impressões</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Cliques</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">CTR</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">CPC</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Resultados</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c, i) => {
              const s = statusConfig[c.status] || { label: c.status, color: '#6b7280', bg: '#f3f4f6' }
              return (
                <tr key={`${c.campaign_id}-${i}`} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-gray-900 truncate max-w-[200px] sm:max-w-[220px]">{c.campaign_name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium sm:hidden"
                            style={{ color: s.color, backgroundColor: s.bg }}>
                        {s.label}
                      </span>
                      {c.objective && (
                        <p className="text-xs text-gray-400">{objectiveLabels[c.objective] ?? c.objective}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 hidden sm:table-cell">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{ color: s.color, backgroundColor: s.bg }}>
                      {s.label}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right font-medium text-gray-900">{formatCurrency(c.spend)}</td>
                  <td className="px-4 py-3.5 text-right text-gray-600">{formatNumber(c.impressions)}</td>
                  <td className="px-4 py-3.5 text-right text-gray-600">{formatNumber(c.clicks)}</td>
                  <td className="px-4 py-3.5 text-right text-gray-600">{formatPercent(c.ctr)}</td>
                  <td className="px-4 py-3.5 text-right text-gray-600">{formatCurrency(c.cpc)}</td>
                  <td className="px-5 py-3.5 text-right">
                    {c.result_count > 0 ? (
                      <div>
                        <p className="font-semibold" style={{ color: '#19a66a' }}>{formatNumber(c.result_count)}</p>
                        <p className="text-xs text-gray-400">{formatCurrency(c.cost_per_result)}/res.</p>
                      </div>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

import { Database, Users, Send, TrendingUp } from 'lucide-react'

async function getStats() {
  const API = process.env.BDR_API_URL!
  const TOKEN = process.env.BDR_API_TOKEN!
  const h = { Authorization: `Bearer ${TOKEN}` }
  try {
    const [statsRes, importRes] = await Promise.all([
      fetch(`${API}/leads/stats`, { headers: h, cache: 'no-store' }),
      fetch(`${API}/import/status`, { headers: h, cache: 'no-store' }),
    ])
    return { stats: await statsRes.json(), importStatus: await importRes.json() }
  } catch {
    return { stats: {}, importStatus: { empresas: 0, estabelecimentos: 0, cnaes: 0, leads_gerados: 0, pronto: false } }
  }
}

export default async function BdrDashboardPage() {
  const { stats, importStatus } = await getStats()
  const s = stats as Record<string, number>
  const total = Object.values(s).reduce((a, b) => a + b, 0)
  const enviados = s['enviado'] || 0
  const convertidos = s['converteu'] || 0
  const novos = s['novo'] || 0
  const taxa = enviados > 0 ? ((convertidos / enviados) * 100).toFixed(1) : '0.0'

  const cards = [
    { label: 'Empresas na base', value: importStatus.estabelecimentos?.toLocaleString('pt-BR') || '0', icon: Database, color: '#19a66a' },
    { label: 'Leads gerados', value: total.toLocaleString('pt-BR'), icon: Users, color: '#3b82f6' },
    { label: 'Aguardando disparo', value: novos.toLocaleString('pt-BR'), icon: Send, color: '#f59e0b' },
    { label: 'Taxa de conversão', value: `${taxa}%`, icon: TrendingUp, color: '#8b5cf6' },
  ]

  const statusLabels: Record<string, string> = { novo: 'Novo', enviado: 'Enviado', respondeu: 'Respondeu', converteu: 'Converteu' }

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>BDR Leads</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Visão geral — leads e importação Receita Federal</p>
      </div>

      {!importStatus.pronto && (
        <div className="mb-6 px-4 py-3 rounded-xl border text-sm" style={{ borderColor: '#f59e0b', background: '#fffbeb', color: '#92400e' }}>
          Base vazia. Execute o import da Receita Federal para começar.
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-8">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl border p-5" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{label}</span>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}>
                <Icon size={16} style={{ color }} />
              </div>
            </div>
            <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{value}</p>
          </div>
        ))}
      </div>

      {total > 0 && (
        <div className="bg-white rounded-2xl border p-5" style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--foreground)' }}>Leads por status</h2>
          <div className="space-y-3">
            {Object.entries(s).map(([status, count]) => {
              const pct = total > 0 ? (count / total) * 100 : 0
              const colors: Record<string, string> = { novo: '#19a66a', enviado: '#3b82f6', respondeu: '#f59e0b', converteu: '#8b5cf6' }
              const color = colors[status] || '#6b7280'
              return (
                <div key={status}>
                  <div className="flex justify-between text-xs mb-1">
                    <span style={{ color: 'var(--text-muted)' }}>{statusLabels[status] || status}</span>
                    <span className="font-medium" style={{ color: 'var(--foreground)' }}>{count.toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100">
                    <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: color }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

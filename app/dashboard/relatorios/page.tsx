import { ExternalLink, BarChart2 } from 'lucide-react'

export default function RelatoriosPage() {
  const url = process.env.RELATORIOS_API_URL ?? 'https://relatorios.ninjacompany.com.br'

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>Relatórios de Anúncios</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Dashboard Meta Ads por cliente</p>
      </div>

      <div className="bg-white rounded-2xl border p-6 space-y-4" style={{ borderColor: 'var(--border)' }}>
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: '#ede9fe' }}>
          <BarChart2 size={22} style={{ color: '#8b5cf6' }} />
        </div>
        <div>
          <h2 className="text-sm font-semibold mb-1" style={{ color: 'var(--foreground)' }}>Dashboard isolado em migração</h2>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            O dashboard de relatórios Meta Ads está ativo no subdomínio próprio. A integração aqui está em andamento.
          </p>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-80"
          style={{ backgroundColor: '#8b5cf6' }}
        >
          <ExternalLink size={14} />
          Acessar relatórios
        </a>
      </div>
    </div>
  )
}

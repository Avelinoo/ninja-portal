import { Bot } from 'lucide-react'

export default function GestorPage() {
  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>Gestor Tráfego JR</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Bot Telegram de relatórios Meta Ads</p>
      </div>

      <div className="bg-white rounded-2xl border p-6 space-y-4" style={{ borderColor: 'var(--border)' }}>
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: '#fef3c7' }}>
          <Bot size={22} style={{ color: '#f59e0b' }} />
        </div>
        <div>
          <h2 className="text-sm font-semibold mb-1" style={{ color: 'var(--foreground)' }}>Bot em execução</h2>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            O bot do Gestor Tráfego JR roda como serviço isolado. O painel de controle será integrado aqui em breve.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs" style={{ color: '#065f46' }}>
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          Serviço ativo no servidor
        </div>
      </div>
    </div>
  )
}

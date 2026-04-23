import Link from 'next/link'
import { ExternalLink, Send } from 'lucide-react'

export default function DisparosPage() {
  const url = process.env.DISPAROS_API_URL ?? 'https://disparos.ninjacompany.com.br'

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>Disparos WhatsApp</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Envio em massa via Evolution API</p>
      </div>

      <div className="bg-white rounded-2xl border p-6 space-y-4" style={{ borderColor: 'var(--border)' }}>
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: '#d1fae5' }}>
          <Send size={22} style={{ color: '#19a66a' }} />
        </div>
        <div>
          <h2 className="text-sm font-semibold mb-1" style={{ color: 'var(--foreground)' }}>Backend ativo em serviço isolado</h2>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            O sistema de disparos roda de forma isolada. O frontend será integrado aqui progressivamente.
          </p>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-80"
          style={{ backgroundColor: '#19a66a' }}
        >
          <ExternalLink size={14} />
          Acessar backend diretamente
        </a>
      </div>
    </div>
  )
}

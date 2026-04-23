'use client'

import { useState } from 'react'
import { Download, FileText, MessageSquare, Loader2, AlertCircle } from 'lucide-react'

const UFS = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO']
const STATUS_OPTS = [
  { value: '', label: 'Todos' },
  { value: 'novo', label: 'Novos' },
  { value: 'enviado', label: 'Enviados' },
  { value: 'respondeu', label: 'Responderam' },
  { value: 'converteu', label: 'Converteram' },
]

export default function ExportarPage() {
  const [status, setStatus] = useState('')
  const [uf, setUf] = useState('')
  const [limit, setLimit] = useState(500)
  const [loading, setLoading] = useState<string | null>(null)
  const [erro, setErro] = useState('')

  async function exportar(tipo: 'csv' | 'json' | 'whatsapp') {
    setLoading(tipo)
    setErro('')
    try {
      const params = new URLSearchParams({ limit: String(limit) })
      if (status) params.set('status', status)
      if (uf) params.set('uf', uf)

      const res = await fetch(`/api/export/${tipo}?${params}`)

      if (!res.ok) {
        setErro(`Erro ${res.status}: ${await res.text()}`)
        return
      }

      const filename = `leads${status ? `_${status}` : ''}${uf ? `_${uf}` : ''}_${new Date().toISOString().slice(0, 10)}`

      if (tipo === 'csv') {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${filename}.csv`
        a.click()
        URL.revokeObjectURL(url)
      } else {
        const data = await res.json()
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${filename}.json`
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (e: any) {
      setErro(e?.message || 'Erro de conexão')
    } finally {
      setLoading(null)
    }
  }

  const exportBtns = [
    { tipo: 'csv' as const, label: 'Exportar CSV', sub: 'Planilha pronta para Excel / Google Sheets', icon: FileText, color: '#19a66a' },
    { tipo: 'json' as const, label: 'Exportar JSON', sub: 'Payload para integração com APIs', icon: Download, color: '#3b82f6' },
    { tipo: 'whatsapp' as const, label: 'Exportar WhatsApp', sub: 'Apenas leads com telefone, formato de disparo', icon: MessageSquare, color: '#25d366' },
  ]

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>Exportar Leads</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Filtre e baixe sua lista de leads</p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4 space-y-4">
        <h2 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Filtros</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#19a66a] transition-all"
              style={{ color: 'var(--foreground)' }}>
              {STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>UF</label>
            <select value={uf} onChange={e => setUf(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#19a66a] transition-all"
              style={{ color: 'var(--foreground)' }}>
              <option value="">Todos os estados</option>
              {UFS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
            Quantidade máxima: <strong>{limit.toLocaleString('pt-BR')}</strong> leads
          </label>
          <input type="range" min={50} max={5000} step={50}
            value={limit} onChange={e => setLimit(Number(e.target.value))}
            className="w-full accent-[#19a66a]" />
          <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--text-subtle)' }}>
            <span>50</span><span>5.000</span>
          </div>
        </div>
      </div>

      {erro && (
        <div className="mb-4 flex items-start gap-2 px-4 py-3 rounded-xl text-sm bg-red-50 text-red-600">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{erro}</span>
        </div>
      )}

      {/* Botões de export */}
      <div className="space-y-3">
        {exportBtns.map(({ tipo, label, sub, icon: Icon, color }) => (
          <button
            key={tipo}
            onClick={() => exportar(tipo)}
            disabled={loading !== null}
            className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4 hover:shadow-md transition-all disabled:opacity-60 text-left"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}15` }}>
              {loading === tipo
                ? <Loader2 size={18} className="animate-spin" style={{ color }} />
                : <Icon size={18} style={{ color }} />}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{label}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{sub}</p>
            </div>
            <Download size={14} style={{ color: 'var(--text-subtle)' }} />
          </button>
        ))}
      </div>
    </div>
  )
}

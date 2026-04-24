'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, Bell, BellOff, Loader2, SendHorizonal, CheckCircle, Pencil, X } from 'lucide-react'

interface Conta { account_id: string; account_name: string }
interface Alerta {
  id: number; account_id: string; account_name: string
  metric: string; condition: string; threshold: number
  telegram_chat_id: string; is_active: boolean; last_triggered: string | null
}

const METRICS = [
  { value: 'ctr',             label: 'CTR (%)',              hint: 'Ex: 1.0 = 1%' },
  { value: 'cpm',             label: 'CPM (R$)',             hint: 'Ex: 15.00' },
  { value: 'cpc',             label: 'CPC (R$)',             hint: 'Ex: 2.50' },
  { value: 'cost_per_result', label: 'Custo por Resultado',  hint: 'Ex: 30.00' },
  { value: 'spend',           label: 'Gasto Total (R$)',     hint: 'Ex: 500.00' },
  { value: 'result_count',    label: 'Resultados (qtd)',     hint: 'Ex: 10' },
]
const METRIC_LABEL: Record<string, string> = Object.fromEntries(METRICS.map(m => [m.value, m.label]))

function fmtThreshold(metric: string, value: number): string {
  switch (metric) {
    case 'ctr':
      return `${value.toFixed(2)}%`
    case 'cpm':
    case 'cpc':
    case 'cost_per_result':
    case 'spend':
      return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    case 'result_count':
      return Math.round(value).toLocaleString('pt-BR')
    default:
      return String(value)
  }
}
const CONDITIONS = [
  { value: 'above', label: 'Acima de' },
  { value: 'below', label: 'Abaixo de' },
]

type FormState = { account_id: string; account_name: string; metric: string; condition: string; threshold: string; telegram_chat_id: string }
const EMPTY_FORM: FormState = { account_id: '', account_name: '', metric: 'ctr', condition: 'below', threshold: '', telegram_chat_id: '' }

export default function AlertasPage() {
  const [contas, setContas]     = useState<Conta[]>([])
  const [alertas, setAlertas]   = useState<Alerta[]>([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [saving, setSaving]     = useState(false)
  const [checking, setChecking] = useState(false)
  const [result, setResult]     = useState<{ triggered: number } | null>(null)
  const [error, setError]       = useState('')
  const [form, setForm]         = useState<FormState>(EMPTY_FORM)

  const loadData = useCallback(async () => {
    setLoading(true)
    const [c, a] = await Promise.all([
      fetch('/api/gestor/contas').then(r => r.json()),
      fetch('/api/gestor/alertas').then(r => r.json()),
    ])
    setContas(Array.isArray(c) ? c : [])
    setAlertas(Array.isArray(a) ? a : [])
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  function openNew() {
    const firstConta = contas[0]
    setForm({ ...EMPTY_FORM, account_id: firstConta?.account_id ?? '', account_name: firstConta?.account_name ?? '' })
    setEditingId(null)
    setShowForm(true)
    setError('')
    setResult(null)
  }

  function openEdit(a: Alerta) {
    setForm({ account_id: a.account_id, account_name: a.account_name, metric: a.metric, condition: a.condition, threshold: String(a.threshold), telegram_chat_id: a.telegram_chat_id ?? '' })
    setEditingId(a.id)
    setShowForm(true)
    setError('')
    setResult(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function closeForm() { setShowForm(false); setEditingId(null); setForm(EMPTY_FORM); setError('') }

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true); setError('')
    const payload = { ...form, threshold: parseFloat(form.threshold) }
    const isEdit = editingId !== null

    const res = await fetch(isEdit ? `/api/gestor/alertas?id=${editingId}` : '/api/gestor/alertas', {
      method: isEdit ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Erro ao salvar alerta'); setSaving(false); return }
    closeForm()
    loadData()
    setSaving(false)
  }

  async function remove(id: number) {
    if (!confirm('Remover este alerta?')) return
    await fetch(`/api/gestor/alertas?id=${id}`, { method: 'DELETE' })
    loadData()
  }

  async function verificar() {
    setChecking(true); setResult(null); setError('')
    const res = await fetch('/api/gestor/alertas/verificar', { method: 'POST' })
    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Erro ao verificar'); setChecking(false); return }
    setResult(data)
    setChecking(false)
    loadData()
  }

  function onContaChange(account_id: string) {
    const conta = contas.find(c => c.account_id === account_id)
    setForm(f => ({ ...f, account_id, account_name: conta?.account_name ?? '' }))
  }

  const metricHint = METRICS.find(m => m.value === form.metric)?.hint ?? ''

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>Alertas de Métricas</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Notificação Telegram quando metas forem violadas</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={verificar}
            disabled={checking || alertas.length === 0}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors hover:bg-gray-50 disabled:opacity-50"
            style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
          >
            {checking ? <Loader2 size={14} className="animate-spin" /> : <SendHorizonal size={14} />}
            Verificar agora
          </button>
          <button
            onClick={openNew}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-white"
            style={{ backgroundColor: 'var(--brand)' }}
          >
            <Plus size={14} /> Novo alerta
          </button>
        </div>
      </div>

      {/* Resultado da verificação */}
      {result && (
        <div className={`mb-4 px-4 py-3 rounded-xl flex items-start gap-3 text-sm ${(result.triggered) > 0 ? 'bg-orange-50 text-orange-700' : 'bg-green-50 text-green-700'}`}>
          <CheckCircle size={16} className="mt-0.5 shrink-0" />
          <span>{(result.triggered) > 0 ? `${result.triggered} alerta(s) disparado(s) via Telegram.` : 'Todas as métricas dentro dos limites.'}</span>
        </div>
      )}

      {error && <p className="mb-4 text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

      {/* Formulário (criar ou editar) */}
      {showForm && (
        <form onSubmit={save} className="bg-white rounded-2xl border p-5 mb-6 space-y-4" style={{ borderColor: editingId ? '#19a66a' : 'var(--border)', boxShadow: editingId ? '0 0 0 2px #19a66a22' : undefined }}>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
              {editingId ? 'Editar alerta' : 'Novo alerta'}
            </h2>
            <button type="button" onClick={closeForm} className="p-1 rounded-lg hover:bg-gray-100" style={{ color: 'var(--text-muted)' }}>
              <X size={15} />
            </button>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Conta</label>
            <select value={form.account_id} onChange={e => onContaChange(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none" style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }} required>
              {contas.map(c => <option key={c.account_id} value={c.account_id}>{c.account_name || c.account_id}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Métrica</label>
              <select value={form.metric} onChange={e => setForm(f => ({ ...f, metric: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none" style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}>
                {METRICS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Condição</label>
              <select value={form.condition} onChange={e => setForm(f => ({ ...f, condition: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none" style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}>
                {CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Limite — {metricHint}</label>
              <input type="number" step="0.01" min="0" value={form.threshold}
                onChange={e => setForm(f => ({ ...f, threshold: e.target.value }))}
                placeholder="0.00"
                className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none" style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }} required />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
              Telegram Chat ID <span className="font-normal">(opcional)</span>
            </label>
            <input type="text" value={form.telegram_chat_id}
              onChange={e => setForm(f => ({ ...f, telegram_chat_id: e.target.value }))}
              placeholder="-100xxxxxxxxx"
              className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none" style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }} />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-60"
              style={{ backgroundColor: 'var(--brand)' }}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : editingId ? <Pencil size={14} /> : <Plus size={14} />}
              {editingId ? 'Salvar alterações' : 'Criar alerta'}
            </button>
            <button type="button" onClick={closeForm}
              className="px-4 py-2 rounded-lg text-sm" style={{ color: 'var(--text-muted)' }}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Lista de alertas */}
      <div className="bg-white rounded-2xl border" style={{ borderColor: 'var(--border)' }}>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={20} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
          </div>
        ) : alertas.length === 0 ? (
          <div className="py-12 text-center">
            <BellOff size={32} className="mx-auto mb-3 opacity-30" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Nenhum alerta configurado</p>
          </div>
        ) : (
          <ul className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {alertas.map(a => (
              <li key={a.id} className={`flex items-center justify-between px-5 py-4 transition-colors ${editingId === a.id ? 'bg-green-50/40' : ''}`}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                       style={{ background: a.is_active ? '#d1fae5' : '#f3f4f6' }}>
                    <Bell size={14} style={{ color: a.is_active ? '#19a66a' : '#9ca3af' }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                      {a.account_name || a.account_id} —{' '}
                      <span style={{ color: 'var(--brand)' }}>{METRIC_LABEL[a.metric] ?? a.metric}</span>
                      {' '}{a.condition === 'above' ? 'acima de' : 'abaixo de'}{' '}
                      <strong>{fmtThreshold(a.metric, a.threshold)}</strong>
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-subtle)' }}>
                      {a.last_triggered
                        ? `Último disparo: ${new Date(a.last_triggered).toLocaleString('pt-BR')}`
                        : 'Nunca disparado'}
                      {a.telegram_chat_id ? ` · Chat ${a.telegram_chat_id}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEdit(a)}
                    title="Editar"
                    className="p-1.5 rounded-lg transition-colors hover:bg-green-50 hover:text-green-600"
                    style={{ color: editingId === a.id ? '#19a66a' : 'var(--text-muted)' }}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => remove(a.id)}
                    title="Remover"
                    className="p-1.5 rounded-lg transition-colors hover:bg-red-50 hover:text-red-500"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

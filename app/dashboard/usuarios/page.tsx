'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, ShieldCheck, User, Loader2 } from 'lucide-react'

interface UserRow { id: number; username: string; role: string; is_active: boolean; created_at: string }

export default function UsuariosPage() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ username: '', password: '', role: 'user' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/users')
    if (res.ok) setUsers(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function create(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true); setError(''); setSuccess('')
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (res.ok) {
      setSuccess(`Usuário "${data.username}" criado.`)
      setForm({ username: '', password: '', role: 'user' })
      setShowForm(false)
      load()
    } else {
      setError(data.error || 'Erro ao criar usuário')
    }
    setCreating(false)
  }

  async function remove(id: number, username: string) {
    if (!confirm(`Desativar usuário "${username}"?`)) return
    await fetch(`/api/users?id=${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>Usuários</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Gerencie o acesso ao portal</p>
        </div>
        <button
          onClick={() => { setShowForm(v => !v); setError(''); setSuccess('') }}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-white"
          style={{ backgroundColor: 'var(--brand)' }}
        >
          <Plus size={15} /> Novo usuário
        </button>
      </div>

      {error && <p className="mb-4 text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
      {success && <p className="mb-4 text-xs text-green-700 bg-green-50 px-3 py-2 rounded-lg">{success}</p>}

      {showForm && (
        <form onSubmit={create} className="bg-white rounded-2xl border p-5 mb-6 space-y-4" style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Novo usuário</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Usuário</label>
              <input
                type="text"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                placeholder="joao.silva"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Perfil</label>
              <select
                value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
              >
                <option value="user">Usuário</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Senha (mín. 6 caracteres)</label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
              style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={creating}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-60"
              style={{ backgroundColor: 'var(--brand)' }}
            >
              {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Criar
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm" style={{ color: 'var(--text-muted)' }}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-2xl border" style={{ borderColor: 'var(--border)' }}>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={20} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
          </div>
        ) : (
          <ul className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {users.map(u => (
              <li key={u.id} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: u.role === 'admin' ? '#d1fae5' : '#f3f4f6' }}>
                    {u.role === 'admin' ? <ShieldCheck size={14} style={{ color: '#19a66a' }} /> : <User size={14} style={{ color: '#6b7280' }} />}
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{u.username}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{u.role} · {u.is_active ? 'Ativo' : 'Inativo'}</p>
                  </div>
                </div>
                {u.username !== 'admin' && (
                  <button
                    onClick={() => remove(u.id, u.username)}
                    className="p-1.5 rounded-lg transition-colors hover:bg-red-50 hover:text-red-500"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

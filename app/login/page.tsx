'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    if (res.ok) {
      router.push('/dashboard')
    } else {
      const data = await res.json()
      setError(data.error || 'Usuário ou senha incorretos')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <Image src="/logo.png" alt="Ninja Company" width={80} height={80} className="object-contain mb-3 rounded-2xl" />
          <h1 className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>Ninja Company</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-subtle)' }}>Portal Unificado</p>
        </div>
        <div className="bg-white rounded-2xl border shadow-sm p-8" style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-base font-semibold mb-6" style={{ color: 'var(--foreground)' }}>Entrar</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Usuário</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none transition-all"
                style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                placeholder="admin"
                autoComplete="username"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Senha</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none transition-all"
                style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>
            {error && (
              <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity disabled:opacity-60"
              style={{ backgroundColor: 'var(--brand)' }}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

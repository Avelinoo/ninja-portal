'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Users, Send, BarChart2, Bot,
  LogOut, Sun, Moon, Menu, X, ChevronRight, ShieldCheck,
} from 'lucide-react'

interface SessionInfo { userId: number; username: string; role: string }

const modules = [
  { href: '/dashboard', label: 'Visão Geral', icon: LayoutDashboard, exact: true },
  {
    label: 'BDR Leads', icon: Users, base: '/dashboard/bdr',
    children: [
      { href: '/dashboard/bdr', label: 'Dashboard', exact: true },
      { href: '/dashboard/bdr/buscar', label: 'Buscar Leads' },
      { href: '/dashboard/bdr/exportar', label: 'Exportar' },
    ],
  },
  { href: '/dashboard/disparos', label: 'Disparos WhatsApp', icon: Send },
  { href: '/dashboard/relatorios', label: 'Relatórios', icon: BarChart2 },
  {
    label: 'Gestor Tráfego JR', icon: Bot, base: '/dashboard/gestor',
    children: [
      { href: '/dashboard/gestor', label: 'Visão Geral', exact: true },
      { href: '/dashboard/gestor/campanhas', label: 'Campanhas' },
      { href: '/dashboard/gestor/alertas', label: 'Alertas' },
    ],
  },
]

function NavContent({ onClose, session, dark, toggleTheme }: {
  onClose?: () => void
  session: SessionInfo | null
  dark: boolean
  toggleTheme: () => void
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    '/dashboard/bdr': pathname.startsWith('/dashboard/bdr'),
    '/dashboard/gestor': pathname.startsWith('/dashboard/gestor'),
  })
  const toggleMenu = (base: string) => setOpenMenus(o => ({ ...o, [base]: !o[base] }))

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <>
      <div className="flex items-center justify-between px-4 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <Link href="/dashboard" onClick={onClose} className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="Ninja" width={32} height={32} className="rounded-xl object-contain" />
          <div>
            <p className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>Ninja Company</p>
            <p className="text-[10px]" style={{ color: 'var(--text-subtle)' }}>Portal Unificado</p>
          </div>
        </Link>
        {onClose && (
          <button onClick={onClose} className="p-1 lg:hidden" style={{ color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {modules.map(mod => {
          if ('children' in mod) {
            const active = pathname.startsWith(mod.base!)
            return (
              <div key={mod.label}>
                <button
                  onClick={() => toggleMenu(mod.base!)}
                  className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                  style={{
                    background: active ? 'var(--brand-light)' : 'transparent',
                    color: active ? 'var(--brand)' : 'var(--text-muted)',
                  }}
                >
                  <span className="flex items-center gap-2.5">
                    <mod.icon size={15} />
                    {mod.label}
                  </span>
                  <ChevronRight size={13} style={{ transform: openMenus[mod.base!] ? 'rotate(90deg)' : 'none', transition: 'transform .2s' }} />
                </button>
                {openMenus[mod.base!] && (
                  <div className="ml-4 mt-0.5 space-y-0.5 border-l pl-3" style={{ borderColor: 'var(--border)' }}>
                    {(mod.children ?? []).map(child => {
                      const isActive = child.exact ? pathname === child.href : pathname.startsWith(child.href)
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={onClose}
                          className="block px-2 py-1.5 rounded-lg text-xs font-medium transition-colors"
                          style={{
                            background: isActive ? 'var(--brand-light)' : 'transparent',
                            color: isActive ? 'var(--brand)' : 'var(--text-muted)',
                          }}
                        >
                          {child.label}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          }
          const isActive = mod.exact ? pathname === mod.href : pathname.startsWith(mod.href!)
          return (
            <Link
              key={mod.href}
              href={mod.href!}
              onClick={onClose}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                background: isActive ? 'var(--brand-light)' : 'transparent',
                color: isActive ? 'var(--brand)' : 'var(--text-muted)',
              }}
            >
              <mod.icon size={15} />
              {mod.label}
            </Link>
          )
        })}

        {session?.role === 'admin' && (
          <Link
            href="/dashboard/usuarios"
            onClick={onClose}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors mt-2"
            style={{
              background: pathname === '/dashboard/usuarios' ? 'var(--brand-light)' : 'transparent',
              color: pathname === '/dashboard/usuarios' ? 'var(--brand)' : 'var(--text-muted)',
            }}
          >
            <ShieldCheck size={15} />
            Usuários
          </Link>
        )}
      </nav>

      <div className="p-3 border-t space-y-0.5" style={{ borderColor: 'var(--border)' }}>
        {session && (
          <p className="px-3 py-1 text-xs truncate" style={{ color: 'var(--text-subtle)' }}>
            {session.username} · {session.role}
          </p>
        )}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm transition-colors"
          style={{ color: 'var(--text-muted)' }}
        >
          {dark ? <Sun size={15} /> : <Moon size={15} />}
          {dark ? 'Modo claro' : 'Modo escuro'}
        </button>
        <button
          onClick={logout}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm transition-colors"
          style={{ color: 'var(--text-muted)' }}
        >
          <LogOut size={15} />
          Sair
        </button>
      </div>
    </>
  )
}

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [session, setSession] = useState<SessionInfo | null>(null)
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const t = localStorage.getItem('theme')
    const isDark = t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)
    setDark(isDark)
    document.documentElement.classList.toggle('dark', isDark)
    fetch('/api/auth/me').then(r => r.ok ? r.json() : null).then(s => s && setSession(s))
  }, [])

  function toggleTheme() {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }

  return (
    <>
      <div className="lg:hidden fixed top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 border-b" style={{ background: 'var(--sidebar-bg)', borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="Ninja" width={28} height={28} className="rounded-lg object-contain" />
          <span className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>Ninja Company</span>
        </div>
        <button onClick={() => setMobileOpen(true)} style={{ color: 'var(--text-muted)' }}>
          <Menu size={20} />
        </button>
      </div>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-30 bg-black/30 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
      )}

      <div className={`lg:hidden fixed top-0 left-0 h-full w-64 z-40 flex flex-col shadow-xl transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`} style={{ background: 'var(--sidebar-bg)' }}>
        <NavContent onClose={() => setMobileOpen(false)} session={session} dark={dark} toggleTheme={toggleTheme} />
      </div>

      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-56 flex-col border-r z-10" style={{ background: 'var(--sidebar-bg)', borderColor: 'var(--border)' }}>
        <NavContent session={session} dark={dark} toggleTheme={toggleTheme} />
      </aside>
    </>
  )
}

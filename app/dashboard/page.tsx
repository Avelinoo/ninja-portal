import Link from 'next/link'
import { Users, Send, BarChart2, Bot } from 'lucide-react'

const apps = [
  {
    href: '/dashboard/bdr',
    label: 'BDR Leads',
    desc: 'Geração e gestão de leads via CNPJ',
    icon: Users,
    color: '#19a66a',
    status: 'online',
  },
  {
    href: '/dashboard/disparos',
    label: 'Disparos WhatsApp',
    desc: 'Envio em massa via Evolution API',
    icon: Send,
    color: '#3b82f6',
    status: 'online',
  },
  {
    href: '/dashboard/relatorios',
    label: 'Relatórios de Anúncios',
    desc: 'Dashboard Meta Ads por cliente',
    icon: BarChart2,
    color: '#8b5cf6',
    status: 'online',
  },
  {
    href: '/dashboard/gestor',
    label: 'Gestor Tráfego JR',
    desc: 'Bot Telegram de relatórios Meta',
    icon: Bot,
    color: '#f59e0b',
    status: 'online',
  },
]

export default function DashboardOverview() {
  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>Portal Ninja Company</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Acesso centralizado a todos os sistemas</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {apps.map(({ href, label, desc, icon: Icon, color, status }) => (
          <Link
            key={href}
            href={href}
            className="group bg-white rounded-2xl border p-5 hover:shadow-md transition-shadow"
            style={{ borderColor: 'var(--border)' }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}>
                <Icon size={20} style={{ color }} />
              </div>
              <span
                className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                style={{ background: status === 'online' ? '#d1fae5' : '#fee2e2', color: status === 'online' ? '#065f46' : '#991b1b' }}
              >
                {status === 'online' ? 'Online' : 'Offline'}
              </span>
            </div>
            <h3 className="text-sm font-semibold mb-1 group-hover:text-[#19a66a] transition-colors" style={{ color: 'var(--foreground)' }}>
              {label}
            </h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}

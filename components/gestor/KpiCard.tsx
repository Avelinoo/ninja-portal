import { LucideIcon } from 'lucide-react'

interface KpiCardProps {
  label: string
  value: string
  sub?: string
  icon: LucideIcon
  trend?: number
  highlight?: boolean
}

export default function KpiCard({ label, value, sub, icon: Icon, trend, highlight }: KpiCardProps) {
  return (
    <div className="bg-white rounded-xl p-3 sm:p-5 border border-gray-100 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] sm:text-xs font-medium text-gray-400 uppercase tracking-wider mb-1 sm:mb-2">{label}</p>
          <p className={`font-bold whitespace-nowrap ${highlight ? '' : 'text-gray-900'} ${value.length > 10 ? 'text-sm sm:text-xl' : value.length > 7 ? 'text-base sm:text-2xl' : 'text-lg sm:text-2xl'}`}
             style={highlight ? { color: '#19a66a' } : {}}>
            {value}
          </p>
          {sub && <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5 sm:mt-1 truncate">{sub}</p>}
        </div>
        <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center flex-shrink-0 ml-2"
             style={{ backgroundColor: 'var(--brand-light)' }}>
          <Icon size={14} style={{ color: '#19a66a' }} />
        </div>
      </div>
      {trend !== undefined && (
        <div className="mt-3 pt-3 border-t border-gray-50">
          <span className={`text-xs font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}%
          </span>
          <span className="text-xs text-gray-400 ml-1">vs período anterior</span>
        </div>
      )}
    </div>
  )
}

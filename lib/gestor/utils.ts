import { PresetPeriod, DateRange } from '@/lib/gestor/types'

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value)
}

export function formatPercent(value: number, decimals = 2): string {
  return `${value.toFixed(decimals)}%`
}

export function formatDate(dateStr: string): string {
  const datePart = dateStr.split('T')[0]
  const [, month, day] = datePart.split('-')
  return `${day}/${month}`
}

export function formatDateFull(dateStr: string): string {
  const datePart = dateStr.split('T')[0]
  const [year, month, day] = datePart.split('-')
  return `${day}/${month}/${year}`
}

export function toISO(date: Date): string {
  return date.toISOString().split('T')[0]
}

export function getPresetRange(period: PresetPeriod): DateRange {
  const today = new Date()
  const to = toISO(today)

  switch (period) {
    case 'today':
      return { from: to, to }

    case 'yesterday': {
      const d = new Date(today)
      d.setDate(d.getDate() - 1)
      const s = toISO(d)
      return { from: s, to: s }
    }

    case '7d': {
      const d = new Date(today)
      d.setDate(d.getDate() - 6)
      return { from: toISO(d), to }
    }

    case '14d': {
      const d = new Date(today)
      d.setDate(d.getDate() - 13)
      return { from: toISO(d), to }
    }

    case '28d': {
      const d = new Date(today)
      d.setDate(d.getDate() - 27)
      return { from: toISO(d), to }
    }

    case '30d': {
      const d = new Date(today)
      d.setDate(d.getDate() - 29)
      return { from: toISO(d), to }
    }

    case 'this_month': {
      const d = new Date(today.getFullYear(), today.getMonth(), 1)
      return { from: toISO(d), to }
    }

    case 'last_month': {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      const end = new Date(today.getFullYear(), today.getMonth(), 0)
      return { from: toISO(start), to: toISO(end) }
    }

    case 'maximum':
      return { from: '2020-01-01', to }

    default:
      // custom — caller provides the range
      return { from: toISO(new Date(today.setDate(today.getDate() - 6))), to: toISO(new Date()) }
  }
}

// Legacy alias kept for page.tsx overview
export function getDateRange(period: string): DateRange {
  return getPresetRange((period as PresetPeriod) || '7d')
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ')
}

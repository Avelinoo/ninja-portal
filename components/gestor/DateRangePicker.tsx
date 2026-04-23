'use client'

import { useState, useRef, useEffect } from 'react'
import { PresetPeriod, DateRange } from '@/lib/gestor/types'
import { getPresetRange } from '@/lib/gestor/utils'
import { CalendarDays, ChevronDown, X } from 'lucide-react'

const PRESETS: { label: string; value: PresetPeriod }[] = [
  { label: 'Hoje',           value: 'today' },
  { label: 'Ontem',         value: 'yesterday' },
  { label: 'Últimos 7 dias', value: '7d' },
  { label: 'Últimos 14 dias',value: '14d' },
  { label: 'Últimos 28 dias',value: '28d' },
  { label: 'Últimos 30 dias',value: '30d' },
  { label: 'Este mês',      value: 'this_month' },
  { label: 'Mês passado',   value: 'last_month' },
  { label: 'Máximo',        value: 'maximum' },
]

interface Props {
  period: PresetPeriod
  customRange: DateRange
  onChange: (period: PresetPeriod, range: DateRange) => void
}

function fmtLabel(period: PresetPeriod, range: DateRange): string {
  if (period === 'custom') {
    const fmt = (d: string) => {
      const [y, m, day] = d.split('-')
      return `${day}/${m}/${y}`
    }
    return `${fmt(range.from)} – ${fmt(range.to)}`
  }
  return PRESETS.find(p => p.value === period)?.label ?? 'Período'
}

export default function DateRangePicker({ period, customRange, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const [showCustom, setShowCustom] = useState(period === 'custom')
  const [from, setFrom] = useState(customRange.from)
  const [to, setTo] = useState(customRange.to)
  const ref = useRef<HTMLDivElement>(null)

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function selectPreset(p: PresetPeriod) {
    const range = getPresetRange(p)
    setShowCustom(false)
    onChange(p, range)
    setOpen(false)
  }

  function applyCustom() {
    if (!from || !to) return
    const range: DateRange = from <= to ? { from, to } : { from: to, to: from }
    onChange('custom', range)
    setOpen(false)
  }

  const activeRange = period === 'custom' ? customRange : getPresetRange(period)

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:border-gray-300 shadow-sm transition-colors"
      >
        <CalendarDays size={15} className="text-gray-400 shrink-0" />
        <span className="max-w-[180px] truncate">{fmtLabel(period, activeRange)}</span>
        <ChevronDown size={13} className="text-gray-400 shrink-0" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden w-72 sm:w-80">
          {/* Presets */}
          <div className="py-1.5">
            {PRESETS.map(p => (
              <button
                key={p.value}
                onClick={() => selectPreset(p.value)}
                className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                  period === p.value && !showCustom
                    ? 'font-semibold bg-green-50'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
                style={period === p.value && !showCustom ? { color: '#19a66a' } : {}}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Custom range */}
          <div className="border-t border-gray-100">
            <button
              onClick={() => setShowCustom(v => !v)}
              className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors flex items-center justify-between ${
                showCustom ? 'bg-green-50' : 'hover:bg-gray-50'
              }`}
              style={showCustom ? { color: '#19a66a' } : { color: '#374151' }}
            >
              Personalizado
              <ChevronDown size={13} className={`transition-transform ${showCustom ? 'rotate-180' : ''}`} />
            </button>

            {showCustom && (
              <div className="px-4 pb-4 pt-1 space-y-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Data inicial</label>
                  <input
                    type="date"
                    value={from}
                    max={today}
                    onChange={e => setFrom(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-green-400"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Data final</label>
                  <input
                    type="date"
                    value={to}
                    min={from}
                    max={today}
                    onChange={e => setTo(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-green-400"
                  />
                </div>
                <button
                  onClick={applyCustom}
                  disabled={!from || !to}
                  className="w-full py-2 rounded-lg text-sm font-semibold text-white transition-opacity disabled:opacity-40"
                  style={{ backgroundColor: '#19a66a' }}
                >
                  Aplicar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

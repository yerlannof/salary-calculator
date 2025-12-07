'use client'

import { useState, useRef, useEffect } from 'react'

interface DateSelectorProps {
  period: string // YYYY-MM
  selectedDate: string | null // YYYY-MM-DD or null for full month
  onChange: (date: string | null) => void
}

export default function DateSelector({ period, selectedDate, onChange }: DateSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Генерируем список дней месяца (до сегодня)
  const getDaysInPeriod = () => {
    const [year, month] = period.split('-').map(Number)
    const today = new Date()
    const lastDayOfMonth = new Date(year, month, 0).getDate()

    // Последний доступный день - либо последний день месяца, либо сегодня
    const lastAvailableDay =
      today.getFullYear() === year && today.getMonth() + 1 === month
        ? today.getDate()
        : lastDayOfMonth

    const days: { date: string; label: string; dayOfWeek: string }[] = []

    for (let day = lastAvailableDay; day >= 1; day--) {
      const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const dateObj = new Date(year, month - 1, day)
      const dayOfWeek = dateObj.toLocaleDateString('ru-RU', { weekday: 'short' })
      const label = `${day} ${dateObj.toLocaleDateString('ru-RU', { month: 'short' })}`

      days.push({ date, label, dayOfWeek })
    }

    return days
  }

  const days = getDaysInPeriod()

  // Закрытие при клике вне
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getDisplayLabel = () => {
    if (!selectedDate) return 'Весь месяц'
    const day = days.find(d => d.date === selectedDate)
    return day ? `${day.label} (${day.dayOfWeek})` : selectedDate
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-zinc-800/80 border border-zinc-700 rounded-lg text-sm font-medium text-zinc-100 hover:bg-zinc-700/80 transition-colors"
      >
        <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span>{getDisplayLabel()}</span>
        <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto">
          {/* Опция "Весь месяц" */}
          <button
            onClick={() => { onChange(null); setIsOpen(false) }}
            className={`w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-zinc-800 transition-colors border-b border-zinc-800 ${
              !selectedDate ? 'bg-cyan-900/30 text-cyan-400' : 'text-zinc-100'
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            <span className="font-medium">Весь месяц</span>
            {!selectedDate && (
              <svg className="w-4 h-4 ml-auto text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </button>

          {/* Список дней */}
          {days.map((day) => (
            <button
              key={day.date}
              onClick={() => { onChange(day.date); setIsOpen(false) }}
              className={`w-full px-4 py-2.5 text-left flex items-center justify-between hover:bg-zinc-800 transition-colors ${
                selectedDate === day.date ? 'bg-cyan-900/30 text-cyan-400' : 'text-zinc-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xs text-zinc-500 w-6">{day.dayOfWeek}</span>
                <span>{day.label}</span>
              </div>
              {selectedDate === day.date && (
                <svg className="w-4 h-4 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

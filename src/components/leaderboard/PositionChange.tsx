'use client'

interface PositionChangeProps {
  change: number // положительное = поднялся, отрицательное = упал
  prevPosition: number | null
  isNew?: boolean // новый в рейтинге
  size?: 'sm' | 'md'
}

export default function PositionChange({ change, prevPosition, isNew, size = 'md' }: PositionChangeProps) {
  const sizeClasses = size === 'sm' ? 'text-xs' : 'text-sm'
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'

  // Новый в рейтинге
  if (isNew || prevPosition === null) {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-900/40 text-purple-400 ${sizeClasses} font-medium`}>
        <svg className={iconSize} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
        </svg>
        NEW
      </span>
    )
  }

  // Без изменений
  if (change === 0) {
    return (
      <span className={`inline-flex items-center gap-1 text-zinc-500 ${sizeClasses}`}>
        <svg className={iconSize} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
        </svg>
        <span>—</span>
      </span>
    )
  }

  // Поднялся
  if (change > 0) {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-900/40 text-green-400 ${sizeClasses} font-medium`}>
        <svg className={iconSize} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
        +{change}
      </span>
    )
  }

  // Упал
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-900/40 text-red-400 ${sizeClasses} font-medium`}>
      <svg className={iconSize} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
      </svg>
      {change}
    </span>
  )
}

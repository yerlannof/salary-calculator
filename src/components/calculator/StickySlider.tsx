'use client'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { formatMoney, formatMoneyShort } from '@/lib/calculations'

interface StickySliderProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  totalSalary: number
  baseSalary: number
  totalBonus: number
}

export function StickySlider({
  value,
  onChange,
  min = 0,
  max = 6000000,
  step = 50000,
  totalSalary,
  baseSalary,
  totalBonus,
}: StickySliderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const percentage = ((value - min) / (max - min)) * 100

  return (
    <div className="bg-bg-card/95 backdrop-blur-md rounded-2xl p-4 shadow-medium border border-border-subtle">
      {/* Salary display */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">Продажи</span>
          <motion.span
            key={value}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-sm font-bold text-text-primary"
          >
            {formatMoneyShort(value)}
          </motion.span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[10px] text-text-muted">оклад + бонус</div>
            <div className="text-xs text-text-secondary">
              {formatMoneyShort(baseSalary)} + <span className="text-accent-primary font-medium">{formatMoneyShort(totalBonus)}</span>
            </div>
          </div>
          <motion.div
            key={totalSalary}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-lg font-display font-bold bg-gradient-accent bg-clip-text text-transparent"
          >
            {formatMoney(totalSalary)}
          </motion.div>
        </div>
      </div>

      {/* Compact slider */}
      <div className="relative h-8">
        {/* Background track */}
        <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-2 bg-bg-secondary rounded-full" />

        {/* Filled track */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 left-0 h-2 bg-gradient-accent rounded-full"
          style={{ width: `${percentage}%` }}
          animate={{
            width: `${percentage}%`,
            boxShadow: isDragging
              ? '0 0 20px rgb(var(--accent-primary) / 0.4)'
              : '0 0 10px rgb(var(--accent-primary) / 0.2)'
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />

        {/* Native input */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          style={{ WebkitAppearance: 'none', appearance: 'none' }}
        />

        {/* Custom thumb */}
        <motion.div
          className="absolute w-5 h-5 bg-white rounded-full border-[3px] border-accent-primary pointer-events-none shadow-md z-20"
          style={{ left: `${percentage}%`, top: '50%' }}
          animate={{
            scale: isDragging ? 1.15 : 1,
            x: '-50%',
            y: '-50%',
          }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        />
      </div>
    </div>
  )
}

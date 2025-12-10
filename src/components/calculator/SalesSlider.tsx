'use client'
import { motion } from 'framer-motion'
import { useState } from 'react'

interface SalesSliderProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
}

export function SalesSlider({
  value,
  onChange,
  min = 0,
  max = 6000000,
  step = 50000
}: SalesSliderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const percentage = ((value - min) / (max - min)) * 100

  return (
    <div className="bg-bg-card rounded-2xl p-6 shadow-soft border border-border-subtle">
      <div className="flex justify-between items-center mb-4">
        <span className="text-text-secondary">Продажи за месяц</span>
        <motion.span
          key={value}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-2xl font-display font-bold text-text-primary"
        >
          {(value / 1000000).toFixed(2)} млн
        </motion.span>
      </div>

      {/* Custom slider */}
      <div className="relative h-12 mb-6">
        {/* Background track */}
        <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-3 bg-bg-secondary rounded-full" />

        {/* Filled track with glow */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 left-0 h-3 bg-gradient-accent rounded-full"
          style={{ width: `${percentage}%` }}
          animate={{
            width: `${percentage}%`,
            boxShadow: isDragging
              ? '0 0 30px rgb(var(--accent-primary) / 0.5)'
              : '0 0 20px rgb(var(--accent-primary) / 0.3)'
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />

        {/* Native input (invisible) */}
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
          style={{
            WebkitAppearance: 'none',
            appearance: 'none'
          }}
        />

        {/* Custom thumb */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 w-7 h-7 bg-white rounded-full border-4 border-accent-primary pointer-events-none shadow-lg z-20"
          style={{ left: `calc(${percentage}% - 14px)` }}
          animate={{
            scale: isDragging ? 1.2 : 1,
            boxShadow: isDragging
              ? '0 0 30px rgb(var(--accent-primary) / 0.6)'
              : '0 4px 12px rgb(0 0 0 / 0.15)'
          }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        />
      </div>

      {/* Quick select buttons */}
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((mil) => (
          <motion.button
            key={mil}
            onClick={() => onChange(mil * 1000000)}
            whileTap={{ scale: 0.95 }}
            className={`
              flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
              ${value >= mil * 1000000 && value < (mil + 1) * 1000000
                ? 'bg-gradient-accent text-white shadow-glow'
                : 'bg-bg-secondary text-text-secondary hover:bg-bg-card hover:text-text-primary'
              }
            `}
          >
            {mil}М
          </motion.button>
        ))}
      </div>
    </div>
  )
}

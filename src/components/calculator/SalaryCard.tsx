'use client'
import { motion } from 'framer-motion'

interface SalaryCardProps {
  salary: number
  base: number
  bonus: number
  level: string
  levelPercent: number
  progress: number // 0-100
}

export function SalaryCard({ salary, base, bonus, level, levelPercent, progress }: SalaryCardProps) {
  const circumference = 2 * Math.PI * 90
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-3xl bg-gradient-accent p-8"
    >
      {/* Glass overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent pointer-events-none" />

      {/* Animated glow pulse */}
      <motion.div
        className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-[radial-gradient(circle,rgba(255,255,255,0.1)_0%,transparent_60%)] pointer-events-none"
        animate={{ opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-10 flex flex-col items-center text-white">
        {/* Circular progress */}
        <div className="relative w-52 h-52 mb-6">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
            {/* Background circle */}
            <circle
              cx="100" cy="100" r="90"
              fill="none"
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="12"
            />
            {/* Progress circle */}
            <motion.circle
              cx="100" cy="100" r="90"
              fill="none"
              stroke="white"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              style={{ filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.5))' }}
            />
          </svg>

          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xs uppercase tracking-widest opacity-80 mb-1">
              Зарплата
            </span>
            <motion.span
              key={salary}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl font-display font-extrabold"
            >
              {Math.round(salary / 1000)}к
            </motion.span>
            <span className="text-sm opacity-70 mt-1">
              {salary.toLocaleString('ru-RU')} ₸
            </span>
          </div>
        </div>

        {/* Base + Bonus pills */}
        <div className="flex items-center gap-3 mb-4">
          <span className="px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-sm">
            Оклад {base / 1000}к
          </span>
          <span className="text-white/50">+</span>
          <span className="px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm text-sm font-semibold">
            Бонус {(bonus / 1000).toFixed(1)}к
          </span>
        </div>

        {/* Level badge */}
        <div className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm flex items-center gap-2">
          <span className="text-lg">🎯</span>
          <span className="font-semibold">{level}</span>
          <span className="opacity-70">•</span>
          <span className="font-display font-bold">{levelPercent}%</span>
        </div>
      </div>
    </motion.div>
  )
}

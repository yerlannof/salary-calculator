'use client'

import { motion } from 'framer-motion'
import { Crown, Flame, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatMoneyShort } from '@/lib/calculations'
import Link from 'next/link'

export interface PodiumEmployee {
  id: string
  moysklad_id: string
  name: string
  firstName: string
  lastName: string
  netSales: number
  salary: number
  photoUrl: string | null
  streak?: number
}

interface PodiumProps {
  employees: PodiumEmployee[]
  period: string
  department: string
  className?: string
}

const PODIUM_CONFIG = [
  {
    position: 1,
    order: 1,
    height: 'h-32',
    podiumHeight: 120,
    avatarSize: 'w-24 h-24',
    avatarGlow: 'shadow-[0_0_40px_rgba(251,191,36,0.5)]',
    ringGradient: 'bg-gradient-to-br from-yellow-300 via-yellow-500 to-amber-600',
    bgGradient: 'bg-gradient-to-b from-yellow-500/40 via-yellow-600/30 to-amber-700/20',
    borderColor: 'border-yellow-400/60',
    glowColor: 'shadow-[0_0_30px_rgba(251,191,36,0.3)]',
    textGlow: 'drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]',
    crown: true,
  },
  {
    position: 2,
    order: 0,
    height: 'h-24',
    podiumHeight: 90,
    avatarSize: 'w-20 h-20',
    avatarGlow: 'shadow-[0_0_30px_rgba(148,163,184,0.4)]',
    ringGradient: 'bg-gradient-to-br from-slate-200 via-slate-400 to-slate-500',
    bgGradient: 'bg-gradient-to-b from-slate-400/40 via-slate-500/30 to-slate-600/20',
    borderColor: 'border-slate-400/60',
    glowColor: 'shadow-[0_0_20px_rgba(148,163,184,0.2)]',
    textGlow: 'drop-shadow-[0_0_6px_rgba(148,163,184,0.6)]',
    crown: false,
  },
  {
    position: 3,
    order: 2,
    height: 'h-20',
    podiumHeight: 70,
    avatarSize: 'w-18 h-18',
    avatarGlow: 'shadow-[0_0_25px_rgba(251,146,60,0.4)]',
    ringGradient: 'bg-gradient-to-br from-orange-300 via-orange-500 to-amber-700',
    bgGradient: 'bg-gradient-to-b from-orange-500/40 via-orange-600/30 to-amber-700/20',
    borderColor: 'border-orange-400/60',
    glowColor: 'shadow-[0_0_20px_rgba(251,146,60,0.2)]',
    textGlow: 'drop-shadow-[0_0_6px_rgba(251,146,60,0.6)]',
    crown: false,
  },
]

export function Podium({ employees, period, department, className }: PodiumProps) {
  if (employees.length < 3) return null

  const podiumOrder = [employees[1], employees[0], employees[2]]

  return (
    <div className={cn('py-8 relative', className)}>
      {/* Background glow effect */}
      <div className="absolute inset-0 bg-gradient-to-t from-yellow-500/5 via-transparent to-transparent pointer-events-none" />

      {/* Sparkle particles for winner */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-yellow-400 rounded-full"
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
              x: Math.cos(i * 60 * Math.PI / 180) * 40,
              y: Math.sin(i * 60 * Math.PI / 180) * 40 - 20,
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.3,
              ease: 'easeOut',
            }}
          />
        ))}
      </div>

      <div className="flex items-end justify-center gap-3 sm:gap-6 relative z-10">
        {podiumOrder.map((emp, idx) => {
          const config = PODIUM_CONFIG.find(c => c.order === idx)!
          const actualPosition = config.position
          const initials = `${emp.firstName?.[0] || ''}${emp.lastName?.[0] || ''}`
          const isWinner = actualPosition === 1

          return (
            <motion.div
              key={emp.id}
              initial={{ opacity: 0, y: 80, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                delay: isWinner ? 0.3 : idx * 0.15,
                duration: 0.5,
                type: 'spring',
                stiffness: 100,
              }}
              className="flex flex-col items-center"
            >
              <Link
                href={`/team-sales/${emp.moysklad_id}?period=${period}&dept=${department}`}
                className="flex flex-col items-center group"
              >
                {/* Crown for winner */}
                {config.crown && (
                  <motion.div
                    initial={{ y: -20, opacity: 0, rotate: -10 }}
                    animate={{ y: 0, opacity: 1, rotate: 0 }}
                    transition={{ delay: 0.6, duration: 0.4, type: 'spring' }}
                    className="mb-1"
                  >
                    <Crown className="w-8 h-8 text-yellow-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.8)]" />
                  </motion.div>
                )}

                {/* Avatar container with glow */}
                <div className={cn('relative mb-3', isWinner && 'mb-4')}>
                  {/* Outer glow ring */}
                  <motion.div
                    className={cn(
                      'absolute inset-[-4px] rounded-full opacity-60',
                      config.ringGradient
                    )}
                    animate={isWinner ? {
                      scale: [1, 1.05, 1],
                      opacity: [0.6, 0.8, 0.6],
                    } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                  />

                  {/* Avatar */}
                  <div
                    className={cn(
                      'relative rounded-full overflow-hidden transition-all duration-300 group-hover:scale-110',
                      config.avatarSize,
                      config.avatarGlow,
                      'ring-2 ring-black/20'
                    )}
                    style={{ width: isWinner ? 96 : actualPosition === 2 ? 80 : 72, height: isWinner ? 96 : actualPosition === 2 ? 80 : 72 }}
                  >
                    <img
                      src={`/api/photo/${emp.moysklad_id}`}
                      alt={emp.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        target.parentElement!.innerHTML = `<div class="w-full h-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white font-bold text-xl">${initials}</div>`
                      }}
                    />
                  </div>

                  {/* Streak badge - flame style */}
                  {emp.streak && emp.streak >= 3 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -bottom-1 -right-1 bg-gradient-to-br from-orange-500 to-red-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-0.5 shadow-lg shadow-orange-500/30 border border-orange-400/30"
                    >
                      <Flame className="w-3 h-3" />
                      <span className="font-bold">{emp.streak}</span>
                    </motion.div>
                  )}
                </div>

                {/* Name */}
                <p className={cn(
                  'font-bold text-center transition-colors line-clamp-1 max-w-[90px] sm:max-w-[110px]',
                  isWinner ? 'text-base sm:text-lg text-yellow-100' : 'text-sm sm:text-base text-slate-200',
                  'group-hover:text-white',
                  config.textGlow
                )}>
                  {emp.firstName}
                </p>

                {/* Sales amount with glow */}
                <motion.p
                  className={cn(
                    'font-black tracking-tight',
                    isWinner ? 'text-2xl sm:text-3xl text-yellow-400' : 'text-xl sm:text-2xl text-slate-100',
                    config.textGlow
                  )}
                  animate={isWinner ? {
                    textShadow: [
                      '0 0 10px rgba(251,191,36,0.5)',
                      '0 0 20px rgba(251,191,36,0.8)',
                      '0 0 10px rgba(251,191,36,0.5)',
                    ]
                  } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {formatMoneyShort(emp.netSales)}
                </motion.p>
              </Link>

              {/* 3D Podium */}
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: config.podiumHeight, opacity: 1 }}
                transition={{ delay: idx * 0.15 + 0.4, duration: 0.4, ease: 'easeOut' }}
                className="relative mt-3"
              >
                {/* Front face */}
                <div
                  className={cn(
                    'w-24 sm:w-28 rounded-t-xl border-x-2 border-t-2 relative overflow-hidden',
                    config.bgGradient,
                    config.borderColor,
                    config.glowColor
                  )}
                  style={{ height: config.podiumHeight }}
                >
                  {/* Metallic shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0" />

                  {/* Position number */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={cn(
                      'font-black opacity-30',
                      isWinner ? 'text-6xl text-yellow-300' : actualPosition === 2 ? 'text-5xl text-slate-300' : 'text-4xl text-orange-300'
                    )}>
                      {actualPosition}
                    </span>
                  </div>

                  {/* Bottom edge for 3D effect */}
                  <div className={cn(
                    'absolute bottom-0 left-0 right-0 h-2',
                    isWinner ? 'bg-yellow-700/50' : actualPosition === 2 ? 'bg-slate-600/50' : 'bg-orange-700/50'
                  )} />
                </div>
              </motion.div>
            </motion.div>
          )
        })}
      </div>

      {/* Platform base with glow */}
      <motion.div
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.3 }}
        className="h-3 bg-gradient-to-r from-transparent via-slate-700 to-transparent rounded-full mx-8 mt-0 shadow-[0_0_20px_rgba(100,116,139,0.3)]"
      />
    </div>
  )
}

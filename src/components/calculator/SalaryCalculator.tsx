"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { motion } from "framer-motion"
import { calculateSalary, formatMoney, formatMoneyShort, SalaryCalculationResult } from "@/lib/calculations"
import { LOCATIONS } from "@/config/salary-scales"
import { cn } from "@/lib/utils"
import { useTheme } from "@/components/theme/ThemeProvider"
import { getIconComponent } from "@/components/calculator/LevelIcon"

// "What if" scenarios
const WHAT_IF_AMOUNTS = [500000, 1000000, 2000000]

// Level color schemes based on progress
const getLevelTheme = (sales: number) => {
  if (sales < 2000000) return {
    gradient: 'from-red-500 to-orange-500',
    ring: '#ef4444',
    glow: 'rgba(239, 68, 68, 0.3)',
    text: 'text-red-500 dark:text-red-400',
    bg: 'bg-red-500/10',
    name: 'Начальный',
  }
  if (sales < 3000000) return {
    gradient: 'from-amber-500 to-yellow-500',
    ring: '#f59e0b',
    glow: 'rgba(245, 158, 11, 0.3)',
    text: 'text-amber-500 dark:text-amber-400',
    bg: 'bg-amber-500/10',
    name: 'Средний',
  }
  if (sales < 4000000) return {
    gradient: 'from-emerald-500 to-teal-500',
    ring: '#10b981',
    glow: 'rgba(16, 185, 129, 0.3)',
    text: 'text-emerald-500 dark:text-emerald-400',
    bg: 'bg-emerald-500/10',
    name: 'Целевой',
  }
  return {
    gradient: 'from-violet-500 to-purple-600',
    ring: '#8b5cf6',
    glow: 'rgba(139, 92, 246, 0.3)',
    text: 'text-violet-500 dark:text-violet-400',
    bg: 'bg-violet-500/10',
    name: 'Профи',
  }
}

export function SalaryCalculator() {
  const { theme, toggleTheme } = useTheme()
  const [selectedLocationId, setSelectedLocationId] = useState(LOCATIONS[0].id)
  const [selectedRoleId, setSelectedRoleId] = useState(LOCATIONS[0].roles[0].id)
  const [sales, setSales] = useState(3000000)
  const [isAnimating, setIsAnimating] = useState(false)
  const [showHowItWorks, setShowHowItWorks] = useState(false)
  const [isSliderSticky, setIsSliderSticky] = useState(false)
  const [isDraggingSlider, setIsDraggingSlider] = useState(false)
  const prevSalaryRef = useRef(0)
  const sliderSentinelRef = useRef<HTMLDivElement>(null)

  const selectedLocation = useMemo(() =>
    LOCATIONS.find(l => l.id === selectedLocationId) || LOCATIONS[0],
    [selectedLocationId]
  )

  const selectedRole = useMemo(() =>
    selectedLocation.roles.find(r => r.id === selectedRoleId) || selectedLocation.roles[0],
    [selectedLocation, selectedRoleId]
  )

  useEffect(() => {
    const location = LOCATIONS.find(l => l.id === selectedLocationId)
    if (location && location.roles.length > 0) {
      setSelectedRoleId(location.roles[0].id)
    }
  }, [selectedLocationId])

  const maxSales = selectedRole.maxMonthlySales || 6000000

  // Memoize calculation result to avoid unnecessary recalculations
  const result = useMemo(() => {
    const calculationResult = calculateSalary(sales, selectedRole)

    // Trigger animation only when salary changes significantly
    if (Math.abs(calculationResult.totalSalary - prevSalaryRef.current) > 1000) {
      setIsAnimating(true)
      setTimeout(() => setIsAnimating(false), 300)
    }
    prevSalaryRef.current = calculationResult.totalSalary

    return calculationResult
  }, [sales, selectedRole])

  // Scroll listener for sticky slider detection
  useEffect(() => {
    const sentinel = sliderSentinelRef.current
    if (!sentinel) return

    const handleScroll = () => {
      const rect = sentinel.getBoundingClientRect()
      // When sentinel top is at or above header (60px), slider is sticky
      setIsSliderSticky(rect.top <= 60)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Check initial state

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Calculate "what if" scenarios
  const whatIfScenarios = useMemo(() => {
    return WHAT_IF_AMOUNTS.map(extraAmount => {
      const newSales = sales + extraAmount
      if (newSales > maxSales) return null
      const newResult = calculateSalary(newSales, selectedRole)
      const extraBonus = newResult.totalSalary - (result?.totalSalary || 0)
      return {
        extraSales: extraAmount,
        newSales,
        extraBonus,
        newTotal: newResult.totalSalary,
      }
    }).filter(Boolean)
  }, [sales, selectedRole, result, maxSales])

  const progressPercent = (sales / maxSales) * 100
  const circumference = 2 * Math.PI * 90
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference
  const levelTheme = getLevelTheme(sales)

  return (
    <div className="calc-container">
      {/* Header with glassmorphism */}
      <header className="sticky top-0 z-20 backdrop-blur-md bg-bg-card/80 border-b border-border-subtle shadow-soft">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn("w-2 h-2 rounded-full animate-pulse", levelTheme.bg, levelTheme.text.replace('text-', 'bg-').split(' ')[0])} />
            <span className="text-xs font-medium tracking-wider uppercase text-text-secondary">
              GameOver
            </span>
          </div>
          <h1 className="text-base font-semibold text-text-primary">
            Калькулятор ЗП
          </h1>

          {/* Theme Toggle - Enhanced with motion */}
          <button
            onClick={toggleTheme}
            className="relative w-14 h-8 bg-bg-secondary rounded-full p-1 transition-colors border border-border-subtle"
            aria-label="Переключить тему"
          >
            <motion.div
              className="w-6 h-6 bg-gradient-accent rounded-full shadow-medium flex items-center justify-center"
              animate={{ x: theme === 'dark' ? 24 : 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <span className="text-xs">
                {theme === 'dark' ? '🌙' : '☀️'}
              </span>
            </motion.div>
          </button>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">

        {/* Location Pills - Animated */}
        <div className="flex flex-wrap gap-2 animate-fade-in-up opacity-0" style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}>
          {LOCATIONS.map((location) => (
            <button
              key={location.id}
              onClick={() => setSelectedLocationId(location.id)}
              className={cn(
                "pill-btn text-sm font-medium transition-all duration-200 active:scale-95",
                selectedLocationId === location.id && "active"
              )}
            >
              <span className="mr-1.5">{location.emoji}</span>
              {location.name}
            </button>
          ))}
        </div>

        {/* Role Pills */}
        {selectedLocation.roles.length > 1 && (
          <div className="flex gap-2 animate-fade-in-up opacity-0" style={{ animationDelay: '50ms', animationFillMode: 'forwards' }}>
            {selectedLocation.roles.map((role) => (
              <button
                key={role.id}
                onClick={() => setSelectedRoleId(role.id)}
                className={cn(
                  "flex-1 py-3 px-4 rounded-2xl text-sm font-medium transition-all duration-200 active:scale-[0.98]",
                  selectedRoleId === role.id
                    ? "backdrop-blur-md bg-bg-card border border-accent-primary shadow-soft text-text-primary"
                    : "bg-black/5 dark:bg-white/5 text-text-secondary hover:bg-black/10 dark:hover:bg-white/10"
                )}
              >
                {role.name}
              </button>
            ))}
          </div>
        )}

        {/* Main Salary Card with Gradient - REDESIGNED with motion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative rounded-3xl p-8 overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
            boxShadow: '0 20px 60px rgba(16, 185, 129, 0.3)',
          }}
        >
          {/* Glass overlay for glassmorphism */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent pointer-events-none" />

          {/* Animated glow pulse with motion */}
          <motion.div
            className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-[radial-gradient(circle,rgba(255,255,255,0.1)_0%,transparent_60%)] pointer-events-none"
            animate={{ opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />

          <div className="relative z-10 flex flex-col items-center">
            {/* Circular Progress Ring - Enhanced */}
            <div className="relative w-52 h-52 mb-6">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
                {/* Gradient definition */}
                <defs>
                  <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.9)" />
                    <stop offset="100%" stopColor="rgba(255,255,255,0.5)" />
                  </linearGradient>
                </defs>

                {/* Background circle */}
                <circle
                  cx="100"
                  cy="100"
                  r="90"
                  fill="none"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="12"
                />

                {/* Progress circle with motion */}
                <motion.circle
                  cx="100"
                  cy="100"
                  r="90"
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
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                <span className="text-xs uppercase tracking-widest opacity-80 mb-1">
                  Зарплата
                </span>
                <motion.span
                  key={result.totalSalary}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-5xl font-display font-extrabold tracking-tight tabular-nums"
                >
                  {Math.round(result.totalSalary / 1000)}к
                </motion.span>
                <span className="text-sm opacity-70 mt-1 tabular-nums">
                  {formatMoney(result.totalSalary)}
                </span>
              </div>
            </div>

            {/* Base + Bonus pills */}
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-sm text-white/90">
                Оклад {formatMoneyShort(result.baseSalary)}
              </span>
              <span className="text-white/50">+</span>
              <span className="px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm text-sm font-semibold text-white">
                Бонус {formatMoneyShort(result.totalBonus)}
              </span>
            </div>

            {/* Level badge */}
            <div className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm flex items-center gap-2 text-white">
              {result.currentTier?.levelEmoji && (() => {
                const IconComponent = getIconComponent(result.currentTier.levelEmoji)
                return <IconComponent className="w-5 h-5" />
              })()}
              <span className="font-semibold">{result.currentTier?.levelName}</span>
              <span className="opacity-70">•</span>
              <span className="font-display font-bold">{result.currentTier?.percentage}%</span>
            </div>
          </div>
        </motion.div>

        {/* Sentinel for sticky detection */}
        <div ref={sliderSentinelRef} className="h-0" />

        {/* Sales Slider Section - REDESIGNED with glow */}
        <div
          className={cn(
            "sticky top-[60px] z-10 backdrop-blur-md bg-bg-card border border-border-subtle animate-fade-in-up opacity-0 transition-all duration-300",
            isSliderSticky
              ? "rounded-2xl p-4 shadow-lg"
              : "rounded-3xl p-6 shadow-soft"
          )}
          style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}
        >
          {/* Header row */}
          <div className={cn(
            "flex items-center justify-between transition-all",
            isSliderSticky ? "mb-2" : "mb-4"
          )}>
            <span className={cn(
              "font-medium text-text-secondary transition-all",
              isSliderSticky ? "text-xs" : "text-sm"
            )}>
              Продажи за месяц
            </span>
            <div className="flex items-center gap-2">
              {isSliderSticky && (
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1",
                  levelTheme.bg, levelTheme.text
                )}>
                  {result.currentTier?.levelEmoji && (() => {
                    const IconComponent = getIconComponent(result.currentTier.levelEmoji)
                    return <IconComponent className="w-3 h-3" />
                  })()} {result.currentTier?.percentage}%
                </span>
              )}
              <span className={cn(
                "font-display font-bold tabular-nums text-text-primary transition-all",
                isSliderSticky ? "text-base" : "text-2xl"
              )}>
                {(sales / 1000000).toFixed(2)} млн
              </span>
            </div>
          </div>

          {/* Custom Slider with glow */}
          <div className={cn("relative transition-all", isSliderSticky ? "py-1" : "py-2")}>
            {/* Background track */}
            <div className={cn(
              "absolute top-1/2 left-0 right-0 -translate-y-1/2 rounded-full bg-bg-secondary transition-all",
              isSliderSticky ? "h-1.5" : "h-3"
            )} />

            {/* Filled track with glow */}
            <div
              className={cn("absolute top-1/2 left-0 -translate-y-1/2 rounded-full bg-gradient-accent transition-all duration-200",
                isSliderSticky ? "h-1.5" : "h-3"
              )}
              style={{
                width: `${progressPercent}%`,
                boxShadow: isSliderSticky
                  ? 'none'
                  : `0 0 30px ${levelTheme.glow}`,
              }}
            />

            {/* Native input with visible thumb */}
            <input
              type="range"
              min={0}
              max={maxSales}
              step={50000}
              value={sales}
              onChange={(e) => setSales(Number(e.target.value))}
              onMouseDown={() => setIsDraggingSlider(true)}
              onMouseUp={() => setIsDraggingSlider(false)}
              onTouchStart={() => setIsDraggingSlider(true)}
              onTouchEnd={() => setIsDraggingSlider(false)}
              className={cn(
                "calc-slider relative z-10 bg-transparent transition-all",
                isSliderSticky && "calc-slider-compact",
                isDraggingSlider && "calc-slider-dragging"
              )}
            />
          </div>

          {/* Quick select buttons - only when not sticky */}
          {!isSliderSticky && (
            <div className="flex gap-2 mt-4">
              {[1, 2, 3, 4, 5].map((mil) => (
                <motion.button
                  key={mil}
                  onClick={() => setSales(mil * 1000000)}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border",
                    sales >= mil * 1000000 && sales < (mil + 1) * 1000000
                      ? "bg-gradient-accent text-white shadow-glow border-transparent"
                      : "bg-bg-secondary text-text-secondary border-border-subtle hover:bg-bg-card hover:text-text-primary hover:border-accent-primary/30"
                  )}
                >
                  {mil}М
                </motion.button>
              ))}
            </div>
          )}

          {/* Salary display - only in sticky mode */}
          {isSliderSticky && (
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-border-subtle">
              <span className="text-xs text-text-secondary">Зарплата</span>
              <span className="text-sm font-bold tabular-nums text-text-primary">
                {formatMoney(result.totalSalary)}
              </span>
            </div>
          )}
        </div>

        {/* Detailed Breakdown Section */}
        <div
          className="backdrop-blur-md bg-bg-card border border-border-subtle shadow-soft rounded-3xl p-5 animate-fade-in-up opacity-0"
          style={{ animationDelay: '250ms', animationFillMode: 'forwards' }}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-[var(--calc-text-secondary)]">
              Детализация бонусов
            </span>
            <span className={cn("text-sm font-bold tabular-nums", levelTheme.text)}>
              {formatMoneyShort(result.totalBonus)}
            </span>
          </div>

          <div className="space-y-2">
            {result.breakdown.map((tier, index) => {
              if (tier.bonusAmount === 0 && !tier.isCurrentTier && !tier.isCompleted) return null

              return (
                <div
                  key={index}
                  className={cn(
                    "flex items-center justify-between py-2 px-3 rounded-xl transition-all",
                    tier.isCurrentTier && "bg-black/5 dark:bg-white/10"
                  )}
                >
                  <div className="flex items-center gap-2">
                    {(() => {
                      const IconComponent = getIconComponent(tier.levelEmoji)
                      return <IconComponent className="w-4 h-4" />
                    })()}
                    <div>
                      <span className={cn(
                        "text-sm font-medium",
                        tier.isCurrentTier ? "text-[var(--calc-text-primary)]" : "text-[var(--calc-text-secondary)]"
                      )}>
                        {tier.levelName}
                      </span>
                      <span className="text-xs text-[var(--calc-text-secondary)] ml-2">
                        ({tier.percentage}%)
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    {tier.bonusAmount > 0 ? (
                      <span className={cn(
                        "text-sm font-bold tabular-nums",
                        tier.isCurrentTier ? levelTheme.text : "text-[var(--calc-text-primary)]"
                      )}>
                        +{formatMoneyShort(tier.bonusAmount)}
                      </span>
                    ) : (
                      <span className="text-xs text-[var(--calc-text-secondary)]">—</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Calculation formula */}
          <div className="mt-4 pt-4 border-t border-black/5 dark:border-white/10">
            <div className="text-xs text-[var(--calc-text-secondary)] space-y-1 font-mono">
              <div className="flex justify-between">
                <span>Оклад</span>
                <span>{formatMoney(result.baseSalary)}</span>
              </div>
              <div className="flex justify-between">
                <span>+ Бонус</span>
                <span>{formatMoney(result.totalBonus)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-black/5 dark:border-white/10 text-sm font-bold text-[var(--calc-text-primary)]">
                <span>= Итого</span>
                <span>{formatMoney(result.totalSalary)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Level Progress Section */}
        <div
          className="backdrop-blur-md bg-bg-card border border-border-subtle shadow-soft rounded-3xl p-5 animate-fade-in-up opacity-0"
          style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-[var(--calc-text-secondary)]">
              Прогресс по уровням
            </span>
            <span className="text-xs px-2 py-1 rounded-full bg-[var(--calc-accent-primary)]/10 text-[var(--calc-accent-primary)] font-medium">
              {result.breakdown.filter(t => t.isCompleted).length}/{result.breakdown.length}
            </span>
          </div>

          <div className="space-y-2">
            {result.breakdown.map((tier, index) => {
              const tierSize = tier.maxSales - tier.minSales
              const fillPercent = tier.isCompleted ? 100 : tier.isCurrentTier
                ? (tier.salesInTier / tierSize) * 100
                : 0

              return (
                <div
                  key={index}
                  className={cn(
                    "level-row",
                    tier.isCurrentTier && "current",
                    tier.isCompleted && "completed",
                    !tier.isCompleted && !tier.isCurrentTier && "locked"
                  )}
                >
                  {/* Icon */}
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-base mr-3 bg-black/5 dark:bg-white/10">
                    {tier.isCompleted ? '✓' : (() => {
                      const IconComponent = getIconComponent(tier.levelEmoji)
                      return <IconComponent className="w-4 h-4" />
                    })()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className={cn(
                        "text-sm font-medium truncate",
                        tier.isCurrentTier ? "text-[var(--calc-text-primary)]" : "text-[var(--calc-text-secondary)]"
                      )}>
                        {tier.levelName}
                      </span>
                      <span className={cn(
                        "text-sm font-bold tabular-nums ml-2",
                        tier.isCurrentTier ? levelTheme.text : "text-[var(--calc-text-secondary)]"
                      )}>
                        {tier.percentage}%
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="h-1.5 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500 ease-out",
                          tier.isCompleted
                            ? "bg-black/20 dark:bg-white/30"
                            : tier.isCurrentTier
                              ? cn("bg-gradient-to-r", levelTheme.gradient)
                              : ""
                        )}
                        style={{ width: `${fillPercent}%` }}
                      />
                    </div>

                    {/* Range info */}
                    <div className="mt-1 flex justify-between text-[10px] text-[var(--calc-text-secondary)]">
                      <span>{formatMoneyShort(tier.minSales)}</span>
                      <span>{formatMoneyShort(tier.maxSales)}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* "What If" Motivation Cards */}
        {whatIfScenarios.length > 0 && (
          <div
            className="animate-fade-in-up opacity-0"
            style={{ animationDelay: '350ms', animationFillMode: 'forwards' }}
          >
            <div className="mb-3">
              <div className="text-sm font-medium text-[var(--calc-text-secondary)]">
                А что если продать ещё?
              </div>
              <div className="text-[10px] text-[var(--calc-text-secondary)] mt-0.5">
                Нажми, чтобы увидеть расчёт
              </div>
            </div>
            <div className="grid gap-2">
              {whatIfScenarios.map((scenario, index) => scenario && (
                <button
                  key={index}
                  onClick={() => setSales(scenario.newSales)}
                  className="backdrop-blur-md bg-bg-card border border-border-subtle shadow-soft rounded-3xl p-4 text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-[var(--calc-text-secondary)]">
                          {formatMoneyShort(sales)} → {formatMoneyShort(scenario.newSales)}
                        </span>
                        <span className="text-xs px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 text-accent-primary font-semibold">
                          +{scenario.extraSales >= 1000000 ? `${scenario.extraSales / 1000000}M` : `${scenario.extraSales / 1000}к`}
                        </span>
                      </div>
                      <div className="text-base font-bold text-[var(--calc-text-primary)] mb-0.5">
                        {formatMoney(scenario.newTotal)}
                      </div>
                      <div className="text-xs text-emerald-500 dark:text-emerald-400 font-medium">
                        +{formatMoneyShort(scenario.extraBonus)} к текущей
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-[var(--calc-text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Next Level Motivation Card */}
        {result.nextTier && result.salesUntilNextTier > 0 && (
          <div
            className="backdrop-blur-md bg-bg-card border border-border-subtle shadow-soft rounded-3xl p-5 animate-fade-in-up opacity-0"
            style={{
              animationDelay: '400ms',
              animationFillMode: 'forwards',
            }}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-black/5 dark:bg-white/10 flex items-center justify-center text-accent-primary">
                {(() => {
                  const IconComponent = getIconComponent(result.nextTier.levelEmoji)
                  return <IconComponent className="w-6 h-6" />
                })()}
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-[var(--calc-text-primary)]">
                  До «{result.nextTier.levelName}» осталось
                </div>
                <div className="text-xs text-[var(--calc-text-secondary)] mt-0.5">
                  Продай ещё <span className="font-semibold text-accent-primary">{formatMoneyShort(result.salesUntilNextTier)}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-wider text-[var(--calc-text-secondary)]">
                  бонус
                </div>
                <div className="text-xl font-bold text-accent-primary">
                  +{result.nextTier.percentage}%
                </div>
              </div>
            </div>
          </div>
        )}

        {/* How It Works Section */}
        <div
          className="backdrop-blur-md bg-bg-card border border-border-subtle shadow-soft rounded-3xl overflow-hidden animate-fade-in-up opacity-0"
          style={{ animationDelay: '450ms', animationFillMode: 'forwards' }}
        >
          <button
            onClick={() => setShowHowItWorks(!showHowItWorks)}
            className="w-full p-5 flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-[var(--calc-text-primary)]">
                Как это работает?
              </span>
            </div>
            <svg
              className={cn("w-5 h-5 text-[var(--calc-text-secondary)] transition-transform", showHowItWorks && "rotate-180")}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showHowItWorks && (
            <div className="px-5 pb-5 space-y-4 border-t border-black/5 dark:border-white/10 pt-4">
              <p className="text-sm text-[var(--calc-text-secondary)]">
                Бонус считается <strong className="text-[var(--calc-text-primary)]">накопительно</strong> — каждый миллион продаж идёт по своему проценту:
              </p>

              <div className="space-y-2">
                {result.breakdown.map((tier, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs">
                    <span className="w-6 flex items-center justify-center">
                      {(() => {
                        const IconComponent = getIconComponent(tier.levelEmoji)
                        return <IconComponent className="w-4 h-4" />
                      })()}
                    </span>
                    <span className="flex-1 text-[var(--calc-text-secondary)]">
                      {formatMoneyShort(tier.minSales)} – {formatMoneyShort(tier.maxSales)}
                    </span>
                    <span className={cn(
                      "font-bold tabular-nums",
                      tier.percentage === 7 ? "text-emerald-500" : "text-[var(--calc-text-primary)]"
                    )}>
                      {tier.percentage}%
                      {tier.percentage === 7 && <span className="ml-1 text-[10px]">скачок!</span>}
                    </span>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                  <span>🎯</span>
                  <span>Цель: 3 млн продаж = {formatMoney(calculateSalary(3000000, selectedRole).totalSalary)}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-xs font-medium">
                  <span>⚠️</span>
                  <span>Меньше 2 млн — слабый результат</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Salary Reference Table */}
        <div
          className="backdrop-blur-md bg-bg-card border border-border-subtle shadow-soft rounded-3xl p-5 animate-fade-in-up opacity-0"
          style={{ animationDelay: '500ms', animationFillMode: 'forwards' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-medium text-[var(--calc-text-secondary)]">
              Таблица зарплат
            </div>
            <div className="text-[10px] px-2 py-1 rounded-full bg-black/5 dark:bg-white/10 text-[var(--calc-text-secondary)]">
              оклад + бонус
            </div>
          </div>

          <div className="space-y-1.5">
            {[1000000, 2000000, 3000000, 4000000, 5000000, 6000000].map((salesAmount) => {
              const calc = calculateSalary(salesAmount, selectedRole)
              const isTarget = salesAmount === 3000000
              const isWarning = salesAmount === 2000000
              const isCurrent = Math.abs(sales - salesAmount) < 100000

              return (
                <button
                  key={salesAmount}
                  onClick={() => setSales(salesAmount)}
                  className={cn(
                    "w-full flex items-center justify-between py-3 px-4 rounded-xl transition-all duration-200 active:scale-[0.98]",
                    isCurrent
                      ? "backdrop-blur-md bg-bg-card border border-border-subtle shadow-md"
                      : "hover:bg-black/5 dark:hover:bg-white/5"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-display tabular-nums text-[var(--calc-text-secondary)] font-medium">
                      {salesAmount / 1000000} млн
                    </span>
                    {isTarget && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
                        ЦЕЛЬ
                      </span>
                    )}
                    {isWarning && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-amber-500/20 text-amber-600 dark:text-amber-400">
                        МИН
                      </span>
                    )}
                  </div>
                  <span className={cn(
                    "text-base font-display font-bold tabular-nums",
                    isCurrent ? levelTheme.text : "text-[var(--calc-text-primary)]"
                  )}>
                    {formatMoney(calc.totalSalary)}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center py-6 animate-fade-in-up opacity-0" style={{ animationDelay: '600ms', animationFillMode: 'forwards' }}>
          <span className="text-xs text-[var(--calc-text-secondary)]">
            GameOver Shop · Версия 10.12.2025
          </span>
        </footer>
      </div>
    </div>
  )
}

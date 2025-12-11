"use client"

import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { calculateSalary, formatMoney, formatMoneyShort } from "@/lib/calculations"
import { LOCATIONS } from "@/config/salary-scales"
import { SalaryCard } from "./SalaryCard"
import { SalesSlider } from "./SalesSlider"
import { ThemeToggle } from "./ThemeToggle"
import { MapPin, Users, ChevronDown, Target, TrendingUp, Sprout, ShoppingBag, Star, Flame, Zap, Crown } from "lucide-react"
import { cn } from "@/lib/utils"

// "What if" scenarios
const WHAT_IF_AMOUNTS = [500000, 1000000, 2000000]

// Level icons mapping
const LEVEL_ICONS: Record<string, React.ElementType> = {
  'Новичок': Sprout,
  'Продавец': ShoppingBag,
  'Опытный': Star,
  'Мастер': Flame,
  'Профи': Zap,
  'Легенда': Crown,
}

export function SalaryCalculator() {
  // Location & Role selection
  const [selectedLocationId, setSelectedLocationId] = useState(LOCATIONS[0].id)
  const [selectedRoleId, setSelectedRoleId] = useState(LOCATIONS[0].roles[0].id)
  const [sales, setSales] = useState(3000000)
  const [showHowItWorks, setShowHowItWorks] = useState(false)

  const selectedLocation = useMemo(() =>
    LOCATIONS.find(l => l.id === selectedLocationId) || LOCATIONS[0],
    [selectedLocationId]
  )

  const selectedRole = useMemo(() =>
    selectedLocation.roles.find(r => r.id === selectedRoleId) || selectedLocation.roles[0],
    [selectedLocation, selectedRoleId]
  )

  // When location changes, select first role of that location
  useEffect(() => {
    const location = LOCATIONS.find(l => l.id === selectedLocationId)
    if (location && location.roles.length > 0) {
      setSelectedRoleId(location.roles[0].id)
    }
  }, [selectedLocationId])

  const maxSales = selectedRole.maxMonthlySales || 6000000

  // Calculate salary
  const result = useMemo(() => {
    return calculateSalary(sales, selectedRole)
  }, [sales, selectedRole])

  // Load from localStorage on mount
  useEffect(() => {
    const savedLocation = localStorage.getItem('selectedLocation')
    const savedRole = localStorage.getItem('selectedRole')
    const savedSales = localStorage.getItem('lastSales')

    if (savedLocation) {
      const location = LOCATIONS.find(l => l.id === savedLocation)
      if (location) {
        setSelectedLocationId(savedLocation)
        if (savedRole) {
          const role = location.roles.find(r => r.id === savedRole)
          if (role) setSelectedRoleId(savedRole)
        }
      }
    }

    if (savedSales) {
      const savedValue = parseInt(savedSales, 10)
      if (!isNaN(savedValue) && savedValue >= 0 && savedValue <= maxSales) {
        setSales(savedValue)
      }
    }
  }, [maxSales])

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem('lastSales', sales.toString())
    localStorage.setItem('selectedLocation', selectedLocationId)
    localStorage.setItem('selectedRole', selectedRoleId)
  }, [sales, selectedLocationId, selectedRoleId])

  // Calculate progress for circular indicator (0-100)
  const progress = result.currentTier
    ? ((sales - result.currentTier.minSales) / (result.currentTier.maxSales - result.currentTier.minSales)) * 100
    : 0

  // Calculate "what if" scenarios
  const whatIfScenarios = useMemo(() => {
    return WHAT_IF_AMOUNTS.map(extraAmount => {
      const newSales = sales + extraAmount
      if (newSales > maxSales) return null
      const newResult = calculateSalary(newSales, selectedRole)
      const extraBonus = newResult.totalSalary - result.totalSalary
      return {
        extraSales: extraAmount,
        newSales,
        extraBonus,
        newTotal: newResult.totalSalary,
      }
    }).filter(Boolean)
  }, [sales, selectedRole, result, maxSales])

  return (
    <div className="space-y-6">
      {/* Header with theme toggle */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold text-text-primary">
          Калькулятор ЗП
        </h1>
        <ThemeToggle />
      </div>

      {/* Location & Role Selector */}
      <div className="bg-bg-card rounded-2xl p-5 shadow-soft border border-border-subtle space-y-4">
        {/* Location selector */}
        <div>
          <label className="text-xs text-text-muted flex items-center gap-1.5 mb-2">
            <MapPin className="w-3.5 h-3.5" />
            Точка
          </label>
          <div className="flex gap-2 flex-wrap">
            {LOCATIONS.map((location) => (
              <motion.button
                key={location.id}
                onClick={() => setSelectedLocationId(location.id)}
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  selectedLocationId === location.id
                    ? "bg-gradient-accent text-white shadow-glow"
                    : "bg-bg-secondary text-text-secondary hover:bg-bg-card"
                )}
              >
                <span>{location.emoji}</span>
                <span>{location.name}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Role selector */}
        <div>
          <label className="text-xs text-text-muted flex items-center gap-1.5 mb-2">
            <Users className="w-3.5 h-3.5" />
            Должность
          </label>
          <div className="flex gap-2 flex-wrap">
            {selectedLocation.roles.map((role) => (
              <motion.button
                key={role.id}
                onClick={() => setSelectedRoleId(role.id)}
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className={cn(
                  "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  selectedRoleId === role.id
                    ? "bg-gradient-accent text-white shadow-glow"
                    : "bg-bg-secondary text-text-secondary hover:bg-bg-card"
                )}
              >
                {role.name}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Main salary card with circular progress */}
      <SalaryCard
        salary={result.totalSalary}
        base={result.baseSalary}
        bonus={result.totalBonus}
        level={result.currentTier?.levelName || 'Новичок'}
        levelPercent={result.currentTier?.percentage || 3}
        progress={progress}
      />

      {/* Sales slider - sticky */}
      <div className="sticky top-0 z-30 -mx-4 px-4 py-2 bg-bg-primary/80 backdrop-blur-lg">
        <SalesSlider
          value={sales}
          onChange={setSales}
          max={maxSales}
        />
      </div>

      {/* Breakdown */}
      <div className="bg-bg-card rounded-2xl p-5 shadow-soft border border-border-subtle">
        <h3 className="text-sm font-semibold text-text-primary mb-3">
          Детализация
        </h3>
        <div className="space-y-2">
          {result.breakdown.map((tier, idx) => {
            const amount = tier.bonusAmount
            if (amount === 0) return null

            return (
              <div
                key={idx}
                className="flex items-center justify-between py-2 border-b border-border-subtle last:border-0"
              >
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    tier.isCurrentTier ? "bg-accent-primary" : "bg-text-muted"
                  )} />
                  <span className="text-sm text-text-secondary">
                    {tier.levelName} ({tier.percentage}%)
                  </span>
                </div>
                <span className="text-sm font-semibold text-text-primary">
                  {amount.toLocaleString('ru-RU')} ₸
                </span>
              </div>
            )
          })}
        </div>
        <div className="mt-4 pt-4 border-t border-border-subtle flex justify-between items-center">
          <span className="text-sm font-semibold text-text-primary">
            Итого бонус:
          </span>
          <span className="text-lg font-display font-bold bg-gradient-accent bg-clip-text text-transparent">
            {result.totalBonus.toLocaleString('ru-RU')} ₸
          </span>
        </div>
      </div>

      {/* Level Progress Section */}
      <div className="bg-bg-card rounded-2xl p-5 shadow-soft border border-border-subtle">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <Target className="w-4 h-4" />
            Прогресс по уровням
          </h3>
          <span className="text-xs px-2 py-1 rounded-full bg-accent-primary/10 text-accent-primary font-medium">
            {result.breakdown.filter(t => t.isCompleted).length}/{result.breakdown.length}
          </span>
        </div>
        <div className="space-y-3">
          {result.breakdown.map((tier, index) => {
            const tierSize = tier.maxSales - tier.minSales
            const fillPercent = tier.isCompleted ? 100 : tier.isCurrentTier
              ? (tier.salesInTier / tierSize) * 100
              : 0
            const LevelIcon = LEVEL_ICONS[tier.levelName] || Star

            return (
              <div key={index} className="flex items-center gap-3">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center",
                  tier.isCompleted ? "bg-accent-primary text-white" :
                  tier.isCurrentTier ? "bg-accent-primary/20 text-accent-primary" :
                  "bg-bg-secondary text-text-muted"
                )}>
                  {tier.isCompleted ? '✓' : <LevelIcon className="w-4 h-4" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className={cn(
                      "text-sm font-medium",
                      tier.isCurrentTier ? "text-text-primary" : "text-text-secondary"
                    )}>
                      {tier.levelName}
                    </span>
                    <span className={cn(
                      "text-sm font-bold",
                      tier.isCurrentTier ? "text-accent-primary" : "text-text-muted"
                    )}>
                      {tier.percentage}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-bg-secondary rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-accent rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${fillPercent}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <div className="flex justify-between mt-1 text-[10px] text-text-muted">
                    <span>{formatMoneyShort(tier.minSales)}</span>
                    <span>{formatMoneyShort(tier.maxSales)}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* What If Section */}
      {whatIfScenarios.length > 0 && (
        <div className="bg-bg-card rounded-2xl p-5 shadow-soft border border-border-subtle">
          <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4" />
            А что если продать ещё?
          </h3>
          <p className="text-xs text-text-muted mb-4">Нажми, чтобы увидеть расчёт</p>
          <div className="space-y-2">
            {whatIfScenarios.map((scenario: any, index) => scenario && (
              <motion.button
                key={index}
                onClick={() => setSales(scenario.newSales)}
                whileTap={{ scale: 0.98 }}
                className="w-full p-4 rounded-xl bg-bg-secondary hover:bg-bg-card border border-transparent hover:border-accent-primary/30 transition-all text-left"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-text-secondary">
                        {formatMoneyShort(sales)} → {formatMoneyShort(scenario.newSales)}
                      </span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-accent-primary/10 text-accent-primary font-semibold">
                        +{formatMoneyShort(scenario.extraSales)}
                      </span>
                    </div>
                    <div className="text-base font-bold text-text-primary">
                      {formatMoney(scenario.newTotal)}
                    </div>
                    <div className="text-xs text-accent-primary font-medium">
                      +{formatMoneyShort(scenario.extraBonus)} к текущей
                    </div>
                  </div>
                  <ChevronDown className="w-5 h-5 text-text-muted -rotate-90" />
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Next Level Motivation */}
      {result.nextTier && result.salesUntilNextTier > 0 && (
        <div className="bg-bg-card rounded-2xl p-5 shadow-soft border border-border-subtle">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-accent flex items-center justify-center text-white">
              {(() => {
                const NextIcon = LEVEL_ICONS[result.nextTier.levelName] || Star
                return <NextIcon className="w-6 h-6" />
              })()}
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-text-primary">
                До «{result.nextTier.levelName}» осталось
              </div>
              <div className="text-xs text-text-secondary mt-0.5">
                Продай ещё <span className="font-semibold text-accent-primary">{formatMoneyShort(result.salesUntilNextTier)}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wider text-text-muted">бонус</div>
              <div className="text-xl font-bold text-accent-primary">+{result.nextTier.percentage}%</div>
            </div>
          </div>
        </div>
      )}

      {/* How It Works Section */}
      <div className="bg-bg-card rounded-2xl shadow-soft border border-border-subtle overflow-hidden">
        <button
          onClick={() => setShowHowItWorks(!showHowItWorks)}
          className="w-full p-5 flex items-center justify-between text-left"
        >
          <span className="text-sm font-semibold text-text-primary">
            Как это работает?
          </span>
          <motion.div
            animate={{ rotate: showHowItWorks ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-5 h-5 text-text-muted" />
          </motion.div>
        </button>
        <AnimatePresence>
          {showHowItWorks && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-5 space-y-4 border-t border-border-subtle pt-4">
                <p className="text-sm text-text-secondary">
                  Бонус считается <strong className="text-text-primary">накопительно</strong> — каждый миллион продаж идёт по своему проценту:
                </p>
                <div className="space-y-2">
                  {result.breakdown.map((tier, index) => {
                    const LevelIcon = LEVEL_ICONS[tier.levelName] || Star
                    return (
                      <div key={index} className="flex items-center gap-2 text-xs">
                        <LevelIcon className="w-4 h-4 text-text-muted" />
                        <span className="flex-1 text-text-secondary">
                          {formatMoneyShort(tier.minSales)} – {formatMoneyShort(tier.maxSales)}
                        </span>
                        <span className={cn(
                          "font-bold",
                          tier.percentage === 7 ? "text-accent-primary" : "text-text-primary"
                        )}>
                          {tier.percentage}%
                          {tier.percentage === 7 && <span className="ml-1 text-[10px]">скачок!</span>}
                        </span>
                      </div>
                    )
                  })}
                </div>
                <div className="p-3 rounded-xl bg-accent-primary/10 border border-accent-primary/20">
                  <div className="flex items-center gap-2 text-accent-primary text-xs font-medium">
                    <span>🎯</span>
                    <span>Цель: 3 млн продаж = {formatMoney(calculateSalary(3000000, selectedRole).totalSalary)}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Salary Reference Table */}
      <div className="bg-bg-card rounded-2xl p-5 shadow-soft border border-border-subtle">
        <h3 className="text-sm font-semibold text-text-primary mb-4">
          Таблица зарплат
        </h3>
        <div className="space-y-1">
          {[1000000, 2000000, 3000000, 4000000, 5000000, 6000000].map((salesAmount) => {
            const calc = calculateSalary(salesAmount, selectedRole)
            const isTarget = salesAmount === 3000000
            const isCurrent = Math.abs(sales - salesAmount) < 100000

            return (
              <button
                key={salesAmount}
                onClick={() => setSales(salesAmount)}
                className={cn(
                  "w-full flex items-center justify-between py-3 px-4 rounded-xl transition-all",
                  isCurrent
                    ? "bg-gradient-accent text-white"
                    : "hover:bg-bg-secondary"
                )}
              >
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-sm font-medium",
                    isCurrent ? "text-white" : "text-text-secondary"
                  )}>
                    {salesAmount / 1000000} млн
                  </span>
                  {isTarget && !isCurrent && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-accent-primary/20 text-accent-primary">
                      ЦЕЛЬ
                    </span>
                  )}
                </div>
                <span className={cn(
                  "text-base font-bold",
                  isCurrent ? "text-white" : "text-text-primary"
                )}>
                  {formatMoney(calc.totalSalary)}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

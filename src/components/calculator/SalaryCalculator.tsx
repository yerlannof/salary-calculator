"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { LevelProgress } from "./LevelProgress"
import { SalaryBreakdown } from "./SalaryBreakdown"
import { MotivationCard } from "./MotivationCard"
import { HowItWorks } from "./HowItWorks"
import { LevelsTable } from "./LevelsTable"
import { StickyControls } from "./StickyControls"
import { LevelIcon, LevelBadge } from "./LevelIcon"
import { ThemeToggle } from "@/components/theme/ThemeToggle"
import { calculateSalary, formatMoney, formatMoneyShort, SalaryCalculationResult } from "@/lib/calculations"
import { ONLINE_MANAGER_CONFIG } from "@/config/salary-scales"
import { Calculator, Zap, TableProperties } from "lucide-react"

const QUICK_VALUES = [
  { label: "1 млн", value: 1000000 },
  { label: "2.5 млн", value: 2500000 },
  { label: "3.5 млн", value: 3500000 },
  { label: "5 млн", value: 5000000 },
]

export function SalaryCalculator() {
  const [sales, setSales] = useState(2500000)
  const [result, setResult] = useState<SalaryCalculationResult | null>(null)
  const [inputValue, setInputValue] = useState("2 500 000")
  const [showStickyControls, setShowStickyControls] = useState(false)
  const shouldReduceMotion = useReducedMotion()
  const debounceRef = useRef<NodeJS.Timeout>()
  const salesInputRef = useRef<HTMLDivElement>(null)

  const maxSales = ONLINE_MANAGER_CONFIG.maxMonthlySales || 5500000

  // Scroll-based sticky controls
  useEffect(() => {
    const handleScroll = () => {
      // Show sticky when scrolled more than 300px
      setShowStickyControls(window.scrollY > 300)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const calculate = useCallback((amount: number) => {
    const calculationResult = calculateSalary(amount, ONLINE_MANAGER_CONFIG)
    setResult(calculationResult)
  }, [])

  useEffect(() => {
    calculate(sales)
    setInputValue(sales.toLocaleString('ru-RU'))
  }, [sales, calculate])

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('lastSales')
    if (saved) {
      const savedValue = parseInt(saved, 10)
      if (!isNaN(savedValue) && savedValue >= 0 && savedValue <= maxSales) {
        setSales(savedValue)
      }
    }
  }, [maxSales])

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem('lastSales', sales.toString())
  }, [sales])

  const handleSliderChange = (value: number[]) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setSales(value[0]), 16)
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '')
    const num = parseInt(raw, 10) || 0
    setInputValue(num.toLocaleString('ru-RU'))
    if (num <= maxSales) setSales(num)
  }

  const handleInputBlur = () => {
    const raw = inputValue.replace(/\D/g, '')
    const num = Math.min(parseInt(raw, 10) || 0, maxSales)
    setSales(num)
    setInputValue(num.toLocaleString('ru-RU'))
  }

  // Memoize scenarios to prevent recalculation
  const scenarios = useMemo(() => {
    if (!result) return []
    return [500000, 1000000].map(extra => {
      const newSales = Math.min(sales + extra, maxSales)
      const newResult = calculateSalary(newSales, ONLINE_MANAGER_CONFIG)
      return {
        extra,
        newSales,
        diff: newResult.totalSalary - result.totalSalary,
        total: newResult.totalSalary
      }
    }).filter(s => s.diff > 0)
  }, [result, sales, maxSales])

  if (!result) return null

  return (
    <>
      {/* Sticky controls panel */}
      <StickyControls
        isVisible={showStickyControls}
        sales={sales}
        maxSales={maxSales}
        result={result}
        onSalesChange={handleSliderChange}
      />

      <div className="space-y-4">
      {/* Header with theme toggle */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex-1" />
        <div className="text-center">
          <div className="inline-flex items-center gap-2 mb-1">
            <Calculator className="w-5 h-5 text-primary" />
            <h1 className="text-2xl font-bold">Калькулятор ЗП</h1>
          </div>
          <p className="text-sm text-muted-foreground">{ONLINE_MANAGER_CONFIG.name}</p>
        </div>
        <div className="flex-1 flex justify-end">
          <ThemeToggle />
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="calculator" className="w-full">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="calculator" className="gap-1.5">
            <Calculator className="w-4 h-4" />
            <span>Калькулятор</span>
          </TabsTrigger>
          <TabsTrigger value="levels" className="gap-1.5">
            <TableProperties className="w-4 h-4" />
            <span>Все уровни</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calculator" className="space-y-5 mt-4">

      {/* Main salary display */}
      <Card className="bg-gradient-to-br from-card to-muted/30 border-primary/20 overflow-hidden">
        {/* Current level badge */}
        {result.currentTier && (
          <div className="absolute top-3 right-3 z-10">
            <LevelBadge levelName={result.currentTier.levelName} />
          </div>
        )}

        <CardContent className="pt-10 pb-6 relative">
          <div className="text-center space-y-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              Твоя зарплата
            </p>
            <motion.div
              key={result.totalSalary}
              initial={shouldReduceMotion ? {} : { scale: 1.02 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.15 }}
              className="text-4xl md:text-5xl font-bold text-primary tabular-nums"
            >
              {formatMoney(result.totalSalary)}
            </motion.div>

            <div className="flex items-center justify-center gap-2 text-sm">
              <span className="text-muted-foreground">
                {formatMoney(result.baseSalary)}
              </span>
              <span className="text-muted-foreground">+</span>
              <span className="text-primary font-medium">
                {formatMoney(result.totalBonus)}
              </span>
            </div>

            {/* Average percentage insight */}
            {result.totalSales > 0 && (
              <p className="text-xs text-muted-foreground pt-2">
                Это <span className="font-medium text-foreground">{result.fotPercentage.toFixed(1)}%</span> от твоих продаж
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sales input */}
      <div ref={salesInputRef}>
      <Card className="bg-card/80 border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
            <span>Продажи за месяц</span>
            <span className="text-lg font-bold text-foreground">
              {formatMoneyShort(sales)}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Input */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              inputMode="numeric"
              value={inputValue}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              className="flex-1 bg-muted border-0 rounded-lg px-4 py-2.5 text-base font-mono text-right focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <span className="text-sm text-muted-foreground w-6">тг</span>
          </div>

          {/* Slider */}
          <div className="pt-2 pb-1">
            <Slider
              value={[sales]}
              onValueChange={handleSliderChange}
              max={maxSales}
              min={0}
              step={50000}
            />
            <div className="flex justify-between mt-1.5 text-xs text-muted-foreground">
              <span>0</span>
              <span>{formatMoneyShort(maxSales)}</span>
            </div>
          </div>

          {/* Quick buttons */}
          <div className="flex gap-2">
            {QUICK_VALUES.map((item) => (
              <Button
                key={item.value}
                variant={sales === item.value ? "default" : "ghost"}
                size="sm"
                onClick={() => setSales(item.value)}
                className="flex-1 text-xs h-8"
              >
                {item.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
      </div>

      {/* How it works */}
      <HowItWorks />

      {/* Motivation card */}
      <MotivationCard result={result} />

      {/* Level progress */}
      <Card className="bg-card/80 border-border/50">
        <CardContent className="pt-5 pb-4">
          <LevelProgress
            breakdown={result.breakdown}
            currentTierIndex={result.currentTierIndex}
          />
        </CardContent>
      </Card>

      {/* Detailed breakdown */}
      <SalaryBreakdown result={result} />

      {/* Compare scenarios */}
      {scenarios.length > 0 && (
        <Card className="bg-card/80 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Zap className="w-4 h-4" />
              А что если?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {scenarios.map(({ extra, newSales, diff, total }) => (
                <button
                  key={extra}
                  onClick={() => setSales(newSales)}
                  className="bg-muted/50 hover:bg-muted rounded-lg p-3 text-left transition-colors active:scale-[0.98]"
                >
                  <p className="text-xs text-muted-foreground mb-0.5">
                    +{formatMoneyShort(extra)}
                  </p>
                  <p className="text-base font-bold text-primary">
                    +{formatMoney(diff)}
                  </p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground py-4">
          <p>GameOver Shop</p>
        </div>
        </TabsContent>

        <TabsContent value="levels" className="mt-4">
          <LevelsTable />
          <div className="text-center text-xs text-muted-foreground py-4">
            <p>GameOver Shop</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
    </>
  )
}

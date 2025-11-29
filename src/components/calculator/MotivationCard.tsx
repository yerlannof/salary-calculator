"use client"

import { memo, useMemo } from "react"
import { motion } from "framer-motion"
import { SalaryCalculationResult, formatMoney, formatMoneyShort, calculateSalary } from "@/lib/calculations"
import { ONLINE_MANAGER_CONFIG } from "@/config/salary-scales"
import { Card, CardContent } from "@/components/ui/card"
import { LevelIcon } from "./LevelIcon"
import { Trophy, TrendingUp, Target, Sparkles, ArrowRight, Calendar } from "lucide-react"

interface MotivationCardProps {
  result: SalaryCalculationResult
}

export const MotivationCard = memo(function MotivationCard({ result }: MotivationCardProps) {
  // Calculate daily target to reach next tier (assuming 22 working days)
  const dailyTarget = useMemo(() => {
    if (!result.nextTier || result.salesUntilNextTier <= 0) return 0
    return Math.ceil(result.salesUntilNextTier / 22)
  }, [result.nextTier, result.salesUntilNextTier])

  // Calculate what salary would be at next tier threshold
  const salaryAtNextTierStart = useMemo(() => {
    if (!result.nextTier) return 0
    const nextTierResult = calculateSalary(result.nextTier.minSales, ONLINE_MANAGER_CONFIG)
    return nextTierResult.totalSalary
  }, [result.nextTier])

  // Progress percentage within current tier
  const progressToNext = result.currentTier && result.nextTier
    ? Math.min(((result.totalSales - result.currentTier.minSales) /
       (result.nextTier.minSales - result.currentTier.minSales)) * 100, 100)
    : 0

  // Motivational message based on progress
  const motivationText = useMemo(() => {
    if (progressToNext >= 80) return "Почти на месте! Последний рывок!"
    if (progressToNext >= 50) return "Больше половины пути пройдено!"
    if (progressToNext >= 25) return "Хороший старт, продолжай!"
    return "Вперёд к новому рангу!"
  }, [progressToNext])

  if (!result.nextTier) {
    return (
      <Card className="bg-gradient-to-br from-yellow-500/10 via-amber-500/10 to-orange-500/10 border-yellow-500/30 overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-yellow-500/20 via-transparent to-transparent" />
        <CardContent className="p-5 relative">
          <div className="flex items-center gap-4">
            <motion.div
              className="w-14 h-14 rounded-xl bg-gradient-to-br from-yellow-500/30 to-amber-500/30 flex items-center justify-center"
              animate={{
                boxShadow: ["0 0 20px rgba(234,179,8,0.3)", "0 0 40px rgba(234,179,8,0.5)", "0 0 20px rgba(234,179,8,0.3)"]
              }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <Trophy className="w-7 h-7 text-yellow-400" />
            </motion.div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                <h3 className="text-lg font-bold text-yellow-400">
                  Radiant достигнут!
                </h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Ты на максимальном уровне. Легенда!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20 overflow-hidden">
      <CardContent className="p-5">
        <div className="flex flex-col gap-4">
          {/* Motivation header */}
          <div className="flex items-center gap-2 text-sm">
            <Target className="w-4 h-4 text-secondary" />
            <span className="text-muted-foreground">{motivationText}</span>
          </div>

          {/* Main rank up info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-secondary/20 flex items-center justify-center">
                <LevelIcon levelName={result.nextTier.levelName} size="lg" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Следующий ранг</p>
                <h3 className="font-bold text-lg">{result.nextTier.levelName}</h3>
              </div>
            </div>

            <div className="text-right">
              <motion.div
                key={result.salesUntilNextTier}
                initial={{ scale: 1.05 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.2 }}
                className="text-2xl font-bold text-primary tabular-nums"
              >
                {formatMoneyShort(result.salesUntilNextTier)}
              </motion.div>
              <p className="text-xs text-muted-foreground">до ранга</p>
            </div>
          </div>

          {/* Progress bar with rank icons */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <LevelIcon levelName={result.currentTier?.levelName || 'Iron'} size="sm" />
                <span className="text-muted-foreground">{result.currentTier?.levelName}</span>
              </div>
              <span className="text-muted-foreground tabular-nums">{Math.round(progressToNext)}%</span>
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">{result.nextTier.levelName}</span>
                <LevelIcon levelName={result.nextTier.levelName} size="sm" />
              </div>
            </div>
            <div className="relative h-3 bg-muted/50 rounded-full overflow-hidden">
              <motion.div
                className="absolute h-full bg-gradient-to-r from-primary via-secondary to-secondary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressToNext}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
              {/* Marker at threshold */}
              <div className="absolute right-0 top-0 bottom-0 w-0.5 bg-secondary/50" />
            </div>
          </div>

          {/* What you'll get */}
          <div className="grid grid-cols-2 gap-2">
            {/* Salary at next tier */}
            <div className="bg-background/50 rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                <ArrowRight className="w-3.5 h-3.5" />
                <span>ЗП на {result.nextTier.levelName}</span>
              </div>
              <span className="text-base font-bold text-foreground">
                {formatMoney(salaryAtNextTierStart)}
              </span>
            </div>

            {/* Percentage increase */}
            <div className="bg-background/50 rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Новый процент</span>
              </div>
              <span className="text-base font-bold text-primary">
                {result.nextTier.percentage}%
              </span>
              <span className="text-xs text-muted-foreground ml-1">
                (сейчас {result.currentTier?.percentage}%)
              </span>
            </div>
          </div>

          {/* Daily target hint */}
          {dailyTarget > 0 && (
            <div className="flex items-center justify-between bg-secondary/10 rounded-lg p-3 border border-secondary/20">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-secondary" />
                <span className="text-sm">Цель на день</span>
              </div>
              <span className="text-sm font-bold text-secondary tabular-nums">
                ~{formatMoneyShort(dailyTarget)}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
})

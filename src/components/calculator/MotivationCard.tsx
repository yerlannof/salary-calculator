"use client"

import { memo } from "react"
import { motion } from "framer-motion"
import { SalaryCalculationResult, formatMoney, formatMoneyShort } from "@/lib/calculations"
import { Card, CardContent } from "@/components/ui/card"
import { LevelIcon, LevelBadge } from "./LevelIcon"
import { Trophy, TrendingUp } from "lucide-react"

interface MotivationCardProps {
  result: SalaryCalculationResult
}

export const MotivationCard = memo(function MotivationCard({ result }: MotivationCardProps) {
  if (!result.nextTier) {
    return (
      <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-amber-400">
                Максимальный уровень!
              </h3>
              <p className="text-sm text-muted-foreground">
                Ты на уровне «{result.currentTier?.levelName}»
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const progressToNext = result.currentTier
    ? Math.min(((result.totalSales - result.currentTier.minSales) /
       (result.nextTier.minSales - result.currentTier.minSales)) * 100, 100)
    : 0

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20 overflow-hidden">
      <CardContent className="p-5">
        <div className="flex flex-col gap-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary/20 flex items-center justify-center">
                <LevelIcon levelName={result.nextTier.levelName} size="md" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Следующий уровень</p>
                <h3 className="font-semibold">{result.nextTier.levelName}</h3>
                <p className="text-xs text-secondary">{result.nextTier.percentage}%</p>
              </div>
            </div>

            <div className="text-right">
              <motion.div
                key={result.salesUntilNextTier}
                initial={{ scale: 1.05 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.2 }}
                className="text-xl font-bold"
              >
                {formatMoneyShort(result.salesUntilNextTier)}
              </motion.div>
              <p className="text-xs text-muted-foreground">осталось</p>
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{result.currentTier?.levelName}</span>
              <span>{result.nextTier.levelName}</span>
            </div>
            <div className="relative h-2 bg-muted/50 rounded-full overflow-hidden">
              <motion.div
                className="absolute h-full bg-gradient-to-r from-primary to-secondary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressToNext}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </div>
          </div>

          {/* Bonus preview */}
          <div className="flex items-center justify-between bg-background/50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="w-4 h-4" />
              <span>Получишь</span>
            </div>
            <span className="text-lg font-bold text-primary">
              +{formatMoney(result.bonusAtNextTier)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
})

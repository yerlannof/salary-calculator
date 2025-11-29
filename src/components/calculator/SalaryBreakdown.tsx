"use client"

import { memo } from "react"
import { SalaryCalculationResult, formatMoney, formatMoneyShort } from "@/lib/calculations"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { LevelIcon } from "./LevelIcon"
import { Receipt, Wallet, Gift } from "lucide-react"

interface SalaryBreakdownProps {
  result: SalaryCalculationResult
}

export const SalaryBreakdown = memo(function SalaryBreakdown({ result }: SalaryBreakdownProps) {
  // Фильтруем только те уровни, где есть бонус
  const activeTiers = result.breakdown.filter(tier => tier.bonusAmount > 0)

  return (
    <Card className="bg-card/80 border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Receipt className="w-4 h-4" />
          Детализация расчёта
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Оклад */}
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
              <Wallet className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">Оклад</p>
              <p className="text-xs text-muted-foreground">Фиксированная часть</p>
            </div>
          </div>
          <span className="font-semibold">{formatMoney(result.baseSalary)}</span>
        </div>

        {/* Бонусы по уровням */}
        {activeTiers.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-1">
              <Gift className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-medium">Бонусы по уровням</span>
            </div>

            <div className="space-y-1.5">
              {activeTiers.map((tier) => (
                <div
                  key={tier.tierIndex}
                  className={cn(
                    "flex items-center justify-between p-2.5 rounded-lg transition-colors",
                    tier.isCurrentTier
                      ? "bg-primary/10 border border-primary/20"
                      : "bg-muted/20"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={cn(
                      "w-7 h-7 rounded-md flex items-center justify-center",
                      tier.isCurrentTier ? "bg-primary/20" : "bg-muted/50"
                    )}>
                      <LevelIcon levelName={tier.levelName} size="sm" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{tier.levelName}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatMoneyShort(tier.salesInTier)} × {tier.percentage}%
                      </p>
                    </div>
                  </div>
                  <span className={cn(
                    "font-semibold text-sm",
                    tier.isCurrentTier ? "text-primary" : "text-foreground"
                  )}>
                    +{formatMoney(tier.bonusAmount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Итого */}
        <div className="border-t border-border/50 pt-3 mt-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Итого бонус</span>
            <span className="font-bold text-primary text-lg">{formatMoney(result.totalBonus)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
})

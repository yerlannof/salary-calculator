"use client"

import { memo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ONLINE_MANAGER_CONFIG } from "@/config/salary-scales"
import { formatMoney, formatMoneyShort, calculateSalary } from "@/lib/calculations"
import { LevelIcon } from "./LevelIcon"
import { TableProperties, Wallet } from "lucide-react"

export const LevelsTable = memo(function LevelsTable() {
  const { tiers, baseSalary } = ONLINE_MANAGER_CONFIG

  return (
    <div className="space-y-4">
      {/* Base salary info */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="py-4">
          <div className="flex items-center justify-center gap-2 text-sm">
            <Wallet className="w-4 h-4 text-primary" />
            <span>Фиксированный оклад:</span>
            <span className="font-bold text-primary">{formatMoney(baseSalary)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Levels table */}
      <Card className="bg-card/80 border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TableProperties className="w-4 h-4" />
            Все уровни и проценты
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Table header */}
          <div className="grid grid-cols-4 gap-2 text-xs text-muted-foreground font-medium pb-2 border-b border-border/50">
            <span>Уровень</span>
            <span>Диапазон</span>
            <span className="text-center">%</span>
            <span className="text-right">Макс. ЗП*</span>
          </div>

          {/* Table rows */}
          <div className="space-y-0.5 mt-2">
            {tiers.map((tier, index) => {
              // Calculate salary at tier max
              const maxSalaryResult = calculateSalary(tier.maxSales, ONLINE_MANAGER_CONFIG)

              return (
                <div
                  key={index}
                  className="grid grid-cols-4 gap-2 items-center py-2.5 px-2 rounded-lg hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <LevelIcon levelName={tier.levelName} size="sm" />
                    <span className="text-xs font-medium truncate">{tier.levelName}</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    {formatMoneyShort(tier.minSales)}-{formatMoneyShort(tier.maxSales)}
                  </span>
                  <span className="text-center font-semibold text-primary text-sm">
                    {tier.percentage}%
                  </span>
                  <span className="text-right text-xs font-medium">
                    {formatMoney(maxSalaryResult.totalSalary)}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Footnote */}
          <p className="text-[10px] text-muted-foreground mt-4 pt-3 border-t border-border/50">
            * Макс. ЗП = оклад {formatMoney(baseSalary)} + бонус при продажах на максимуме уровня
          </p>
        </CardContent>
      </Card>

      {/* How it works summary */}
      <Card className="bg-card/80 border-border/50">
        <CardContent className="py-4">
          <h3 className="text-sm font-medium mb-3">Как это работает?</h3>
          <div className="space-y-2 text-xs text-muted-foreground">
            <p>
              <span className="text-primary font-medium">1.</span> Чем больше продаешь — тем выше процент бонуса
            </p>
            <p>
              <span className="text-primary font-medium">2.</span> Проценты накапливаются по уровням
            </p>
            <p>
              <span className="text-primary font-medium">3.</span> Каждый уровень считается по своему проценту
            </p>
          </div>

          {/* Example */}
          <div className="mt-4 p-3 bg-muted/30 rounded-lg">
            <p className="text-xs font-medium mb-2">Пример: продажи 2.5 млн</p>
            <div className="space-y-1 text-[11px] text-muted-foreground">
              <div className="flex justify-between items-center">
                <span><span className="text-slate-400">Iron</span> 0-1 млн × 5%</span>
                <span className="text-foreground">50 000 ₸</span>
              </div>
              <div className="flex justify-between items-center">
                <span><span className="text-amber-700">Bronze</span> 1-2 млн × 6%</span>
                <span className="text-foreground">60 000 ₸</span>
              </div>
              <div className="flex justify-between items-center">
                <span><span className="text-slate-300">Silver</span> 2-2.5 млн × 7%</span>
                <span className="text-foreground">35 000 ₸</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-border/50 font-medium">
                <span>Оклад + Бонус</span>
                <span className="text-primary">195 000 ₸</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
})

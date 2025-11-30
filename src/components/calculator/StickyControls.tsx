"use client"

import { memo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Slider } from "@/components/ui/slider"
import { formatMoney, formatMoneyShort, SalaryCalculationResult } from "@/lib/calculations"
import { LevelIcon } from "./LevelIcon"

interface StickyControlsProps {
  isVisible: boolean
  sales: number
  maxSales: number
  result: SalaryCalculationResult
  onSalesChange: (value: number[]) => void
}

export const StickyControls = memo(function StickyControls({
  isVisible,
  sales,
  maxSales,
  result,
  onSalesChange
}: StickyControlsProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50 shadow-lg"
        >
          <div className="container max-w-lg mx-auto px-4 py-3">
            {/* Top row: Level + Salary */}
            <div className="flex items-center justify-between mb-2">
              {/* Level badge */}
              <div className="flex items-center gap-2">
                {result.currentTier && (
                  <>
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                      <LevelIcon levelName={result.currentTier.levelName} size="sm" />
                    </div>
                    <div className="text-xs">
                      <span className="text-muted-foreground">Уровень:</span>
                      <span className="font-medium ml-1">{result.currentTier.levelName}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Salary */}
              <div className="text-right">
                <div className="text-lg font-bold text-primary tabular-nums">
                  {formatMoney(result.totalSalary)}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {formatMoney(result.baseSalary)} + {formatMoney(result.totalBonus)}
                </div>
              </div>
            </div>

            {/* Slider row */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-10">
                {formatMoneyShort(sales)}
              </span>
              <div className="flex-1">
                <Slider
                  value={[sales]}
                  onValueChange={onSalesChange}
                  max={maxSales}
                  min={0}
                  step={50000}
                  className="h-2"
                />
              </div>
              <span className="text-[10px] text-muted-foreground w-10 text-right">
                {formatMoneyShort(maxSales)}
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
})

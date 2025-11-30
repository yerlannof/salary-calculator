"use client"

import { memo } from "react"
import { motion } from "framer-motion"
import { SalaryBreakdownItem } from "@/lib/calculations"
import { formatMoneyShort } from "@/lib/calculations"
import { cn } from "@/lib/utils"
import { LevelIcon, LEVEL_CONFIG } from "./LevelIcon"
import { Check } from "lucide-react"

interface LevelProgressProps {
  breakdown: SalaryBreakdownItem[]
  currentTierIndex: number
}

const TierItem = memo(function TierItem({
  tier,
  index,
  isActive
}: {
  tier: SalaryBreakdownItem
  index: number
  isActive: boolean
}) {
  const tierSize = tier.maxSales - tier.minSales
  const progress = tier.isCompleted
    ? 100
    : tier.isCurrentTier
      ? (tier.salesInTier / tierSize) * 100
      : 0

  const config = LEVEL_CONFIG[tier.levelName]

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03, duration: 0.2 }}
      className={cn(
        "relative rounded-xl p-3 transition-colors duration-200",
        tier.isCurrentTier && "bg-primary/5 ring-1 ring-primary/30",
        tier.isCompleted && "bg-muted/30",
        !isActive && "opacity-40"
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2.5">
          {/* Icon */}
          <div className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
            tier.isCompleted ? "bg-green-500/20" : config?.bg || "bg-muted"
          )}>
            {tier.isCompleted ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <LevelIcon levelName={tier.levelName} size="sm" />
            )}
          </div>

          <div>
            <span className="font-medium text-sm">{tier.levelName}</span>
            <span className="text-xs text-muted-foreground ml-2">
              {tier.percentage}%
            </span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs text-muted-foreground">
            {formatMoneyShort(tier.minSales)} — {formatMoneyShort(tier.maxSales)}
          </span>
          {tier.bonusAmount > 0 && (
            <div className="text-sm font-semibold text-primary">
              +{Math.round(tier.bonusAmount).toLocaleString('ru-RU')}
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative h-1.5 bg-muted/50 rounded-full overflow-hidden">
        <motion.div
          className={cn(
            "absolute h-full rounded-full",
            tier.isCompleted
              ? "bg-green-500"
              : tier.isCurrentTier
                ? "bg-gradient-to-r from-primary to-secondary"
                : "bg-muted-foreground/20"
          )}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />
      </div>

      {/* Active indicator - animated arrow */}
      {tier.isCurrentTier && (
        <>
          <div className="absolute -right-0.5 -top-0.5 w-2 h-2 bg-primary rounded-full" />
          <motion.div
            className="absolute -left-4 top-1/2 -translate-y-1/2 text-primary font-bold"
            animate={{ x: [0, 3, 0] }}
            transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
          >
            →
          </motion.div>
        </>
      )}
    </motion.div>
  )
})

export const LevelProgress = memo(function LevelProgress({
  breakdown,
  currentTierIndex
}: LevelProgressProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-muted-foreground mb-3">
        Прогресс по уровням
      </h3>

      <div className="space-y-1.5">
        {breakdown.map((tier, index) => (
          <TierItem
            key={tier.tierIndex}
            tier={tier}
            index={index}
            isActive={index <= currentTierIndex}
          />
        ))}
      </div>
    </div>
  )
})

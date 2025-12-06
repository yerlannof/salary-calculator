'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'

interface PeriodSelectorProps {
  currentPeriod: string // YYYY-MM
  basePath: string // /team-sales или /team-sales/[id]
}

export function PeriodSelector({ currentPeriod, basePath }: PeriodSelectorProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Генерируем последние 12 месяцев
  const periods = generateLast12Months()

  const currentIndex = periods.findIndex(p => p.value === currentPeriod)
  const canGoPrev = currentIndex < periods.length - 1
  const canGoNext = currentIndex > 0

  const handlePeriodChange = (newPeriod: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('period', newPeriod)
    router.push(`${basePath}?${params.toString()}`)
  }

  const goToPrev = () => {
    if (canGoPrev) {
      handlePeriodChange(periods[currentIndex + 1].value)
    }
  }

  const goToNext = () => {
    if (canGoNext) {
      handlePeriodChange(periods[currentIndex - 1].value)
    }
  }

  const currentPeriodLabel = periods[currentIndex]?.label || currentPeriod

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={goToPrev}
        disabled={!canGoPrev}
        className="h-8 w-8 rounded-full"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <motion.div
        key={currentPeriod}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 px-3 py-1.5 bg-accent/50 rounded-full min-w-[140px] justify-center"
      >
        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-sm font-medium">{currentPeriodLabel}</span>
      </motion.div>

      <Button
        variant="ghost"
        size="icon"
        onClick={goToNext}
        disabled={!canGoNext}
        className="h-8 w-8 rounded-full"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}

function generateLast12Months() {
  const months: Array<{ value: string; label: string }> = []
  const now = new Date()

  for (let i = 0; i < 12; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const value = `${year}-${month}`

    const label = date.toLocaleDateString('ru-RU', {
      month: 'long',
      year: 'numeric',
    })

    months.push({ value, label })
  }

  return months
}

export function getCurrentPeriod() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

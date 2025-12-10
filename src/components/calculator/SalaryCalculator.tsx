"use client"

import { useState, useEffect, useMemo } from "react"
import { calculateSalary } from "@/lib/calculations"
import { LOCATIONS } from "@/config/salary-scales"
import { SalaryCard } from "./SalaryCard"
import { SalesSlider } from "./SalesSlider"
import { ThemeToggle } from "./ThemeToggle"
import { MapPin, Users } from "lucide-react"
import { cn } from "@/lib/utils"

export function SalaryCalculator() {
  // Location & Role selection
  const [selectedLocationId, setSelectedLocationId] = useState(LOCATIONS[0].id)
  const [selectedRoleId, setSelectedRoleId] = useState(LOCATIONS[0].roles[0].id)
  const [sales, setSales] = useState(3000000)

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
              <button
                key={location.id}
                onClick={() => setSelectedLocationId(location.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                  selectedLocationId === location.id
                    ? "bg-gradient-accent text-white shadow-glow"
                    : "bg-bg-secondary text-text-secondary hover:bg-bg-card"
                )}
              >
                <span>{location.emoji}</span>
                <span>{location.name}</span>
              </button>
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
              <button
                key={role.id}
                onClick={() => setSelectedRoleId(role.id)}
                className={cn(
                  "px-3 py-2 rounded-lg text-sm font-medium transition-all",
                  selectedRoleId === role.id
                    ? "bg-gradient-accent text-white shadow-glow"
                    : "bg-bg-secondary text-text-secondary hover:bg-bg-card"
                )}
              >
                {role.name}
              </button>
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

      {/* Sales slider */}
      <SalesSlider
        value={sales}
        onChange={setSales}
        max={maxSales}
      />

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
    </div>
  )
}

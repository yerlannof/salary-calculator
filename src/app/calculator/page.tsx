"use client"

import dynamic from "next/dynamic"

// Dynamic import to avoid SSR issues with useTheme hook
const SalaryCalculator = dynamic(
  () => import("@/components/calculator/SalaryCalculator").then(mod => mod.SalaryCalculator),
  { ssr: false }
)

export default function CalculatorPage() {
  return <SalaryCalculator />
}

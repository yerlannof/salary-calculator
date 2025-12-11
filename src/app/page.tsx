"use client"

import { SalaryCalculator } from "@/components/calculator/SalaryCalculator"
import { AppBackground } from "@/components/calculator/AppBackground"

export default function Home() {
  return (
    <>
      <AppBackground />
      <div className="container max-w-lg mx-auto px-4 py-8 relative z-10">
        <SalaryCalculator />
      </div>
    </>
  )
}

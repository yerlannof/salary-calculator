"use client"

import { SalaryCalculator } from "@/components/calculator/SalaryCalculator"
import Link from "next/link"
import { Trophy } from "lucide-react"

export default function Home() {
  return (
    <div className="container max-w-lg mx-auto px-4 py-8">
      {/* Кнопка перехода на рейтинг */}
      <Link href="/team-sales">
        <div className="mb-6 p-4 bg-gradient-to-r from-yellow-500/20 via-amber-500/10 to-yellow-600/20 border border-yellow-500/30 rounded-xl cursor-pointer hover:border-yellow-500/50 transition-all group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/20 rounded-lg group-hover:bg-yellow-500/30 transition-colors">
                <Trophy className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="font-semibold text-yellow-200">Рейтинг команды</p>
                <p className="text-xs text-yellow-200/60">Смотри кто лидирует</p>
              </div>
            </div>
            <span className="text-yellow-500 group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </div>
      </Link>

      <SalaryCalculator />
    </div>
  )
}

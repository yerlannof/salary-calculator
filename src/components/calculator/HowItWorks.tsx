"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

export function HowItWorks() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Card className="bg-card/30 border-border/30">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-muted/30 transition-colors rounded-lg"
      >
        <span className="text-sm font-medium text-muted-foreground">
          Как считается зарплата?
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CardContent className="pt-0 pb-4 px-4">
              <div className="space-y-4 text-sm">
                {/* Простое объяснение */}
                <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                  <p className="text-muted-foreground">
                    <strong className="text-foreground">Главная идея:</strong>{" "}
                    чем больше продаёшь — тем выше процент бонуса.
                  </p>

                  <div className="border-l-2 border-primary/50 pl-3 space-y-1">
                    <p className="text-foreground font-medium">Твоя ЗП = Оклад + Бонус</p>
                    <p className="text-muted-foreground text-xs">
                      Оклад фиксированный (50 000), бонус зависит от продаж
                    </p>
                  </div>
                </div>

                {/* Визуальный пример */}
                <div className="space-y-2">
                  <p className="font-medium text-foreground">Пример: продал на 2.5 млн</p>

                  <div className="space-y-1 font-mono text-xs bg-background/50 rounded-lg p-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Первый 1 млн × 5%</span>
                      <span className="text-primary">= 50 000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Второй 1 млн × 6%</span>
                      <span className="text-primary">= 60 000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ещё 500к × 7%</span>
                      <span className="text-primary">= 35 000</span>
                    </div>
                    <div className="border-t border-border/50 my-2" />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Бонус итого</span>
                      <span className="text-primary font-medium">= 145 000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">+ Оклад</span>
                      <span>= 50 000</span>
                    </div>
                    <div className="border-t border-border/50 my-2" />
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Итого на руки</span>
                      <span className="text-primary font-bold">= 195 000 ₸</span>
                    </div>
                  </div>
                </div>

                {/* Ключевой инсайт */}
                <div className="flex gap-2 items-start bg-primary/10 rounded-lg p-3">
                  <span className="text-lg">💡</span>
                  <p className="text-xs text-muted-foreground">
                    <strong className="text-foreground">Фишка:</strong> каждый следующий миллион
                    приносит больше денег. Поэтому выгодно продавать больше — процент растёт!
                  </p>
                </div>
              </div>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}

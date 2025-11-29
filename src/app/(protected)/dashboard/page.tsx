"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { SalaryCalculator } from '@/components/calculator/SalaryCalculator'
import { SalesTab } from '@/components/dashboard/SalesTab'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calculator, TrendingUp, LogOut, Loader2, User, Gamepad2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export default function DashboardPage() {
  const { user, profile, loading, signOut, isAuthenticated } = useAuth()
  const [activeTab, setActiveTab] = useState('calculator')
  const router = useRouter()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login')
    }
  }, [loading, isAuthenticated, router])

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  const roleLabels: Record<string, string> = {
    seller: 'Продавец',
    senior_admin: 'Старший администратор',
    director: 'Директор',
    owner: 'Владелец',
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur border-b border-border/50">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <Gamepad2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-sm font-semibold">GameOver Shop</h1>
              <p className="text-xs text-muted-foreground">
                {profile?.name || user?.email}
                {profile?.role && (
                  <span className="ml-1 text-primary">
                    ({roleLabels[profile.role] || profile.role})
                  </span>
                )}
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-2xl mx-auto px-4 py-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-2 mb-4">
            <TabsTrigger value="calculator" className="flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              <span className="hidden sm:inline">Калькулятор</span>
              <span className="sm:hidden">Расчёт</span>
            </TabsTrigger>
            <TabsTrigger value="sales" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Мои продажи</span>
              <span className="sm:hidden">Продажи</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calculator" className="mt-0">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            >
              <SalaryCalculator />
            </motion.div>
          </TabsContent>

          <TabsContent value="sales" className="mt-0">
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            >
              <SalesTab userId={user?.id} profile={profile} />
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

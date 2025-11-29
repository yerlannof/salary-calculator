"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { createBrowserClient } from '@supabase/ssr'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { calculateSalary, formatMoney, formatMoneyShort } from '@/lib/calculations'
import { ONLINE_MANAGER_CONFIG } from '@/config/salary-scales'
import type { User as DbUser, SalesCache } from '@/types/database'
import {
  Users,
  TrendingUp,
  ArrowLeft,
  Loader2,
  RefreshCw,
  Trophy,
  Wallet,
  Calendar,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface TeamMember extends DbUser {
  sales?: SalesCache | null
}

export default function TeamPage() {
  const { profile, loading, isDirector } = useAuth()
  const [team, setTeam] = useState<TeamMember[]>([])
  const [loadingTeam, setLoadingTeam] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const getCurrentPeriod = () => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  }

  const fetchTeam = useCallback(async () => {
    try {
      const period = getCurrentPeriod()

      // Fetch users (directors see their department, owners see all)
      let query = supabase.from('users').select('*')

      if (profile?.role === 'director' && profile.department) {
        query = query.eq('department', profile.department)
      }

      const { data: users, error: usersError } = await query.order('name')

      if (usersError) throw usersError

      // Fetch sales for all users
      const userIds = (users || []).map(u => u.id)
      const { data: sales, error: salesError } = await supabase
        .from('sales_cache')
        .select('*')
        .in('user_id', userIds)
        .eq('period', period)

      if (salesError) throw salesError

      // Combine users with their sales
      const teamWithSales = (users || []).map(user => ({
        ...user,
        sales: (sales || []).find(s => s.user_id === user.id) || null,
      })) as TeamMember[]

      // Sort by sales (highest first)
      teamWithSales.sort((a, b) => (b.sales?.total_sales || 0) - (a.sales?.total_sales || 0))

      setTeam(teamWithSales)
    } catch (err) {
      console.error('Error fetching team:', err)
    } finally {
      setLoadingTeam(false)
    }
  }, [supabase, profile])

  useEffect(() => {
    if (!loading && !isDirector) {
      router.push('/dashboard')
      return
    }
    if (!loading && profile) {
      fetchTeam()
    }
  }, [loading, isDirector, router, profile, fetchTeam])

  const refreshAll = async () => {
    setRefreshing(true)
    // Sync all team members with MoySklad
    for (const member of team) {
      if (member.moysklad_employee_id) {
        try {
          await fetch('/api/sales/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: member.id }),
          })
        } catch (err) {
          console.error('Error syncing', member.name, err)
        }
      }
    }
    await fetchTeam()
    setRefreshing(false)
  }

  if (loading || loadingTeam) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isDirector) {
    return null
  }

  // Calculate totals
  const totalSales = team.reduce((sum, m) => sum + (m.sales?.total_sales || 0), 0)
  const totalFOT = team.reduce((sum, m) => {
    const sales = m.sales?.total_sales || 0
    const result = calculateSalary(sales, ONLINE_MANAGER_CONFIG)
    return sum + result.totalSalary
  }, 0)

  const roleLabels: Record<string, string> = {
    seller: 'Продавец',
    senior_admin: 'Ст. админ',
    director: 'Директор',
    owner: 'Владелец',
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/dashboard')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Команда</h1>
              <p className="text-sm text-muted-foreground">
                {new Date().toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshAll}
            disabled={refreshing}
          >
            <RefreshCw className={cn("w-4 h-4 mr-1", refreshing && "animate-spin")} />
            Обновить
          </Button>
        </div>

        {/* Summary */}
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-xs">Продажи команды</span>
                </div>
                <p className="text-2xl font-bold">{formatMoney(totalSales)}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Wallet className="w-4 h-4" />
                  <span className="text-xs">ФОТ команды</span>
                </div>
                <p className="text-2xl font-bold text-primary">{formatMoney(totalFOT)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Members */}
        <div className="space-y-3">
          {team.map((member, index) => {
            const sales = member.sales?.total_sales || 0
            const result = calculateSalary(sales, ONLINE_MANAGER_CONFIG)
            const maxSales = ONLINE_MANAGER_CONFIG.maxMonthlySales || 5500000
            const progress = (sales / maxSales) * 100

            return (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="bg-card/80 border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {index < 3 && (
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center",
                            index === 0 && "bg-yellow-500/20",
                            index === 1 && "bg-gray-400/20",
                            index === 2 && "bg-orange-500/20",
                          )}>
                            <Trophy className={cn(
                              "w-4 h-4",
                              index === 0 && "text-yellow-500",
                              index === 1 && "text-gray-400",
                              index === 2 && "text-orange-500",
                            )} />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{member.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {roleLabels[member.role] || member.role}
                            {result.currentTier && (
                              <span className="ml-1">• {result.currentTier.levelName}</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatMoneyShort(sales)}</p>
                        <p className="text-xs text-primary">{formatMoney(result.totalSalary)}</p>
                      </div>
                    </div>
                    <Progress value={Math.min(progress, 100)} className="h-1.5" />
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>

        {team.length === 0 && (
          <Card className="bg-card/80 border-border/50">
            <CardContent className="py-12 text-center">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">В команде пока нет сотрудников</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

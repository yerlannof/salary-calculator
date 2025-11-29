"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { createBrowserClient } from '@supabase/ssr'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { User as DbUser } from '@/types/database'
import {
  Users,
  UserPlus,
  Shield,
  Building2,
  Link as LinkIcon,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Check,
  X,
  Pencil,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export default function AdminPage() {
  const { profile, loading, isDirector } = useAuth()
  const [users, setUsers] = useState<DbUser[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [editingUser, setEditingUser] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const fetchUsers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers((data || []) as DbUser[])
    } catch (err) {
      console.error('Error fetching users:', err)
      setError('Не удалось загрузить пользователей')
    } finally {
      setLoadingUsers(false)
    }
  }, [supabase])

  useEffect(() => {
    if (!loading && !isDirector) {
      router.push('/dashboard')
      return
    }
    if (!loading) {
      fetchUsers()
    }
  }, [loading, isDirector, router, fetchUsers])

  const updateUser = async (userId: string, updates: Partial<DbUser>) => {
    try {
      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)

      if (error) throw error

      setUsers(users.map(u => u.id === userId ? { ...u, ...updates } : u))
      setEditingUser(null)
    } catch (err) {
      console.error('Error updating user:', err)
      setError('Не удалось обновить пользователя')
    }
  }

  if (loading || loadingUsers) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isDirector) {
    return null
  }

  const roleLabels: Record<string, string> = {
    seller: 'Продавец',
    senior_admin: 'Ст. админ',
    director: 'Директор',
    owner: 'Владелец',
  }

  const departmentLabels: Record<string, string> = {
    online: 'Онлайн',
    tsum: 'ЦУМ',
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/dashboard')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Управление командой</h1>
            <p className="text-sm text-muted-foreground">
              {users.length} сотрудников
            </p>
          </div>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4" />
            {error}
          </motion.div>
        )}

        {/* Users List */}
        <div className="space-y-3">
          {users.map((user) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="bg-card/80 border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={cn(
                            "text-xs px-2 py-0.5 rounded-full",
                            user.role === 'owner' && "bg-purple-500/20 text-purple-400",
                            user.role === 'director' && "bg-blue-500/20 text-blue-400",
                            user.role === 'senior_admin' && "bg-green-500/20 text-green-400",
                            user.role === 'seller' && "bg-gray-500/20 text-gray-400",
                          )}>
                            {roleLabels[user.role] || user.role}
                          </span>
                          {user.department && (
                            <span className="text-xs text-muted-foreground">
                              {departmentLabels[user.department] || user.department}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {user.moysklad_employee_id ? (
                        <LinkIcon className="w-4 h-4 text-green-500" />
                      ) : (
                        <LinkIcon className="w-4 h-4 text-yellow-500" />
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingUser(editingUser === user.id ? null : user.id)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Edit Form */}
                  {editingUser === user.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-4 pt-4 border-t border-border/50 space-y-3"
                    >
                      {/* Role Select */}
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Роль</label>
                        <div className="flex gap-2 flex-wrap">
                          {(['seller', 'senior_admin', 'director', 'owner'] as const).map((role) => (
                            <Button
                              key={role}
                              variant={user.role === role ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => updateUser(user.id, { role })}
                              disabled={profile?.role !== 'owner' && role === 'owner'}
                            >
                              {roleLabels[role]}
                            </Button>
                          ))}
                        </div>
                      </div>

                      {/* Department Select */}
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Отдел</label>
                        <div className="flex gap-2">
                          {(['online', 'tsum'] as const).map((dept) => (
                            <Button
                              key={dept}
                              variant={user.department === dept ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => updateUser(user.id, { department: dept })}
                            >
                              {departmentLabels[dept]}
                            </Button>
                          ))}
                        </div>
                      </div>

                      {/* MoySklad ID */}
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">
                          ID сотрудника в МойСклад
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            defaultValue={user.moysklad_employee_id || ''}
                            placeholder="UUID из МойСклад"
                            className="flex-1 px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                            onBlur={(e) => {
                              if (e.target.value !== user.moysklad_employee_id) {
                                updateUser(user.id, { moysklad_employee_id: e.target.value || null })
                              }
                            }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Найти ID можно в URL сотрудника в МойСклад
                        </p>
                      </div>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {users.length === 0 && (
          <Card className="bg-card/80 border-border/50">
            <CardContent className="py-12 text-center">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Пользователей пока нет</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

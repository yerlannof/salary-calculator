"use client"

export const dynamic = 'force-dynamic'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  User,
  Mail,
  Building2,
  Shield,
  LogOut,
  Loader2,
  ArrowLeft,
  Link as LinkIcon
} from 'lucide-react'
import { motion } from 'framer-motion'

export default function ProfilePage() {
  const { user, profile, loading, signOut } = useAuth()
  const router = useRouter()

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

  const roleLabels: Record<string, string> = {
    seller: 'Продавец',
    senior_admin: 'Старший администратор',
    director: 'Директор',
    owner: 'Владелец',
  }

  const departmentLabels: Record<string, string> = {
    online: 'Онлайн',
    tsum: 'ЦУМ',
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/dashboard')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Профиль</h1>
        </div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-card/80 border-border/50">
            <CardHeader className="pb-2">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto">
                <User className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-center text-xl mt-3">
                {profile?.name || 'Пользователь'}
              </CardTitle>
              {profile?.role && (
                <p className="text-center text-sm text-primary">
                  {roleLabels[profile.role] || profile.role}
                </p>
              )}
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Email */}
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <Mail className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium">{user?.email}</p>
                </div>
              </div>

              {/* Department */}
              {profile?.department && (
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  <Building2 className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Отдел</p>
                    <p className="text-sm font-medium">
                      {departmentLabels[profile.department] || profile.department}
                    </p>
                  </div>
                </div>
              )}

              {/* Role */}
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <Shield className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Роль</p>
                  <p className="text-sm font-medium">
                    {profile?.role ? roleLabels[profile.role] || profile.role : 'Не назначена'}
                  </p>
                </div>
              </div>

              {/* MoySklad Link */}
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <LinkIcon className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">МойСклад</p>
                  <p className="text-sm font-medium">
                    {profile?.moysklad_employee_id ? (
                      <span className="text-green-500">Связан</span>
                    ) : (
                      <span className="text-yellow-500">Не связан</span>
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Button
            variant="destructive"
            className="w-full"
            onClick={handleSignOut}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Выйти из аккаунта
          </Button>
        </motion.div>
      </div>
    </div>
  )
}

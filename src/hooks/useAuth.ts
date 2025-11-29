"use client"

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { User as DbUser } from '@/types/database'

interface AuthState {
  user: User | null
  profile: DbUser | null
  loading: boolean
  error: string | null
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    error: null,
  })

  const supabase = createClient()

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching profile:', error)
      return null
    }
    return data as DbUser
  }, [supabase])

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()

        if (error) throw error

        let profile = null
        if (user) {
          profile = await fetchProfile(user.id)
        }

        setState({
          user,
          profile,
          loading: false,
          error: null,
        })
      } catch (error) {
        setState({
          user: null,
          profile: null,
          loading: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const user = session?.user ?? null
        let profile = null

        if (user) {
          profile = await fetchProfile(user.id)
        }

        setState(prev => ({
          ...prev,
          user,
          profile,
          loading: false,
        }))
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase, fetchProfile])

  const signIn = async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setState(prev => ({ ...prev, loading: false, error: error.message }))
      return { error }
    }

    return { error: null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setState({ user: null, profile: null, loading: false, error: null })
  }

  return {
    ...state,
    signIn,
    signOut,
    isAuthenticated: !!state.user,
    isOwner: state.profile?.role === 'owner',
    isDirector: state.profile?.role === 'director' || state.profile?.role === 'owner',
    isSeniorAdmin: state.profile?.role === 'senior_admin' || state.profile?.role === 'director' || state.profile?.role === 'owner',
  }
}

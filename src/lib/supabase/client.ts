import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Клиент для фронтенда (только чтение)
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

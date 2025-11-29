export type UserRole = 'seller' | 'senior_admin' | 'director' | 'owner'
export type Department = 'online' | 'tsum'

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          name: string
          role: UserRole
          department: Department | null
          moysklad_employee_id: string | null
          created_at: string
        }
        Insert: {
          id: string
          name: string
          role?: UserRole
          department?: Department | null
          moysklad_employee_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          role?: UserRole
          department?: Department | null
          moysklad_employee_id?: string | null
          created_at?: string
        }
      }
      sales_cache: {
        Row: {
          id: string
          user_id: string
          period: string
          total_sales: number
          sales_count: number
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          period: string
          total_sales: number
          sales_count?: number
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          period?: string
          total_sales?: number
          sales_count?: number
          updated_at?: string
        }
      }
      sales_details: {
        Row: {
          id: string
          user_id: string
          moysklad_id: string
          date: string
          amount: number
          customer_name: string | null
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          moysklad_id: string
          date: string
          amount: number
          customer_name?: string | null
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          moysklad_id?: string
          date?: string
          amount?: number
          customer_name?: string | null
          description?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: UserRole
      department: Department
    }
  }
}

// Helper types
export type User = Database['public']['Tables']['users']['Row']
export type SalesCache = Database['public']['Tables']['sales_cache']['Row']
export type SalesDetail = Database['public']['Tables']['sales_details']['Row']

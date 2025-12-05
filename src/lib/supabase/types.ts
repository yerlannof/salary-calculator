export type DepartmentType = 'online' | 'moscow' | 'tsum' | 'almaty' | 'astana'

export interface Employee {
  id: string
  moysklad_id: string
  first_name: string
  last_name: string
  department: DepartmentType
  retail_store_id: string | null
  retail_store_name: string | null
  is_active: boolean
  hired_at: string
  fired_at: string | null
  photo_url: string | null
  photo_tiny_url: string | null
  created_at: string
  updated_at: string
}

export interface Sale {
  id: string
  moysklad_id: string
  employee_id: string | null
  moysklad_employee_id: string
  amount: number
  sale_date: string
  sale_datetime: string | null
  retail_store_id: string | null
  retail_store_name: string | null
  created_at: string
}

export interface Return {
  id: string
  moysklad_id: string
  employee_id: string | null
  moysklad_employee_id: string
  amount: number
  return_date: string
  return_datetime: string | null
  retail_store_id: string | null
  retail_store_name: string | null
  original_demand_id: string | null
  created_at: string
}

export interface Achievement {
  id: string
  code: string
  name: string
  description: string | null
  icon: string | null
  criteria: Record<string, unknown>
  is_active: boolean
  created_at: string
}

export interface EmployeeAchievement {
  id: string
  employee_id: string
  achievement_id: string
  period: string | null
  earned_at: string
  metadata: Record<string, unknown> | null
}

export interface MonthlyRanking {
  id: string
  employee_id: string
  period: string
  department: DepartmentType
  rank: number
  total_sales: number
  total_returns: number
  net_sales: number
  sales_count: number
  returns_count: number
  avg_check: number | null
  best_day_sales: number
  calculated_at: string
}

export interface SyncLog {
  id: string
  sync_type: string
  period: string | null
  department: string | null
  records_synced: number
  status: string
  error_message: string | null
  started_at: string
  completed_at: string | null
}

export interface Database {
  public: {
    Tables: {
      employees: {
        Row: Employee
        Insert: Partial<Employee> & Pick<Employee, 'moysklad_id' | 'first_name' | 'last_name' | 'department' | 'is_active'>
        Update: Partial<Employee>
      }
      sales: {
        Row: Sale
        Insert: Partial<Sale> & Pick<Sale, 'moysklad_id' | 'moysklad_employee_id' | 'amount' | 'sale_date'>
        Update: Partial<Sale>
      }
      returns: {
        Row: Return
        Insert: Partial<Return> & Pick<Return, 'moysklad_id' | 'moysklad_employee_id' | 'amount' | 'return_date'>
        Update: Partial<Return>
      }
      achievements: {
        Row: Achievement
        Insert: Partial<Achievement> & Pick<Achievement, 'code' | 'name' | 'criteria'>
        Update: Partial<Achievement>
      }
      employee_achievements: {
        Row: EmployeeAchievement
        Insert: Partial<EmployeeAchievement> & Pick<EmployeeAchievement, 'employee_id' | 'achievement_id'>
        Update: Partial<EmployeeAchievement>
      }
      monthly_rankings: {
        Row: MonthlyRanking
        Insert: Partial<MonthlyRanking> & Pick<MonthlyRanking, 'employee_id' | 'period' | 'department' | 'rank'>
        Update: Partial<MonthlyRanking>
      }
      sync_log: {
        Row: SyncLog
        Insert: Partial<SyncLog> & Pick<SyncLog, 'sync_type' | 'status' | 'started_at'>
        Update: Partial<SyncLog>
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

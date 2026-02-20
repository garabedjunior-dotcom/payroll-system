// =====================================================
// types/database.types.ts
// Generated TypeScript types for Supabase tables
// =====================================================

export type UserRole = 'owner' | 'manager' | 'supervisor';
export type EmployeeType = 'W2' | '1099';
export type EntryStatus = 'pending' | 'approved' | 'rejected' | 'locked';
export type PeriodStatus = 'open' | 'closed' | 'exported';

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          password_hash: string;
          role: UserRole;
          full_name: string;
          active: boolean;
          created_at: string;
          last_login: string | null;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      workers: {
        Row: {
          id: string;
          worker_code: string;
          full_name: string;
          employee_type: EmployeeType;
          base_hourly_rate: number;
          ot_multiplier: number;
          min_hourly_guarantee: boolean;
          piece_rate_enabled: boolean;
          crew: string | null;
          active: boolean;
          hire_date: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['workers']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['workers']['Insert']>;
      };
      pay_item_catalog: {
        Row: {
          id: string;
          item_code: string;
          description: string;
          unit: string;
          category: string | null;
          active: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['pay_item_catalog']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['pay_item_catalog']['Insert']>;
      };
      rate_table: {
        Row: {
          id: string;
          pay_item_id: string;
          rate_amount: number;
          effective_from: string;
          effective_to: string | null;
          context_notes: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['rate_table']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['rate_table']['Insert']>;
      };
      time_entries: {
        Row: {
          id: string;
          worker_id: string;
          entry_date: string;
          clock_in: string;
          clock_out: string;
          break_minutes: number;
          total_hours: number;
          crew: string | null;
          status: EntryStatus;
          notes: string | null;
          submitted_by: string | null;
          approved_by: string | null;
          approved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['time_entries']['Row'], 'id' | 'total_hours' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['time_entries']['Insert']>;
      };
      production_entries: {
        Row: {
          id: string;
          worker_id: string;
          entry_date: string;
          pay_item_id: string;
          quantity: number;
          crew: string | null;
          status: EntryStatus;
          notes: string | null;
          submitted_by: string | null;
          approved_by: string | null;
          approved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['production_entries']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['production_entries']['Insert']>;
      };
      payroll_calculations: {
        Row: {
          id: string;
          worker_id: string;
          period_start: string;
          period_end: string;
          total_hours: number;
          regular_hours: number;
          ot_hours: number;
          piece_earnings: number;
          hourly_earnings: number;
          ot_premium: number;
          min_guarantee_applied: number;
          total_pay: number;
          payment_method: string | null;
          calculated_at: string;
          calculated_by: string | null;
        };
        Insert: Omit<Database['public']['Tables']['payroll_calculations']['Row'], 'id' | 'calculated_at'>;
        Update: Partial<Database['public']['Tables']['payroll_calculations']['Insert']>;
      };
      pay_periods: {
        Row: {
          id: string;
          start_date: string;
          end_date: string;
          status: PeriodStatus;
          total_payroll: number | null;
          exported_at: string | null;
          exported_by: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['pay_periods']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['pay_periods']['Insert']>;
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          entity_type: string | null;
          entity_id: string | null;
          old_values: Record<string, any> | null;
          new_values: Record<string, any> | null;
          ip_address: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['audit_logs']['Row'], 'id' | 'created_at'>;
        Update: never; // Audit logs are immutable
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_user_role: {
        Args: Record<PropertyKey, never>;
        Returns: UserRole;
      };
      is_owner: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_manager_or_owner: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
    };
    Enums: {
      user_role: UserRole;
      employee_type: EmployeeType;
      entry_status: EntryStatus;
      period_status: PeriodStatus;
    };
  };
}

// Utility types for cleaner code
export type User = Database['public']['Tables']['users']['Row'];
export type Worker = Database['public']['Tables']['workers']['Row'];
export type PayItem = Database['public']['Tables']['pay_item_catalog']['Row'];
export type Rate = Database['public']['Tables']['rate_table']['Row'];
export type TimeEntry = Database['public']['Tables']['time_entries']['Row'];
export type ProductionEntry = Database['public']['Tables']['production_entries']['Row'];
export type PayrollCalculation = Database['public']['Tables']['payroll_calculations']['Row'];
export type PayPeriod = Database['public']['Tables']['pay_periods']['Row'];
export type AuditLog = Database['public']['Tables']['audit_logs']['Row'];

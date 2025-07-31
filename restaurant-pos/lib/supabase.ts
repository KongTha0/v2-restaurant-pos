import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your environment variables.",
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Employee {
  id: string
  pin: string
  name: string
  role: "cashier" | "manager" | "cook" | "prep"
  is_clocked_in: boolean
  current_shift_id?: string
}

export interface Shift {
  id: string
  employee_id: string
  clock_in: string
  clock_out?: string
  break_start?: string
  break_end?: string
  total_hours?: number
}

export interface MenuItem {
  id: string
  name: string
  price: number
  category_id: string
  image?: string
  is_available: boolean
  modifiers?: Modifier[] // Updated to make modifiers optional
}

export interface Category {
  id: string
  name: string
  sort_order: number
}

export interface Modifier {
  id: string
  name: string
  price: number
  max_selections: number
  required: boolean
  options: ModifierOption[]
}

export interface ModifierOption {
  id: string
  name: string
  price: number
}

export interface OrderItem {
  id: string
  menu_item: MenuItem
  quantity: number
  modifiers: { [key: string]: ModifierOption[] }
  total_price: number
}

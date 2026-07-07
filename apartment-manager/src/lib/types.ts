export interface Room {
  id: number
  room_number: string
  floor: number
  monthly_rent: number
  status: 'available' | 'occupied' | 'maintenance'
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Tenant {
  id: number
  room_id: number
  full_name: string
  phone: string
  id_photo: string | null
  move_in_date: string
  deposit: number
  status: 'active' | 'moved_out'
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Bill {
  id: number
  tenant_id: number
  room_id: number
  billing_month: string
  rent_amount: number
  water_prev: number
  water_curr: number
  water_units: number
  water_rate: number
  water_amount: number
  elec_prev: number
  elec_curr: number
  elec_units: number
  elec_rate: number
  elec_amount: number
  total_amount: number
  due_date: string
  status: 'unpaid' | 'paid'
  paid_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Application {
  id: number
  room_id: number | null
  applicant_name: string
  phone: string
  notes: string | null
  status: 'new' | 'approved' | 'rejected' | 'waitlisted'
  created_at: string
  updated_at: string
}

export interface Setting {
  id: number
  setting_key: string
  setting_value: string
}

export const dynamic = 'force-dynamic'

import { db } from '@/lib/db'
import { formatCurrency } from '@/lib/utils'
import type { Bill, Room, Tenant } from '@/lib/types'
import { Building2, CheckCircle2, AlertCircle, TrendingUp, Phone, Wrench } from 'lucide-react'

function currentMonth() {
  const n = new Date()
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`
}

type UnpaidRow = Pick<Bill, 'id' | 'total_amount' | 'due_date'> &
  Pick<Tenant, 'full_name' | 'phone'> &
  Pick<Room, 'room_number'>

type CountRow   = { c: number }
type PaidStats  = { total: number; count: number }

export default async function DashboardPage() {
  const month = currentMonth()
  const now   = new Date()

  const occupied    = (db.prepare("SELECT COUNT(*) as c FROM rooms WHERE status='occupied'").get()    as CountRow).c
  const available   = (db.prepare("SELECT COUNT(*) as c FROM rooms WHERE status='available'").get()   as CountRow).c
  const maintenance = (db.prepare("SELECT COUNT(*) as c FROM rooms WHERE status='maintenance'").get() as CountRow).c

  const unpaidBills = db.prepare(`
    SELECT b.id, b.total_amount, b.due_date, t.full_name, t.phone, r.room_number
    FROM   bills b
    JOIN   tenants t ON b.tenant_id = t.id
    JOIN   rooms   r ON b.room_id   = r.id
    WHERE  b.billing_month = ? AND b.status = 'unpaid'
    ORDER  BY b.total_amount DESC
  `).all(month) as UnpaidRow[]

  const paidStats = db.prepare(`
    SELECT COALESCE(SUM(total_amount), 0) as total, COUNT(*) as count
    FROM   bills
    WHERE  billing_month = ? AND status = 'paid'
  `).get(month) as PaidStats

  const monthLabel = now.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })

  return (
    <div className="p-6 max-w-5xl">
      {/* Header */}
      <div className="mb-7">
        <h1 className="text-xl font-bold text-gray-900">ภาพรวม</h1>
        <p className="text-sm text-gray-500 mt-0.5">{monthLabel}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-500 font-medium">ห้องที่มีผู้เช่า</span>
            <div className="w-7 h-7 bg-primary-600 rounded-lg flex items-center justify-center">
              <Building2 size={13} className="text-white" />
            </div>
          </div>
          <div className="text-2xl font-bold text-primary-700">{occupied}</div>
          <div className="text-xs text-gray-400 mt-0.5">ห้อง</div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-500 font-medium">ห้องว่าง</span>
            <div className="w-7 h-7 bg-green-600 rounded-lg flex items-center justify-center">
              <CheckCircle2 size={13} className="text-white" />
            </div>
          </div>
          <div className="text-2xl font-bold text-green-700">{available}</div>
          <div className="text-xs text-gray-400 mt-0.5">ห้อง</div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-500 font-medium">ค้างชำระ</span>
            <div className="w-7 h-7 bg-amber-500 rounded-lg flex items-center justify-center">
              <AlertCircle size={13} className="text-white" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-700">{unpaidBills.length}</div>
          <div className="text-xs text-gray-500 mt-0.5">{formatCurrency(unpaidBills.reduce((s, b) => s + b.total_amount, 0))}</div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-500 font-medium">เก็บได้เดือนนี้</span>
            <div className="w-7 h-7 bg-teal-600 rounded-lg flex items-center justify-center">
              <TrendingUp size={13} className="text-white" />
            </div>
          </div>
          <div className="text-xl font-bold text-teal-700">{formatCurrency(paidStats.total)}</div>
          <div className="text-xs text-gray-400 mt-0.5">{paidStats.count} บิลชำระแล้ว</div>
        </div>
      </div>

      {/* Unpaid bills — call list */}
      <div className="card mb-4">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">บิลค้างชำระ — รายชื่อที่ต้องโทรหา</h2>
          {unpaidBills.length > 0 && (
            <span className="text-xs bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full font-medium">
              {unpaidBills.length} ราย
            </span>
          )}
        </div>

        {unpaidBills.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">เก็บเงินครบทุกห้องแล้วเดือนนี้ 🎉</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {unpaidBills.map(bill => (
              <div key={bill.id} className="px-5 py-3.5 flex items-center gap-4">
                <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-gray-600">{bill.room_number}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{bill.full_name}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    ห้อง {bill.room_number} · ครบ {new Date(bill.due_date).toLocaleDateString('th-TH')}
                  </div>
                </div>
                <div className="text-sm font-bold text-gray-900 flex-shrink-0">
                  {formatCurrency(bill.total_amount)}
                </div>
                <a
                  href={`tel:${bill.phone}`}
                  className="flex items-center gap-1.5 bg-primary-50 hover:bg-primary-100 text-primary-700 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
                >
                  <Phone size={11} />
                  {bill.phone}
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Maintenance notice */}
      {maintenance > 0 && (
        <div className="bg-orange-50 border border-orange-100 rounded-xl px-5 py-3.5 flex items-center gap-3">
          <Wrench size={15} className="text-orange-500 flex-shrink-0" />
          <span className="text-sm text-orange-700">
            มีห้องที่อยู่ระหว่างซ่อมบำรุง <strong>{maintenance}</strong> ห้อง
          </span>
        </div>
      )}
    </div>
  )
}

// force-dynamic ensures the dashboard always fetches fresh data from the DB
// instead of being statically rendered at build time

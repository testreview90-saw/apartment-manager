export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import { formatCurrency, currentMonth } from '@/lib/utils'
import { Building2, CheckCircle2, AlertCircle, TrendingUp, Phone, Wrench } from 'lucide-react'

export default async function DashboardPage() {
  const month = currentMonth()
  const now = new Date()
  const [occupied, available, maintenance] = await Promise.all([
    prisma.room.count({ where: { status: 'occupied' } }),
    prisma.room.count({ where: { status: 'available' } }),
    prisma.room.count({ where: { status: 'maintenance' } }),
  ])
  const unpaidBills = await prisma.bill.findMany({
    where: { billingMonth: month, status: 'unpaid' },
    include: { tenant: true, room: true },
    orderBy: { totalAmount: 'desc' },
  })
  const paidAgg = await prisma.bill.aggregate({
    where: { billingMonth: month, status: 'paid' },
    _sum: { totalAmount: true },
    _count: { id: true },
  })
  const totalCollected = paidAgg._sum.totalAmount ?? 0
  const monthLabel = now.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })
  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-7">
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">{monthLabel}</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-500 font-medium">Occupied</span>
            <div className="w-7 h-7 bg-emerald-700 rounded-lg flex items-center justify-center">
              <Building2 size={13} className="text-white" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-700">{occupied}</div>
          <div className="text-xs text-gray-400 mt-0.5">rooms</div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-500 font-medium">Available</span>
            <div className="w-7 h-7 bg-green-600 rounded-lg flex items-center justify-center">
              <CheckCircle2 size={13} className="text-white" />
            </div>
          </div>
          <div className="text-2xl font-bold text-green-700">{available}</div>
          <div className="text-xs text-gray-400 mt-0.5">rooms</div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-500 font-medium">Unpaid</span>
            <div className="w-7 h-7 bg-amber-500 rounded-lg flex items-center justify-center">
              <AlertCircle size={13} className="text-white" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-700">{unpaidBills.length}</div>
          <div className="text-xs text-gray-500 mt-0.5">
            {formatCurrency(unpaidBills.reduce((s, b) => s + b.totalAmount, 0))}
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-500 font-medium">Collected</span>
            <div className="w-7 h-7 bg-teal-600 rounded-lg flex items-center justify-center">
              <TrendingUp size={13} className="text-white" />
            </div>
          </div>
          <div className="text-xl font-bold text-teal-700">{formatCurrency(totalCollected)}</div>
          <div className="text-xs text-gray-400 mt-0.5">{paidAgg._count.id} bills paid</div>
        </div>
      </div>
      <div className="card mb-4">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Unpaid Bills - Call List</h2>
          {unpaidBills.length > 0 && (
            <span className="text-xs bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full font-medium">
              {unpaidBills.length} unpaid
            </span>
          )}
        </div>
        {unpaidBills.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">All bills paid this month!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {unpaidBills.map(bill => (
              <div key={bill.id} className="px-5 py-3.5 flex items-center gap-4">
                <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-gray-600">{bill.room.roomNumber}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{bill.tenant.fullName}</div>
                  <div className="text-xs text-gray-400 mt-0.5">Room {bill.room.roomNumber}</div>
                </div>
                <div className="text-sm font-bold text-gray-900 flex-shrink-0">
                  {formatCurrency(bill.totalAmount)}
                </div>
                
                  href={"tel:" + bill.tenant.phone}
                  className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
                >
                  <Phone size={11} />
                  {bill.tenant.phone}
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
      {maintenance > 0 && (
        <div className="bg-orange-50 border border-orange-100 rounded-xl px-5 py-3.5 flex items-center gap-3">
          <Wrench size={15} className="text-orange-500 flex-shrink-0" />
          <span className="text-sm text-orange-700">{maintenance} room(s) under maintenance</span>
        </div>
      )}
    </div>
  )
}
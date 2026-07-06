export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { formatCurrency, currentMonth } from '@/lib/utils'

export default async function DashboardPage() {
  const month = currentMonth()
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
  return (
    <div className="p-6 max-w-5xl">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card p-4">
          <p className="text-xs text-gray-500 mb-2">Occupied</p>
          <p className="text-2xl font-bold text-emerald-700">{occupied}</p>
          <p className="text-xs text-gray-400">rooms</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 mb-2">Available</p>
          <p className="text-2xl font-bold text-green-700">{available}</p>
          <p className="text-xs text-gray-400">rooms</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 mb-2">Unpaid Bills</p>
          <p className="text-2xl font-bold text-amber-700">{unpaidBills.length}</p>
          <p className="text-xs text-gray-400">{formatCurrency(unpaidBills.reduce((s, b) => s + b.totalAmount, 0))}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 mb-2">Collected</p>
          <p className="text-xl font-bold text-teal-700">{formatCurrency(paidAgg._sum.totalAmount ?? 0)}</p>
          <p className="text-xs text-gray-400">{paidAgg._count.id} bills paid</p>
        </div>
      </div>
      <div className="card">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Unpaid Bills - Call List</h2>
        </div>
        {unpaidBills.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-sm text-gray-500">All bills paid this month!</p>
          </div>
        ) : (
          <div>
            {unpaidBills.map(bill => (
              <div key={bill.id} className="px-5 py-3.5 border-b border-gray-50 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{bill.tenant.fullName}</p>
                  <p className="text-xs text-gray-400">Room {bill.room.roomNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{formatCurrency(bill.totalAmount)}</p>
                  <p className="text-xs text-emerald-700">{bill.tenant.phone}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {maintenance > 0 && (
        <div className="mt-4 bg-orange-50 border border-orange-100 rounded-xl px-5 py-3">
          <p className="text-sm text-orange-700">{maintenance} room(s) under maintenance</p>
        </div>
      )}
    </div>
  )
}

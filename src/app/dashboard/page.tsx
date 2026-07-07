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
    <div style={{ padding: '24px', maxWidth: '900px' }}>
      <h1 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '24px', color: '#111827' }}>Dashboard</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
        <div style={{ background: 'white', borderRadius: '12px', padding: '16px', border: '1px solid #e5e7eb' }}>
          <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>Occupied</p>
          <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#15803d' }}>{occupied}</p>
          <p style={{ fontSize: '12px', color: '#9ca3af' }}>rooms</p>
        </div>
        <div style={{ background: 'white', borderRadius: '12px', padding: '16px', border: '1px solid #e5e7eb' }}>
          <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>Available</p>
          <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#16a34a' }}>{available}</p>
          <p style={{ fontSize: '12px', color: '#9ca3af' }}>rooms</p>
        </div>
        <div style={{ background: 'white', borderRadius: '12px', padding: '16px', border: '1px solid #e5e7eb' }}>
          <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>Unpaid Bills</p>
          <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#d97706' }}>{unpaidBills.length}</p>
          <p style={{ fontSize: '12px', color: '#9ca3af' }}>bills</p>
        </div>
        <div style={{ background: 'white', borderRadius: '12px', padding: '16px', border: '1px solid #e5e7eb' }}>
          <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>Collected</p>
          <p style={{ fontSize: '22px', fontWeight: 'bold', color: '#0f766e' }}>{formatCurrency(paidAgg._sum.totalAmount ?? 0)}</p>
          <p style={{ fontSize: '12px', color: '#9ca3af' }}>{paidAgg._count.id} bills paid</p>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6' }}>
          <h2 style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>Unpaid Bills - Call List</h2>
        </div>
        {unpaidBills.length === 0 ? (
          <p style={{ padding: '40px', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>All bills paid!</p>
        ) : (
          <div>
            {unpaidBills.map(bill => (
              <div key={bill.id} style={{ padding: '14px 20px', borderBottom: '1px solid #f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>{bill.tenant.fullName}</p>
                  <p style={{ fontSize: '12px', color: '#9ca3af' }}>Room {bill.room.roomNumber}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#111827' }}>{formatCurrency(bill.totalAmount)}</p>
                  <p style={{ fontSize: '12px', color: '#15803d' }}>{bill.tenant.phone}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {maintenance > 0 && (
        <div style={{ marginTop: '16px', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '12px', padding: '14px 20px' }}>
          <p style={{ fontSize: '14px', color: '#c2410c' }}>{maintenance} room(s) under maintenance</p>
        </div>
      )}
    </div>
  )
}

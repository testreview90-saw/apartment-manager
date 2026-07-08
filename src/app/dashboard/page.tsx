export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import { formatCurrency, currentMonth } from '@/lib/utils'
import { revalidatePath } from 'next/cache'

async function markPaid(formData: FormData) {
  'use server'

  const billId = Number(formData.get('billId'))
  if (!billId) return

  await prisma.bill.update({
    where: { id: billId },
    data: { status: 'paid', paidDate: new Date() },
  })

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/bills')
}

export default async function DashboardPage() {
  const month = currentMonth()
  const now = new Date()

  const [roomGroups, unpaidAgg, paidAgg, unpaidBills] = await Promise.all([
    prisma.room.groupBy({
      by: ['status'],
      _count: { _all: true },
    }),

    prisma.bill.aggregate({
      where: { billingMonth: month, status: 'unpaid' },
      _sum: { totalAmount: true },
      _count: { id: true },
    }),

    prisma.bill.aggregate({
      where: { billingMonth: month, status: 'paid' },
      _sum: { totalAmount: true },
      _count: { id: true },
    }),

    // Keep the dashboard fast. Show the largest unpaid bills first instead of loading every unpaid bill forever.
    prisma.bill.findMany({
      where: { billingMonth: month, status: 'unpaid' },
      select: {
        id: true,
        totalAmount: true,
        tenant: {
          select: {
            fullName: true,
            phone: true,
          },
        },
        room: {
          select: {
            roomNumber: true,
          },
        },
      },
      orderBy: { totalAmount: 'desc' },
      take: 15,
    }),
  ])

  const roomCounts = {
    occupied: 0,
    available: 0,
    maintenance: 0,
  }

  for (const group of roomGroups) {
    if (group.status === 'occupied') roomCounts.occupied = group._count._all
    if (group.status === 'available') roomCounts.available = group._count._all
    if (group.status === 'maintenance') roomCounts.maintenance = group._count._all
  }

  const unpaidCount = unpaidAgg._count.id
  const unpaidTotal = unpaidAgg._sum.totalAmount ?? 0
  const totalCollected = paidAgg._sum.totalAmount ?? 0
  const paidCount = paidAgg._count.id
  const monthLabel = now.toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="page-pad" style={{ maxWidth: '900px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827' }}>
          Dashboard
        </h1>
        <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>
          {monthLabel}
        </p>
      </div>

      <div className="stats-grid">
        <div style={{ background: 'white', borderRadius: '12px', padding: '16px', border: '1px solid #e5e7eb' }}>
          <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>Occupied</p>
          <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#15803d' }}>{roomCounts.occupied}</p>
          <p style={{ fontSize: '12px', color: '#9ca3af' }}>rooms</p>
        </div>

        <div style={{ background: 'white', borderRadius: '12px', padding: '16px', border: '1px solid #e5e7eb' }}>
          <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>Available</p>
          <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#16a34a' }}>{roomCounts.available}</p>
          <p style={{ fontSize: '12px', color: '#9ca3af' }}>rooms</p>
        </div>

        <div style={{ background: 'white', borderRadius: '12px', padding: '16px', border: '1px solid #e5e7eb' }}>
          <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>Unpaid Bills</p>
          <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#d97706' }}>{unpaidCount}</p>
          <p style={{ fontSize: '12px', color: '#9ca3af' }}>{formatCurrency(unpaidTotal)}</p>
        </div>

        <div style={{ background: 'white', borderRadius: '12px', padding: '16px', border: '1px solid #e5e7eb' }}>
          <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>Collected</p>
          <p style={{ fontSize: '22px', fontWeight: 'bold', color: '#0f766e' }}>{formatCurrency(totalCollected)}</p>
          <p style={{ fontSize: '12px', color: '#9ca3af' }}>{paidCount} paid</p>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', marginBottom: '16px' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <h2 style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
            Unpaid Bills — Call List
          </h2>

          {unpaidCount > 0 && (
            <span style={{ fontSize: '12px', background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a', padding: '2px 10px', borderRadius: '999px', fontWeight: '600' }}>
              {unpaidCount} unpaid
            </span>
          )}
        </div>

        {unpaidBills.length === 0 ? (
          <p style={{ padding: '32px', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>
            All bills paid this month!
          </p>
        ) : (
          <div>
            {unpaidBills.map((bill) => (
              <div key={bill.id} style={{ padding: '12px 16px', borderBottom: '1px solid #f9fafb', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <div style={{ width: '36px', height: '36px', background: '#eff6ff', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#2563eb' }}>
                    {bill.room.roomNumber}
                  </span>
                </div>

                <div style={{ flex: 1, minWidth: '120px' }}>
                  <p style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>
                    {bill.tenant.fullName}
                  </p>
                  <a href={`tel:${bill.tenant.phone}`} style={{ fontSize: '12px', color: '#15803d', fontWeight: '500' }}>
                    {bill.tenant.phone}
                  </a>
                </div>

                <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#111827', flexShrink: 0 }}>
                  {formatCurrency(bill.totalAmount)}
                </p>

                <form action={markPaid}>
                  <input type="hidden" name="billId" value={bill.id} />
                  <button type="submit" style={{ background: '#15803d', color: 'white', border: 'none', borderRadius: '8px', padding: '7px 14px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    Mark Paid
                  </button>
                </form>
              </div>
            ))}

            {unpaidCount > unpaidBills.length && (
              <p style={{ padding: '10px 16px 14px', fontSize: '12px', color: '#6b7280' }}>
                Showing top {unpaidBills.length} unpaid bills. Open Bills page to see all.
              </p>
            )}
          </div>
        )}
      </div>

      {roomCounts.maintenance > 0 && (
        <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '12px', padding: '12px 16px' }}>
          <p style={{ fontSize: '14px', color: '#c2410c' }}>
            {roomCounts.maintenance} room(s) under maintenance
          </p>
        </div>
      )}
    </div>
  )
}

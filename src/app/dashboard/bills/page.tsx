export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { currentMonth, formatCurrency } from '@/lib/utils'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'

async function markPaid(formData: FormData) {
  'use server'
  const billId = parseInt(formData.get('billId') as string)
  await prisma.bill.update({ where: { id: billId }, data: { status: 'paid', paidDate: new Date() } })
  revalidatePath('/dashboard/bills')
}

async function markUnpaid(formData: FormData) {
  'use server'
  const billId = parseInt(formData.get('billId') as string)
  await prisma.bill.update({ where: { id: billId }, data: { status: 'unpaid', paidDate: null } })
  revalidatePath('/dashboard/bills')
}

export default async function BillsPage() {
  const month = currentMonth()

  const bills = await prisma.bill.findMany({
    where: { billingMonth: month },
    include: { tenant: true, room: true },
    orderBy: { room: { roomNumber: 'asc' } },
  })

  const totalCollected = bills.filter(b => b.status === 'paid').reduce((s, b) => s + b.totalAmount, 0)
  const totalUnpaid    = bills.filter(b => b.status === 'unpaid').reduce((s, b) => s + b.totalAmount, 0)

  return (
    <div style={{ padding: '24px', maxWidth: '1100px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827' }}>Bills</h1>
          <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>{month}</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '10px 16px', textAlign: 'right' }}>
            <p style={{ fontSize: '11px', color: '#16a34a', marginBottom: '2px' }}>Collected</p>
            <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#15803d' }}>{formatCurrency(totalCollected)}</p>
          </div>
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '10px 16px', textAlign: 'right' }}>
            <p style={{ fontSize: '11px', color: '#d97706', marginBottom: '2px' }}>Unpaid</p>
            <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#b45309' }}>{formatCurrency(totalUnpaid)}</p>
          </div>
          <Link
            href="/dashboard/bills/generate"
            style={{ background: '#15803d', color: 'white', textDecoration: 'none', borderRadius: '8px', padding: '10px 18px', fontSize: '14px', fontWeight: '600', display: 'inline-block' }}
          >
            + Generate Bills
          </Link>
        </div>
      </div>

      {bills.length === 0 ? (
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '60px', textAlign: 'center' }}>
          <p style={{ fontSize: '16px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>No bills for {month} yet</p>
          <p style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '20px' }}>Click Generate Bills to create this month&apos;s bills</p>
          <Link
            href="/dashboard/bills/generate"
            style={{ background: '#15803d', color: 'white', textDecoration: 'none', borderRadius: '8px', padding: '11px 24px', fontSize: '14px', fontWeight: '600' }}
          >
            Generate Bills for {month}
          </Link>
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '12px' }}>Room</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '12px' }}>Tenant</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', color: '#374151', fontSize: '12px' }}>Rent</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600', color: '#374151', fontSize: '12px' }}>Water</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600', color: '#374151', fontSize: '12px' }}>Electric</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', color: '#374151', fontSize: '12px' }}>Total</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600', color: '#374151', fontSize: '12px' }}>Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600', color: '#374151', fontSize: '12px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {bills.map((bill, i) => (
                  <tr key={bill.id} style={{ borderBottom: i < bills.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                    <td style={{ padding: '14px 16px', fontWeight: '700', color: '#1d4ed8', fontSize: '15px' }}>{bill.room.roomNumber}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <p style={{ fontWeight: '500', color: '#111827' }}>{bill.tenant.fullName}</p>
                      <p style={{ fontSize: '12px', color: '#9ca3af' }}>{bill.tenant.phone}</p>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', color: '#374151' }}>{formatCurrency(bill.rentAmount)}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <p style={{ color: '#374151' }}>{formatCurrency(bill.waterAmount)}</p>
                      <p style={{ fontSize: '11px', color: '#9ca3af' }}>{bill.waterPrev}→{bill.waterCurr} ({bill.waterUnits}u)</p>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <p style={{ color: '#374151' }}>{formatCurrency(bill.elecAmount)}</p>
                      <p style={{ fontSize: '11px', color: '#9ca3af' }}>{bill.elecPrev}→{bill.elecCurr} ({bill.elecUnits}u)</p>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '700', color: '#111827' }}>{formatCurrency(bill.totalAmount)}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '3px 10px',
                        borderRadius: '999px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: bill.status === 'paid' ? '#f0fdf4' : '#fffbeb',
                        color: bill.status === 'paid' ? '#16a34a' : '#d97706',
                        border: `1px solid ${bill.status === 'paid' ? '#bbf7d0' : '#fde68a'}`,
                      }}>
                        {bill.status === 'paid' ? 'Paid' : 'Unpaid'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      {bill.status === 'unpaid' ? (
                        <form action={markPaid}>
                          <input type="hidden" name="billId" value={bill.id} />
                          <button type="submit" style={{ background: '#15803d', color: 'white', border: 'none', borderRadius: '8px', padding: '6px 14px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>
                            Mark Paid
                          </button>
                        </form>
                      ) : (
                        <form action={markUnpaid}>
                          <input type="hidden" name="billId" value={bill.id} />
                          <button type="submit" style={{ background: 'white', color: '#6b7280', border: '1px solid #d1d5db', borderRadius: '8px', padding: '6px 14px', fontSize: '13px', cursor: 'pointer' }}>
                            Undo
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

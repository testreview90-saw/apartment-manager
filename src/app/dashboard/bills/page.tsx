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
    include: {
      tenant: { select: { fullName: true, phone: true } },
      room:   { select: { roomNumber: true } },
    },
    orderBy: { room: { roomNumber: 'asc' } },
  })

  const totalCollected = bills.filter(b => b.status === 'paid').reduce((s, b) => s + b.totalAmount, 0)
  const totalUnpaid    = bills.filter(b => b.status === 'unpaid').reduce((s, b) => s + b.totalAmount, 0)

  return (
    <div className="page-pad" style={{ maxWidth: '1100px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827' }}>Bills</h1>
          <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>{month}</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '8px 14px', textAlign: 'right' }}>
            <p style={{ fontSize: '11px', color: '#16a34a' }}>Collected</p>
            <p style={{ fontSize: '15px', fontWeight: 'bold', color: '#15803d' }}>{formatCurrency(totalCollected)}</p>
          </div>
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '8px 14px', textAlign: 'right' }}>
            <p style={{ fontSize: '11px', color: '#d97706' }}>Unpaid</p>
            <p style={{ fontSize: '15px', fontWeight: 'bold', color: '#b45309' }}>{formatCurrency(totalUnpaid)}</p>
          </div>
          <Link href="/dashboard/bills/generate" style={{ background: '#15803d', color: 'white', borderRadius: '8px', padding: '9px 16px', fontSize: '14px', fontWeight: '600', whiteSpace: 'nowrap' as const }}>
            + Generate
          </Link>
        </div>
      </div>

      {bills.length === 0 ? (
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '60px', textAlign: 'center' }}>
          <p style={{ fontSize: '16px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>No bills for {month}</p>
          <Link href="/dashboard/bills/generate" style={{ background: '#15803d', color: 'white', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', fontWeight: '600' }}>
            Generate Bills
          </Link>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="bills-table-wrapper">
            <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', minWidth: '700px' }}>
                <thead>
                  <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                    {['Room','Tenant','Rent','Water','Electric','Total','Status','Action'].map(h => (
                      <th key={h} style={{ padding: '11px 14px', textAlign: h === 'Room' || h === 'Tenant' ? 'left' : 'center', fontWeight: '600', color: '#374151', fontSize: '12px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bills.map((bill, i) => (
                    <tr key={bill.id} style={{ borderBottom: i < bills.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                      <td style={{ padding: '12px 14px', fontWeight: '700', color: '#1d4ed8' }}>{bill.room.roomNumber}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <p style={{ fontWeight: '500', color: '#111827', fontSize: '13px' }}>{bill.tenant.fullName}</p>
                        <p style={{ fontSize: '11px', color: '#9ca3af' }}>{bill.tenant.phone}</p>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center', color: '#374151', fontSize: '13px' }}>{formatCurrency(bill.rentAmount)}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <p style={{ color: '#374151', fontSize: '13px' }}>{formatCurrency(bill.waterAmount)}</p>
                        <p style={{ fontSize: '10px', color: '#9ca3af' }}>{bill.waterPrev}→{bill.waterCurr}</p>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <p style={{ color: '#374151', fontSize: '13px' }}>{formatCurrency(bill.elecAmount)}</p>
                        <p style={{ fontSize: '10px', color: '#9ca3af' }}>{bill.elecPrev}→{bill.elecCurr}</p>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: '700', color: '#111827' }}>{formatCurrency(bill.totalAmount)}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <span style={{ fontSize: '11px', fontWeight: '600', padding: '3px 8px', borderRadius: '999px', background: bill.status === 'paid' ? '#f0fdf4' : '#fffbeb', color: bill.status === 'paid' ? '#16a34a' : '#d97706', border: `1px solid ${bill.status === 'paid' ? '#bbf7d0' : '#fde68a'}` }}>
                          {bill.status === 'paid' ? 'Paid' : 'Unpaid'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        {bill.status === 'unpaid' ? (
                          <form action={markPaid}>
                            <input type="hidden" name="billId" value={bill.id} />
                            <button type="submit" style={{ background: '#15803d', color: 'white', border: 'none', borderRadius: '7px', padding: '5px 12px', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}>Mark Paid</button>
                          </form>
                        ) : (
                          <form action={markUnpaid}>
                            <input type="hidden" name="billId" value={bill.id} />
                            <button type="submit" style={{ background: 'white', color: '#6b7280', border: '1px solid #d1d5db', borderRadius: '7px', padding: '5px 12px', fontSize: '12px', cursor: 'pointer' }}>Undo</button>
                          </form>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="bills-cards">
            {bills.map(bill => (
              <div key={bill.id} style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '14px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontWeight: '700', color: '#1d4ed8', fontSize: '16px' }}>Room {bill.room.roomNumber}</span>
                    <span style={{ fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '999px', background: bill.status === 'paid' ? '#f0fdf4' : '#fffbeb', color: bill.status === 'paid' ? '#16a34a' : '#d97706', border: `1px solid ${bill.status === 'paid' ? '#bbf7d0' : '#fde68a'}` }}>
                      {bill.status === 'paid' ? 'Paid' : 'Unpaid'}
                    </span>
                  </div>
                  <span style={{ fontWeight: 'bold', color: '#111827', fontSize: '16px' }}>{formatCurrency(bill.totalAmount)}</span>
                </div>
                <p style={{ fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>{bill.tenant.fullName}</p>
                <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                  Water: {formatCurrency(bill.waterAmount)} ({bill.waterUnits}u) · Elec: {formatCurrency(bill.elecAmount)} ({bill.elecUnits}u)
                </p>
                {bill.status === 'unpaid' ? (
                  <form action={markPaid}>
                    <input type="hidden" name="billId" value={bill.id} />
                    <button type="submit" style={{ width: '100%', background: '#15803d', color: 'white', border: 'none', borderRadius: '8px', padding: '9px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                      Mark Paid
                    </button>
                  </form>
                ) : (
                  <form action={markUnpaid}>
                    <input type="hidden" name="billId" value={bill.id} />
                    <button type="submit" style={{ width: '100%', background: 'white', color: '#6b7280', border: '1px solid #d1d5db', borderRadius: '8px', padding: '9px', fontSize: '14px', cursor: 'pointer' }}>
                      Undo
                    </button>
                  </form>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

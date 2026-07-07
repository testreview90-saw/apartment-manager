export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'

async function addTenant(formData: FormData) {
  'use server'
  const roomId    = parseInt(formData.get('roomId') as string)
  const fullName  = formData.get('fullName') as string
  const phone     = formData.get('phone') as string
  const idCard    = formData.get('idCard') as string
  const occupation = formData.get('occupation') as string
  const moveInDate = formData.get('moveInDate') as string
  const deposit   = parseFloat(formData.get('deposit') as string) || 0
  const occupants = formData.get('occupants') as string
  const emergName = formData.get('emergName') as string
  const emergPhone = formData.get('emergPhone') as string
  const notes     = formData.get('notes') as string
  if (!fullName || !phone || !moveInDate) return

  const notesAll = [
    idCard       ? `ID: ${idCard}`             : '',
    occupation   ? `Job: ${occupation}`        : '',
    occupants    ? `Occupants: ${occupants}`   : '',
    emergName    ? `Emergency: ${emergName}`   : '',
    emergPhone   ? `Emerg.phone: ${emergPhone}`: '',
    notes        ? notes                       : '',
  ].filter(Boolean).join(' | ')

  await prisma.tenant.create({
    data: { roomId, fullName, phone, moveInDate: new Date(moveInDate), deposit, status: 'active', notes: notesAll || null },
  })
  await prisma.room.update({ where: { id: roomId }, data: { status: 'occupied' } })
  revalidatePath('/dashboard/rooms')
  redirect('/dashboard/rooms')
}

async function moveOut(formData: FormData) {
  'use server'
  const tenantId = parseInt(formData.get('tenantId') as string)
  const roomId   = parseInt(formData.get('roomId') as string)
  await prisma.tenant.update({ where: { id: tenantId }, data: { status: 'moved_out', roomId: null as unknown as undefined } })
  await prisma.room.update({ where: { id: roomId }, data: { status: 'available' } })
  revalidatePath('/dashboard/rooms')
  redirect('/dashboard/rooms')
}

async function setStatus(formData: FormData) {
  'use server'
  const roomId = parseInt(formData.get('roomId') as string)
  const status = formData.get('status') as string
  await prisma.room.update({ where: { id: roomId }, data: { status } })
  revalidatePath('/dashboard/rooms')
  redirect('/dashboard/rooms')
}

const inputStyle = {
  width: '100%',
  padding: '9px 12px',
  border: '1px solid #d1d5db',
  borderRadius: '8px',
  fontSize: '14px',
  boxSizing: 'border-box' as const,
}

const labelStyle = {
  display: 'block' as const,
  fontSize: '13px',
  fontWeight: '500' as const,
  color: '#374151',
  marginBottom: '4px',
}

export default async function RoomDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const room = await prisma.room.findUnique({
    where: { id: parseInt(id) },
    include: {
      tenant: true,
      bills: { orderBy: { billingMonth: 'desc' }, take: 6 },
    },
  })
  if (!room) redirect('/dashboard/rooms')

  const statusColor: Record<string, string> = {
    available: '#16a34a', occupied: '#2563eb', maintenance: '#d97706',
  }

  return (
    <div style={{ padding: '24px', maxWidth: '700px' }}>
      <Link href="/dashboard/rooms" style={{ fontSize: '13px', color: '#6b7280', textDecoration: 'none', display: 'inline-block', marginBottom: '20px' }}>
        ← Back to Rooms
      </Link>

      {/* Room header */}
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '20px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827' }}>Room {room!.roomNumber}</h1>
          <span style={{
            background: statusColor[room!.status] + '20',
            color: statusColor[room!.status],
            border: `1px solid ${statusColor[room!.status]}`,
            padding: '4px 14px', borderRadius: '999px', fontSize: '13px', fontWeight: '600',
          }}>
            {room!.status.charAt(0).toUpperCase() + room!.status.slice(1)}
          </span>
        </div>
        <p style={{ fontSize: '14px', color: '#6b7280' }}>Floor {room!.floor} · {room!.monthlyRent.toLocaleString()} THB/month</p>
        {room!.status !== 'occupied' && (
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
            {room!.status !== 'maintenance' && (
              <form action={setStatus}>
                <input type="hidden" name="roomId" value={room!.id} />
                <input type="hidden" name="status" value="maintenance" />
                <button type="submit" style={{ background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a', borderRadius: '8px', padding: '7px 14px', fontSize: '13px', cursor: 'pointer' }}>
                  Set Maintenance
                </button>
              </form>
            )}
            {room!.status !== 'available' && (
              <form action={setStatus}>
                <input type="hidden" name="roomId" value={room!.id} />
                <input type="hidden" name="status" value="available" />
                <button type="submit" style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '7px 14px', fontSize: '13px', cursor: 'pointer' }}>
                  Set Available
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Occupied — tenant info + move out */}
      {room!.status === 'occupied' && room!.tenant && (
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '20px', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#111827', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #f3f4f6' }}>
            Current Tenant
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '2px' }}>Name</p>
              <p style={{ fontSize: '15px', fontWeight: '600', color: '#111827' }}>{room!.tenant.fullName}</p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '2px' }}>Phone</p>
              <a href={"tel:" + room!.tenant.phone} style={{ fontSize: '15px', fontWeight: '600', color: '#15803d' }}>{room!.tenant.phone}</a>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '2px' }}>Move-in Date</p>
              <p style={{ fontSize: '14px', color: '#374151' }}>
                {new Date(room!.tenant.moveInDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '2px' }}>Deposit Paid</p>
              <p style={{ fontSize: '14px', color: '#374151' }}>{room!.tenant.deposit.toLocaleString()} THB</p>
            </div>
            {room!.tenant.notes && (
              <div style={{ gridColumn: '1 / -1' }}>
                <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '2px' }}>Details</p>
                <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: '1.6' }}>{room!.tenant.notes}</p>
              </div>
            )}
          </div>
          <form action={moveOut}>
            <input type="hidden" name="tenantId" value={room!.tenant.id} />
            <input type="hidden" name="roomId" value={room!.id} />
            <button
              type="submit"
              style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '8px', padding: '9px 20px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}
            >
              Move Out Tenant
            </button>
          </form>
        </div>
      )}

      {/* Available — add tenant form */}
      {room!.status === 'available' && (
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '20px', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#111827', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid #f3f4f6' }}>
            Add New Tenant
          </h2>
          <form action={addTenant}>
            <input type="hidden" name="roomId" value={room!.id} />

            <p style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Personal Info</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={labelStyle}>Full Name *</label>
                <input name="fullName" required placeholder="e.g. Somchai Jaidee" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Phone *</label>
                <input name="phone" required placeholder="e.g. 081-234-5678" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>ID Card Number</label>
                <input name="idCard" placeholder="Thai national ID" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Occupation</label>
                <input name="occupation" placeholder="e.g. Factory worker" style={inputStyle} />
              </div>
            </div>

            <p style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px', marginTop: '8px' }}>Move-in Details</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={labelStyle}>Move-in Date *</label>
                <input name="moveInDate" type="date" required style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Deposit (THB)</label>
                <input name="deposit" type="number" placeholder="e.g. 7000" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>No. of Occupants</label>
                <select name="occupants" style={{ ...inputStyle, background: 'white' }}>
                  <option value="1">1 person</option>
                  <option value="2">2 people</option>
                  <option value="3">3 people</option>
                  <option value="4">4+ people</option>
                </select>
              </div>
            </div>

            <p style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px', marginTop: '8px' }}>Emergency Contact</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={labelStyle}>Emergency Contact Name</label>
                <input name="emergName" placeholder="Name" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Emergency Contact Phone</label>
                <input name="emergPhone" placeholder="Phone number" style={inputStyle} />
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Notes</label>
              <textarea name="notes" placeholder="Any additional notes..." rows={2} style={{ ...inputStyle, resize: 'vertical' as const }} />
            </div>

            <button
              type="submit"
              style={{ background: '#15803d', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 24px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
            >
              Add Tenant
            </button>
          </form>
        </div>
      )}

      {/* Recent bills */}
      {room!.bills.length > 0 && (
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '20px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#111827', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #f3f4f6' }}>
            Recent Bills
          </h2>
          {room!.bills.map((bill, i) => (
            <div key={bill.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < room!.bills.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
              <div>
                <p style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>{bill.billingMonth}</p>
                <p style={{ fontSize: '12px', color: '#9ca3af' }}>Water: {bill.waterUnits}u · Elec: {bill.elecUnits}u</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '14px', fontWeight: '700', color: '#111827' }}>{bill.totalAmount.toLocaleString()} THB</p>
                <span style={{ fontSize: '11px', fontWeight: '600', color: bill.status === 'paid' ? '#16a34a' : '#d97706' }}>
                  {bill.status.toUpperCase()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

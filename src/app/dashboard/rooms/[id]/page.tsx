export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'

async function editRoom(formData: FormData) {
  'use server'

  const roomId = Number(formData.get('roomId'))
  const monthlyRent = Number(formData.get('monthlyRent'))
  const notes = String(formData.get('notes') || '').trim()

  if (!roomId || !Number.isFinite(monthlyRent) || monthlyRent < 0) return

  await prisma.room.update({
    where: { id: roomId },
    data: {
      monthlyRent,
      notes: notes || null,
    },
  })

  revalidatePath('/dashboard/rooms')
  redirect(`/dashboard/rooms/${roomId}`)
}

async function addTenant(formData: FormData) {
  'use server'

  const roomId = Number(formData.get('roomId'))
  const fullName = String(formData.get('fullName') || '').trim()
  const phone = String(formData.get('phone') || '').trim()
  const idCard = String(formData.get('idCard') || '').trim()
  const occupation = String(formData.get('occupation') || '').trim()
  const moveInDate = String(formData.get('moveInDate') || '')
  const deposit = Number(formData.get('deposit')) || 0
  const occupants = String(formData.get('occupants') || '').trim()
  const emergName = String(formData.get('emergName') || '').trim()
  const emergPhone = String(formData.get('emergPhone') || '').trim()
  const notes = String(formData.get('notes') || '').trim()

  if (!roomId || !fullName || !phone || !moveInDate) return

  const notesAll = [
    idCard ? `ID: ${idCard}` : '',
    occupation ? `Job: ${occupation}` : '',
    occupants ? `Occupants: ${occupants}` : '',
    emergName ? `Emergency: ${emergName}` : '',
    emergPhone ? `Emerg.phone: ${emergPhone}` : '',
    notes,
  ].filter(Boolean).join(' | ')

  await prisma.$transaction(async tx => {
    const room = await tx.room.findUnique({ where: { id: roomId }, include: { tenant: true } })

    if (!room || room.status !== 'available' || room.tenant) {
      throw new Error('Room is not available.')
    }

    await tx.tenant.create({
      data: {
        roomId,
        fullName,
        phone,
        moveInDate: new Date(moveInDate),
        deposit,
        status: 'active',
        notes: notesAll || null,
      },
    })

    await tx.room.update({
      where: { id: roomId },
      data: { status: 'occupied' },
    })
  })

  revalidatePath('/dashboard/rooms')
  redirect('/dashboard/rooms')
}

async function moveOut(formData: FormData) {
  'use server'

  const tenantId = Number(formData.get('tenantId'))
  const roomId = Number(formData.get('roomId'))

  if (!tenantId || !roomId) return

  await prisma.$transaction(async tx => {
    const tenant = await tx.tenant.findUnique({ where: { id: tenantId } })

    if (!tenant || tenant.roomId !== roomId || tenant.status !== 'active') {
      throw new Error('Tenant is not active in this room.')
    }

    await tx.tenant.update({
      where: { id: tenantId },
      data: {
        status: 'moved_out',
        roomId: null,
      },
    })

    await tx.room.update({
      where: { id: roomId },
      data: { status: 'available' },
    })
  })

  revalidatePath('/dashboard/rooms')
  redirect('/dashboard/rooms')
}

async function setStatus(formData: FormData) {
  'use server'

  const roomId = Number(formData.get('roomId'))
  const status = String(formData.get('status') || '')

  if (!roomId || !['available', 'maintenance'].includes(status)) return

  await prisma.room.update({
    where: { id: roomId },
    data: { status },
  })

  revalidatePath('/dashboard/rooms')
  redirect(`/dashboard/rooms/${roomId}`)
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
  const roomId = Number(id)

  if (!roomId) redirect('/dashboard/rooms')

  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: {
      tenant: true,
      bills: {
        orderBy: { billingMonth: 'desc' },
        take: 6,
      },
    },
  })

  if (!room) redirect('/dashboard/rooms')

  const statusColor: Record<string, string> = {
    available: '#16a34a',
    occupied: '#2563eb',
    maintenance: '#d97706',
  }

  const tenant = room.tenant?.status === 'active' ? room.tenant : null

  return (
    <div className="page-pad" style={{ maxWidth: '700px' }}>
      <Link href="/dashboard/rooms" style={{ fontSize: '13px', color: '#6b7280', textDecoration: 'none', display: 'inline-block', marginBottom: '20px' }}>
        ← Back to Rooms
      </Link>

      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '20px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '8px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827' }}>Room {room.roomNumber}</h1>
          <span style={{
            background: `${statusColor[room.status] || '#6b7280'}20`,
            color: statusColor[room.status] || '#6b7280',
            border: `1px solid ${statusColor[room.status] || '#6b7280'}`,
            padding: '4px 14px',
            borderRadius: '999px',
            fontSize: '13px',
            fontWeight: '600',
          }}>
            {room.status.charAt(0).toUpperCase() + room.status.slice(1)}
          </span>
        </div>

        <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>
          Floor {room.floor} · {room.monthlyRent.toLocaleString()} THB/month
          {room.notes && ` · ${room.notes}`}
        </p>

        <form action={editRoom}>
          <input type="hidden" name="roomId" value={room.id} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '10px', alignItems: 'flex-end' }}>
            <div>
              <label style={{ ...labelStyle, fontSize: '12px' }}>Monthly Rent (THB)</label>
              <input name="monthlyRent" type="number" min="0" step="0.01" defaultValue={room.monthlyRent} style={{ ...inputStyle, padding: '7px 10px', fontSize: '13px' }} />
            </div>
            <div>
              <label style={{ ...labelStyle, fontSize: '12px' }}>Notes</label>
              <input name="notes" defaultValue={room.notes || ''} placeholder="e.g. Corner room" style={{ ...inputStyle, padding: '7px 10px', fontSize: '13px' }} />
            </div>
            <button type="submit" style={{ background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: '8px', padding: '7px 16px', fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap' as const }}>
              Save
            </button>
          </div>
        </form>

        {room.status !== 'occupied' && (
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
            {room.status !== 'maintenance' && (
              <form action={setStatus}>
                <input type="hidden" name="roomId" value={room.id} />
                <input type="hidden" name="status" value="maintenance" />
                <button type="submit" style={{ background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a', borderRadius: '8px', padding: '6px 14px', fontSize: '13px', cursor: 'pointer' }}>
                  Set Maintenance
                </button>
              </form>
            )}

            {room.status !== 'available' && (
              <form action={setStatus}>
                <input type="hidden" name="roomId" value={room.id} />
                <input type="hidden" name="status" value="available" />
                <button type="submit" style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '6px 14px', fontSize: '13px', cursor: 'pointer' }}>
                  Set Available
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {room.status === 'occupied' && tenant && (
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '20px', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#111827', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #f3f4f6' }}>
            Current Tenant
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '2px' }}>Name</p>
              <p style={{ fontSize: '15px', fontWeight: '600', color: '#111827' }}>{tenant.fullName}</p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '2px' }}>Phone</p>
              <a href={`tel:${tenant.phone}`} style={{ fontSize: '15px', fontWeight: '600', color: '#15803d' }}>{tenant.phone}</a>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '2px' }}>Move-in Date</p>
              <p style={{ fontSize: '14px', color: '#374151' }}>
                {new Date(tenant.moveInDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '2px' }}>Deposit Paid</p>
              <p style={{ fontSize: '14px', color: '#374151' }}>{tenant.deposit.toLocaleString()} THB</p>
            </div>
            {tenant.notes && (
              <div style={{ gridColumn: '1 / -1' }}>
                <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '2px' }}>Details</p>
                <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: '1.6' }}>{tenant.notes}</p>
              </div>
            )}
          </div>

          <form action={moveOut}>
            <input type="hidden" name="tenantId" value={tenant.id} />
            <input type="hidden" name="roomId" value={room.id} />
            <button type="submit" style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '8px', padding: '9px 20px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>
              Move Out Tenant
            </button>
          </form>
        </div>
      )}

      {room.status === 'occupied' && !tenant && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '16px', marginBottom: '16px', color: '#dc2626' }}>
          This room is marked occupied but has no active tenant. Set it available or add/fix the tenant record.
        </div>
      )}

      {room.status === 'available' && (
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '20px', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#111827', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid #f3f4f6' }}>
            Add New Tenant
          </h2>

          <form action={addTenant}>
            <input type="hidden" name="roomId" value={room.id} />

            <p style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Personal Info</p>
            <div className="two-col" style={{ marginBottom: '12px' }}>
              <div><label style={labelStyle}>Full Name *</label><input name="fullName" required placeholder="Tenant full name" style={inputStyle} /></div>
              <div><label style={labelStyle}>Phone *</label><input name="phone" required placeholder="e.g. 081-234-5678" style={inputStyle} /></div>
              <div><label style={labelStyle}>ID Card Number</label><input name="idCard" placeholder="ID number" style={inputStyle} /></div>
              <div><label style={labelStyle}>Occupation</label><input name="occupation" placeholder="e.g. Factory worker" style={inputStyle} /></div>
            </div>

            <p style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px', marginTop: '8px' }}>Move-in Details</p>
            <div className="three-col" style={{ marginBottom: '12px' }}>
              <div><label style={labelStyle}>Move-in Date *</label><input name="moveInDate" type="date" required style={inputStyle} /></div>
              <div><label style={labelStyle}>Deposit (THB)</label><input name="deposit" type="number" min="0" step="0.01" placeholder="e.g. 7000" style={inputStyle} /></div>
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
            <div className="two-col" style={{ marginBottom: '12px' }}>
              <div><label style={labelStyle}>Name</label><input name="emergName" placeholder="Emergency contact name" style={inputStyle} /></div>
              <div><label style={labelStyle}>Phone</label><input name="emergPhone" placeholder="Phone number" style={inputStyle} /></div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Notes</label>
              <textarea name="notes" placeholder="Any additional notes..." rows={2} style={{ ...inputStyle, resize: 'vertical' as const }} />
            </div>

            <button type="submit" style={{ background: '#15803d', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 24px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
              Add Tenant
            </button>
          </form>
        </div>
      )}

      {room.bills.length > 0 && (
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '20px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#111827', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #f3f4f6' }}>
            Recent Bills
          </h2>
          {room.bills.map((bill, index) => (
            <div key={bill.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: index < room.bills.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
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

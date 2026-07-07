export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'

function parseNotes(notes: string) {
  const result: Record<string, string> = {}
  if (!notes) return result

  notes.split(' | ').forEach(part => {
    const index = part.indexOf(': ')
    if (index > -1) {
      result[part.slice(0, index).trim()] = part.slice(index + 2).trim()
    }
  })

  return result
}

async function confirmMoveIn(formData: FormData) {
  'use server'

  const appId = Number(formData.get('appId'))
  const roomId = Number(formData.get('roomId'))
  const fullName = String(formData.get('fullName') || '').trim()
  const phone = String(formData.get('phone') || '').trim()
  const moveInDate = String(formData.get('moveInDate') || '')
  const deposit = Number(formData.get('deposit')) || 0
  const notes = String(formData.get('notes') || '').trim()

  if (!appId || !roomId || !fullName || !phone || !moveInDate) return

  await prisma.$transaction(async tx => {
    const room = await tx.room.findUnique({
      where: { id: roomId },
      include: { tenant: true },
    })

    if (!room || room.status !== 'available' || room.tenant) {
      throw new Error('Room is no longer available.')
    }

    const application = await tx.application.findUnique({ where: { id: appId } })
    if (!application || application.status === 'moved_in') {
      throw new Error('Application is not valid for move-in.')
    }

    await tx.tenant.create({
      data: {
        roomId,
        fullName,
        phone,
        moveInDate: new Date(moveInDate),
        deposit,
        status: 'active',
        notes: notes || null,
      },
    })

    await tx.room.update({
      where: { id: roomId },
      data: { status: 'occupied' },
    })

    await tx.application.update({
      where: { id: appId },
      data: {
        status: 'moved_in',
        roomId,
      },
    })
  })

  revalidatePath('/dashboard/rooms')
  revalidatePath('/dashboard/applications')
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

export default async function MoveInPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const appId = Number(id)

  if (!appId) redirect('/dashboard/applications')

  const app = await prisma.application.findUnique({
    where: { id: appId },
    include: { room: true },
  })

  if (!app) redirect('/dashboard/applications')
  if (app.status === 'moved_in') redirect('/dashboard/applications')

  const parsed = parseNotes(app.notes || '')
  const moveIn = parsed['Move-in'] || new Date().toISOString().split('T')[0]

  const availableRooms = await prisma.room.findMany({
    where: { status: 'available' },
    orderBy: [{ floor: 'asc' }, { roomNumber: 'asc' }],
  })

  const preferredRoom = app.roomId
    ? availableRooms.find(room => room.id === app.roomId)
    : availableRooms.find(room => room.roomNumber === parsed['Room pref'])

  return (
    <div className="page-pad" style={{ maxWidth: '600px' }}>
      <Link href="/dashboard/applications" style={{ fontSize: '13px', color: '#6b7280', textDecoration: 'none', display: 'inline-block', marginBottom: '20px' }}>
        ← Back to Applications
      </Link>

      <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827', marginBottom: '4px' }}>Move In Tenant</h1>
      <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '24px' }}>
        Review and confirm the details before creating the tenant record.
      </p>

      {availableRooms.length === 0 ? (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
          <p style={{ color: '#dc2626', fontWeight: '600', marginBottom: '8px' }}>No rooms available</p>
          <p style={{ color: '#dc2626', fontSize: '14px' }}>All rooms are currently occupied or under maintenance.</p>
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '24px' }}>
          <form action={confirmMoveIn}>
            <input type="hidden" name="appId" value={app.id} />

            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '14px 16px', marginBottom: '24px' }}>
              <p style={{ fontSize: '13px', fontWeight: '600', color: '#15803d', marginBottom: '4px' }}>From application</p>
              <p style={{ fontSize: '15px', fontWeight: '700', color: '#111827' }}>{app.applicantName}</p>
              <p style={{ fontSize: '13px', color: '#15803d' }}>{app.phone}</p>
              {Object.entries(parsed).map(([key, value]) => (
                <p key={key} style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{key}: {value}</p>
              ))}
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Assign Room *</label>
              <select name="roomId" required defaultValue={preferredRoom?.id || ''} style={{ ...inputStyle, background: 'white' }}>
                <option value="">Select a room...</option>
                {availableRooms.map(room => (
                  <option key={room.id} value={room.id}>
                    Room {room.roomNumber} — Floor {room.floor} — {room.monthlyRent.toLocaleString()} THB/mo
                    {room.id === preferredRoom?.id ? ' ← preferred' : ''}
                  </option>
                ))}
              </select>
              {app.roomId && !preferredRoom && (
                <p style={{ fontSize: '12px', color: '#d97706', marginTop: '4px' }}>
                  ⚠ Preferred room is not available. Please select another room.
                </p>
              )}
            </div>

            <div className="two-col" style={{ marginBottom: '16px' }}>
              <div>
                <label style={labelStyle}>Full Name *</label>
                <input name="fullName" required defaultValue={app.applicantName} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Phone *</label>
                <input name="phone" required defaultValue={app.phone} style={inputStyle} />
              </div>
            </div>

            <div className="two-col" style={{ marginBottom: '16px' }}>
              <div>
                <label style={labelStyle}>Move-in Date *</label>
                <input name="moveInDate" type="date" required defaultValue={moveIn} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Deposit (THB)</label>
                <input name="deposit" type="number" min="0" step="0.01" placeholder="e.g. 7000" style={inputStyle} />
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>Notes</label>
              <textarea name="notes" rows={2} defaultValue={app.notes || ''} style={{ ...inputStyle, resize: 'vertical' as const }} />
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button type="submit" style={{ background: '#15803d', color: 'white', border: 'none', borderRadius: '8px', padding: '11px 24px', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}>
                Confirm Move In
              </button>
              <Link href="/dashboard/applications" style={{ fontSize: '14px', color: '#6b7280' }}>
                Cancel
              </Link>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

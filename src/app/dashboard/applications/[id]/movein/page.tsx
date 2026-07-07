export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'

function parseNotes(notes: string) {
  const result: Record<string, string> = {}
  if (!notes) return result
  notes.split(' | ').forEach(part => {
    const idx = part.indexOf(': ')
    if (idx > -1) {
      result[part.slice(0, idx).trim()] = part.slice(idx + 2).trim()
    }
  })
  return result
}

async function confirmMoveIn(formData: FormData) {
  'use server'
  const appId      = parseInt(formData.get('appId') as string)
  const roomId     = parseInt(formData.get('roomId') as string)
  const fullName   = formData.get('fullName') as string
  const phone      = formData.get('phone') as string
  const moveInDate = formData.get('moveInDate') as string
  const deposit    = parseFloat(formData.get('deposit') as string) || 0
  const notes      = formData.get('notes') as string

  // Check room is still available
  const room = await prisma.room.findUnique({ where: { id: roomId } })
  if (!room || room.status !== 'available') {
    throw new Error('Room is no longer available')
  }

  // Create tenant
  await prisma.tenant.create({
    data: { roomId, fullName, phone, moveInDate: new Date(moveInDate), deposit, status: 'active', notes: notes || null },
  })

  // Update room status
  await prisma.room.update({ where: { id: roomId }, data: { status: 'occupied' } })

  // Mark application as moved_in (store in notes or just delete)
  await prisma.application.update({ where: { id: appId }, data: { status: 'approved', roomId } })

  revalidatePath('/dashboard/rooms')
  revalidatePath('/dashboard/applications')
  redirect('/dashboard/rooms')
}

const inputStyle = {
  width: '100%', padding: '9px 12px', border: '1px solid #d1d5db',
  borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' as const,
}
const labelStyle = {
  display: 'block' as const, fontSize: '13px',
  fontWeight: '500' as const, color: '#374151', marginBottom: '4px',
}

export default async function MoveInPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const app = await prisma.application.findUnique({ where: { id: parseInt(id) } })
  if (!app) redirect('/dashboard/applications')

  const parsed   = parseNotes(app.notes || '')
  const roomPref = parsed['Room pref'] || ''
  const moveIn   = parsed['Move-in'] || new Date().toISOString().split('T')[0]

  // Find available rooms
  const availableRooms = await prisma.room.findMany({
    where: { status: 'available' },
    orderBy: { roomNumber: 'asc' },
  })

  // Pre-select room if preference matches
  const preferredRoom = availableRooms.find(r => r.roomNumber === roomPref)

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

            {/* Application summary */}
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '14px 16px', marginBottom: '24px' }}>
              <p style={{ fontSize: '13px', fontWeight: '600', color: '#15803d', marginBottom: '4px' }}>From application</p>
              <p style={{ fontSize: '15px', fontWeight: '700', color: '#111827' }}>{app.applicantName}</p>
              <p style={{ fontSize: '13px', color: '#15803d' }}>{app.phone}</p>
              {Object.entries(parsed).map(([k, v]) => (
                <p key={k} style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{k}: {v}</p>
              ))}
            </div>

            {/* Room selection */}
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Assign Room *</label>
              <select
                name="roomId"
                required
                defaultValue={preferredRoom?.id || ''}
                style={{ ...inputStyle, background: 'white' }}
              >
                <option value="">Select a room...</option>
                {availableRooms.map(r => (
                  <option key={r.id} value={r.id}>
                    Room {r.roomNumber} — Floor {r.floor} — {r.monthlyRent.toLocaleString()} THB/mo
                    {r.roomNumber === roomPref ? ' ← preferred' : ''}
                  </option>
                ))}
              </select>
              {roomPref && !preferredRoom && (
                <p style={{ fontSize: '12px', color: '#d97706', marginTop: '4px' }}>
                  ⚠ Preferred room {roomPref} is not available. Please select another.
                </p>
              )}
            </div>

            {/* Tenant details */}
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
                <input name="deposit" type="number" placeholder="e.g. 7000" style={inputStyle} />
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>Notes (carried over from application)</label>
              <textarea
                name="notes"
                rows={2}
                defaultValue={app.notes || ''}
                style={{ ...inputStyle, resize: 'vertical' as const }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button
                type="submit"
                style={{ background: '#15803d', color: 'white', border: 'none', borderRadius: '8px', padding: '11px 24px', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}
              >
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

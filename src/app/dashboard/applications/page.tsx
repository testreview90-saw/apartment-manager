export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'

async function addApplication(formData: FormData) {
  'use server'

  const name = String(formData.get('name') || '').trim()
  const phone = String(formData.get('phone') || '').trim()
  const idCard = String(formData.get('idCard') || '').trim()
  const occupation = String(formData.get('occupation') || '').trim()
  const moveInDate = String(formData.get('moveInDate') || '').trim()
  const occupants = String(formData.get('occupants') || '').trim()
  const roomIdRaw = String(formData.get('roomId') || '')
  const emergName = String(formData.get('emergName') || '').trim()
  const emergPhone = String(formData.get('emergPhone') || '').trim()
  const notes = String(formData.get('notes') || '').trim()

  if (!name || !phone) return

  const roomId = roomIdRaw ? Number(roomIdRaw) : null
  const preferredRoom = roomId
    ? await prisma.room.findUnique({ where: { id: roomId }, select: { roomNumber: true } })
    : null

  const notesAll = [
    idCard ? `ID: ${idCard}` : '',
    occupation ? `Job: ${occupation}` : '',
    occupants ? `Occupants: ${occupants}` : '',
    moveInDate ? `Move-in: ${moveInDate}` : '',
    emergName ? `Emergency: ${emergName}` : '',
    emergPhone ? `Emerg.phone: ${emergPhone}` : '',
    preferredRoom ? `Room pref: ${preferredRoom.roomNumber}` : '',
    notes,
  ].filter(Boolean).join(' | ')

  await prisma.application.create({
    data: {
      applicantName: name,
      phone,
      roomId: roomId || null,
      notes: notesAll || null,
      status: 'new',
    },
  })

  revalidatePath('/dashboard/applications')
}

async function updateStatus(formData: FormData) {
  'use server'

  const id = Number(formData.get('id'))
  const status = String(formData.get('status') || '')

  if (!id || !['new', 'approved', 'rejected', 'waitlisted'].includes(status)) return

  await prisma.application.update({
    where: { id },
    data: { status },
  })

  revalidatePath('/dashboard/applications')
}

async function deleteApplication(formData: FormData) {
  'use server'

  const id = Number(formData.get('id'))
  if (!id) return

  await prisma.application.delete({ where: { id } })
  revalidatePath('/dashboard/applications')
}

const statusColor: Record<string, { bg: string; color: string; border: string }> = {
  new: { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
  approved: { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  moved_in: { bg: '#ecfdf5', color: '#047857', border: '#a7f3d0' },
  rejected: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
  waitlisted: { bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
}

const inputStyle = {
  width: '100%',
  padding: '8px 12px',
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

export default async function ApplicationsPage() {
  const applications = await prisma.application.findMany({
    include: {
      room: {
        select: {
          id: true,
          roomNumber: true,
          floor: true,
          monthlyRent: true,
          status: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const availableRooms = await prisma.room.findMany({
    where: { status: 'available' },
    orderBy: [{ floor: 'asc' }, { roomNumber: 'asc' }],
  })

  return (
    <div className="page-pad" style={{ maxWidth: '900px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827' }}>Applications</h1>
        <span style={{ fontSize: '13px', color: '#6b7280' }}>{applications.length} total</span>
      </div>

      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '20px', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#111827', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid #f3f4f6' }}>
          New Application
        </h2>

        <form action={addApplication}>
          <p style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Personal Info</p>
          <div className="two-col" style={{ marginBottom: '12px' }}>
            <div>
              <label style={labelStyle}>Full Name *</label>
              <input name="name" required placeholder="Applicant full name" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Phone *</label>
              <input name="phone" required placeholder="Phone number" style={inputStyle} />
            </div>
          </div>

          <div className="two-col" style={{ marginBottom: '20px' }}>
            <div>
              <label style={labelStyle}>ID Card Number</label>
              <input name="idCard" placeholder="ID number" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Occupation</label>
              <input name="occupation" placeholder="e.g. Factory worker" style={inputStyle} />
            </div>
          </div>

          <p style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Room Preference</p>
          <div className="three-col" style={{ marginBottom: '20px' }}>
            <div>
              <label style={labelStyle}>Preferred Room</label>
              <select name="roomId" style={{ ...inputStyle, background: 'white' }}>
                <option value="">Any available room</option>
                {availableRooms.map(room => (
                  <option key={room.id} value={room.id}>
                    Room {room.roomNumber} — Floor {room.floor} — {room.monthlyRent.toLocaleString()} THB/mo
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Move-in Date</label>
              <input name="moveInDate" type="date" style={inputStyle} />
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

          <p style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Emergency Contact</p>
          <div className="two-col" style={{ marginBottom: '20px' }}>
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

          <button type="submit" style={{ background: '#15803d', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 24px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
            Submit Application
          </button>
        </form>
      </div>

      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6' }}>
          <h2 style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>All Applications</h2>
        </div>

        {applications.length === 0 ? (
          <p style={{ padding: '40px', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>No applications yet</p>
        ) : (
          applications.map((app, index) => {
            const style = statusColor[app.status] || statusColor.new
            const canMoveIn = app.status !== 'rejected' && app.status !== 'moved_in'

            return (
              <div key={app.id} style={{ padding: '16px 20px', borderBottom: index < applications.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' }}>
                      <p style={{ fontSize: '15px', fontWeight: '600', color: '#111827' }}>{app.applicantName}</p>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 10px',
                        borderRadius: '999px',
                        fontSize: '11px',
                        fontWeight: '600',
                        background: style.bg,
                        color: style.color,
                        border: `1px solid ${style.border}`,
                      }}>
                        {app.status.replace('_', ' ').replace(/^./, character => character.toUpperCase())}
                      </span>
                    </div>

                    <a href={`tel:${app.phone}`} style={{ fontSize: '13px', color: '#15803d', fontWeight: '500' }}>{app.phone}</a>

                    {app.room && (
                      <p style={{ fontSize: '12px', color: app.room.status === 'available' ? '#2563eb' : '#d97706', marginTop: '6px' }}>
                        Preferred Room {app.room.roomNumber} · {app.room.status}
                      </p>
                    )}

                    {app.notes && <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '6px', lineHeight: '1.5' }}>{app.notes}</p>}

                    <p style={{ fontSize: '11px', color: '#d1d5db', marginTop: '6px' }}>
                      Added: {new Date(app.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
                    {canMoveIn && (
                      <Link href={`/dashboard/applications/${app.id}/movein`} style={{ background: '#15803d', color: 'white', border: '1px solid #15803d', borderRadius: '6px', padding: '5px 12px', fontSize: '12px', fontWeight: '600', textDecoration: 'none' }}>
                        Move In
                      </Link>
                    )}

                    {app.status !== 'moved_in' && (
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        {['new', 'approved', 'rejected', 'waitlisted'].filter(status => status !== app.status).map(status => (
                          <form key={status} action={updateStatus}>
                            <input type="hidden" name="id" value={app.id} />
                            <input type="hidden" name="status" value={status} />
                            <button type="submit" style={{
                              background: 'white',
                              color: '#374151',
                              border: '1px solid #d1d5db',
                              borderRadius: '6px',
                              padding: '4px 10px',
                              fontSize: '12px',
                              cursor: 'pointer',
                            }}>
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </button>
                          </form>
                        ))}
                      </div>
                    )}

                    <form action={deleteApplication}>
                      <input type="hidden" name="id" value={app.id} />
                      <button type="submit" style={{ background: 'white', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', padding: '4px 10px', fontSize: '12px', cursor: 'pointer' }}>
                        Delete
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

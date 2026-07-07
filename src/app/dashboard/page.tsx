export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'

async function addApplication(formData: FormData) {
  'use server'
  const name       = formData.get('name') as string
  const phone      = formData.get('phone') as string
  const idCard     = formData.get('idCard') as string
  const occupation = formData.get('occupation') as string
  const moveInDate = formData.get('moveInDate') as string
  const occupants  = formData.get('occupants') as string
  const roomPref   = formData.get('roomPref') as string
  const emergName  = formData.get('emergName') as string
  const emergPhone = formData.get('emergPhone') as string
  const notes      = formData.get('notes') as string
  if (!name || !phone) return
  const notesAll = [
    idCard       ? `ID: ${idCard}`             : '',
    occupation   ? `Job: ${occupation}`        : '',
    occupants    ? `Occupants: ${occupants}`   : '',
    moveInDate   ? `Move-in: ${moveInDate}`    : '',
    emergName    ? `Emergency: ${emergName}`   : '',
    emergPhone   ? `Emerg.phone: ${emergPhone}`: '',
    roomPref     ? `Room pref: ${roomPref}`    : '',
    notes        ? notes                       : '',
  ].filter(Boolean).join(' | ')
  await prisma.application.create({
    data: { applicantName: name, phone, notes: notesAll, status: 'new' },
  })
  revalidatePath('/dashboard/applications')
}

async function updateStatus(formData: FormData) {
  'use server'
  const id     = parseInt(formData.get('id') as string)
  const status = formData.get('status') as string
  await prisma.application.update({ where: { id }, data: { status } })
  revalidatePath('/dashboard/applications')
}

async function deleteApplication(formData: FormData) {
  'use server'
  const id = parseInt(formData.get('id') as string)
  await prisma.application.delete({ where: { id } })
  revalidatePath('/dashboard/applications')
}

const statusColor: Record<string, { bg: string; color: string; border: string }> = {
  new:        { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
  approved:   { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  rejected:   { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
  waitlisted: { bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
}

const inputStyle = {
  width: '100%', padding: '8px 12px', border: '1px solid #d1d5db',
  borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' as const,
}
const labelStyle = {
  display: 'block' as const, fontSize: '13px',
  fontWeight: '500' as const, color: '#374151', marginBottom: '4px',
}

export default async function ApplicationsPage() {
  const applications  = await prisma.application.findMany({ orderBy: { createdAt: 'desc' } })
  const availableRooms = await prisma.room.findMany({ where: { status: 'available' }, orderBy: { roomNumber: 'asc' } })

  return (
    <div className="page-pad" style={{ maxWidth: '900px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827' }}>Applications</h1>
        <span style={{ fontSize: '13px', color: '#6b7280' }}>{applications.length} total</span>
      </div>

      {/* Add form */}
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '20px', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#111827', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid #f3f4f6' }}>
          New Application
        </h2>
        <form action={addApplication}>
          <p style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Personal Info</p>
          <div className="two-col" style={{ marginBottom: '12px' }}>
            <div><label style={labelStyle}>Full Name *</label><input name="name" required placeholder="e.g. Somchai Jaidee" style={inputStyle} /></div>
            <div><label style={labelStyle}>Phone *</label><input name="phone" required placeholder="e.g. 081-234-5678" style={inputStyle} /></div>
            <div><label style={labelStyle}>ID Card Number</label><input name="idCard" placeholder="Thai national ID" style={inputStyle} /></div>
            <div><label style={labelStyle}>Occupation</label><input name="occupation" placeholder="e.g. Factory worker" style={inputStyle} /></div>
          </div>

          <p style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px', marginTop: '8px' }}>Room Preference</p>
          <div className="three-col" style={{ marginBottom: '12px' }}>
            <div>
              <label style={labelStyle}>Preferred Room</label>
              <select name="roomPref" style={{ ...inputStyle, background: 'white' }}>
                <option value="">Any available room</option>
                {availableRooms.map(r => (
                  <option key={r.id} value={r.roomNumber}>Room {r.roomNumber} (Floor {r.floor})</option>
                ))}
              </select>
            </div>
            <div><label style={labelStyle}>Move-in Date</label><input name="moveInDate" type="date" style={inputStyle} /></div>
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
            Submit Application
          </button>
        </form>
      </div>

      {/* List */}
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f3f4f6' }}>
          <h2 style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>All Applications</h2>
        </div>
        {applications.length === 0 ? (
          <p style={{ padding: '40px', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>No applications yet</p>
        ) : (
          applications.map((app, i) => {
            const s = statusColor[app.status] || statusColor.new
            return (
              <div key={app.id} style={{ padding: '16px 20px', borderBottom: i < applications.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                      <p style={{ fontSize: '15px', fontWeight: '600', color: '#111827' }}>{app.applicantName}</p>
                      <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: '600', background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
                        {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                      </span>
                    </div>
                    <a href={"tel:" + app.phone} style={{ fontSize: '13px', color: '#15803d', fontWeight: '500' }}>{app.phone}</a>
                    {app.notes && <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '6px', lineHeight: '1.6' }}>{app.notes}</p>}
                    <p style={{ fontSize: '11px', color: '#d1d5db', marginTop: '6px' }}>
                      Added: {new Date(app.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                    {/* Move In button — only for approved */}
                    {app.status === 'approved' && (
                      <Link
                        href={`/dashboard/applications/${app.id}/movein`}
                        style={{ background: '#15803d', color: 'white', borderRadius: '8px', padding: '7px 16px', fontSize: '13px', fontWeight: '700', whiteSpace: 'nowrap' as const }}
                      >
                        Move In →
                      </Link>
                    )}

                    {/* Status buttons */}
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      {['new', 'approved', 'rejected', 'waitlisted'].filter(st => st !== app.status).map(st => (
                        <form key={st} action={updateStatus}>
                          <input type="hidden" name="id" value={app.id} />
                          <input type="hidden" name="status" value={st} />
                          <button type="submit" style={{ background: 'white', color: '#374151', border: '1px solid #d1d5db', borderRadius: '6px', padding: '4px 10px', fontSize: '12px', cursor: 'pointer' }}>
                            {st.charAt(0).toUpperCase() + st.slice(1)}
                          </button>
                        </form>
                      ))}
                    </div>

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

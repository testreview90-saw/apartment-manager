export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

async function addApplication(formData: FormData) {
  'use server'
  const name  = formData.get('name') as string
  const phone = formData.get('phone') as string
  const notes = formData.get('notes') as string
  if (!name || !phone) return
  await prisma.application.create({
    data: { applicantName: name, phone, notes, status: 'new' },
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

const statusColor: Record<string, { bg: string; color: string; border: string }> = {
  new:        { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
  approved:   { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  rejected:   { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
  waitlisted: { bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
}

export default async function ApplicationsPage() {
  const applications = await prisma.application.findMany({
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div style={{ padding: '24px', maxWidth: '900px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827' }}>Applications</h1>
        <span style={{ fontSize: '13px', color: '#6b7280' }}>{applications.length} total</span>
      </div>

      {/* Add new application form */}
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '20px', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>Add New Application</h2>
        <form action={addApplication}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Name *</label>
              <input
                name="name"
                required
                placeholder="Applicant name"
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Phone *</label>
              <input
                name="phone"
                required
                placeholder="Phone number"
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Notes</label>
            <input
              name="notes"
              placeholder="Any notes (e.g. interested in floor 2)"
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
            />
          </div>
          <button
            type="submit"
            style={{ background: '#15803d', color: 'white', border: 'none', borderRadius: '8px', padding: '9px 20px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}
          >
            Add Application
          </button>
        </form>
      </div>

      {/* Applications list */}
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
        {applications.length === 0 ? (
          <p style={{ padding: '40px', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>No applications yet</p>
        ) : (
          applications.map((app, i) => {
            const s = statusColor[app.status] || statusColor.new
            return (
              <div
                key={app.id}
                style={{
                  padding: '16px 20px',
                  borderBottom: i < applications.length - 1 ? '1px solid #f3f4f6' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                }}
              >
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>{app.applicantName}</p>
                  <a href={"tel:" + app.phone} style={{ fontSize: '13px', color: '#15803d' }}>{app.phone}</a>
                  {app.notes && <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>{app.notes}</p>}
                  <p style={{ fontSize: '11px', color: '#d1d5db', marginTop: '4px' }}>
                    {new Date(app.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <span style={{
                  display: 'inline-block',
                  padding: '3px 12px',
                  borderRadius: '999px',
                  fontSize: '12px',
                  fontWeight: '600',
                  background: s.bg,
                  color: s.color,
                  border: `1px solid ${s.border}`,
                  minWidth: '80px',
                  textAlign: 'center',
                }}>
                  {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                </span>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {['new', 'approved', 'rejected', 'waitlisted'].filter(s => s !== app.status).map(s => (
                    <form key={s} action={updateStatus}>
                      <input type="hidden" name="id" value={app.id} />
                      <input type="hidden" name="status" value={s} />
                      <button
                        type="submit"
                        style={{
                          background: 'white',
                          color: '#6b7280',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          padding: '4px 10px',
                          fontSize: '12px',
                          cursor: 'pointer',
                        }}
                      >
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </button>
                    </form>
                  ))}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

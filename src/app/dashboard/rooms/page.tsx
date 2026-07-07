export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

async function addRoom(formData: FormData) {
  'use server'

  const roomNumber = String(formData.get('roomNumber') || '').trim()
  const floor = Number(formData.get('floor'))
  const monthlyRent = Number(formData.get('monthlyRent'))

  if (!roomNumber || !Number.isFinite(floor) || floor < 1 || !Number.isFinite(monthlyRent) || monthlyRent < 0) {
    return
  }

  await prisma.room.create({
    data: {
      roomNumber,
      floor,
      monthlyRent,
      status: 'available',
    },
  })

  revalidatePath('/dashboard/rooms')
  redirect('/dashboard/rooms')
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
  fontSize: '12px',
  fontWeight: '500' as const,
  color: '#374151',
  marginBottom: '4px',
}

export default async function RoomsPage() {
  const rooms = await prisma.room.findMany({
    include: { tenant: true },
    orderBy: [{ floor: 'asc' }, { roomNumber: 'asc' }],
  })

  const floors = [...new Set(rooms.map(room => room.floor))].sort((a, b) => a - b)

  const statusColor: Record<string, string> = {
    available: '#16a34a',
    occupied: '#2563eb',
    maintenance: '#d97706',
  }

  const statusBg: Record<string, string> = {
    available: '#f0fdf4',
    occupied: '#eff6ff',
    maintenance: '#fffbeb',
  }

  const statusLabel: Record<string, string> = {
    available: 'Available',
    occupied: 'Occupied',
    maintenance: 'Maintenance',
  }

  return (
    <div className="page-pad" style={{ maxWidth: '1000px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827' }}>Rooms</h1>
        <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#6b7280', flexWrap: 'wrap' }}>
          <span>Available: {rooms.filter(room => room.status === 'available').length}</span>
          <span>Occupied: {rooms.filter(room => room.status === 'occupied').length}</span>
          <span>Maintenance: {rooms.filter(room => room.status === 'maintenance').length}</span>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '20px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: '700', color: '#111827', marginBottom: '16px' }}>Add New Room</h2>
        <form action={addRoom}>
          <div className="four-col-auto">
            <div>
              <label style={labelStyle}>Room Number *</label>
              <input name="roomNumber" required placeholder="e.g. 501" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Floor *</label>
              <input name="floor" type="number" required placeholder="e.g. 5" min="1" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Monthly Rent (THB) *</label>
              <input name="monthlyRent" type="number" required placeholder="e.g. 3500" min="0" step="0.01" style={inputStyle} />
            </div>
            <button
              type="submit"
              style={{ background: '#15803d', color: 'white', border: 'none', borderRadius: '8px', padding: '9px 20px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' as const }}
            >
              + Add Room
            </button>
          </div>
        </form>
      </div>

      {floors.length === 0 ? (
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '40px', textAlign: 'center', color: '#6b7280' }}>
          No rooms yet. Add your first room above.
        </div>
      ) : (
        floors.map(floor => {
          const floorRooms = rooms.filter(room => room.floor === floor)

          return (
            <div key={floor} style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '13px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                Floor {floor} — {floorRooms.length} rooms
              </h2>

              <div className="rooms-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))', gap: '10px' }}>
                {floorRooms.map(room => {
                  const tenant = room.tenant?.status === 'active' ? room.tenant : null

                  return (
                    <Link key={room.id} href={`/dashboard/rooms/${room.id}`} style={{ textDecoration: 'none' }}>
                      <div style={{
                        background: statusBg[room.status] || 'white',
                        border: `1px solid ${statusColor[room.status] || '#e5e7eb'}`,
                        borderRadius: '12px',
                        padding: '14px',
                        cursor: 'pointer',
                        minHeight: '112px',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '6px' }}>
                          <span style={{ fontSize: '17px', fontWeight: 'bold', color: '#111827' }}>{room.roomNumber}</span>
                          <span style={{
                            fontSize: '10px',
                            fontWeight: '600',
                            color: statusColor[room.status],
                            background: 'white',
                            padding: '2px 7px',
                            borderRadius: '999px',
                            border: `1px solid ${statusColor[room.status]}`,
                          }}>
                            {statusLabel[room.status] || room.status}
                          </span>
                        </div>

                        <p style={{ fontSize: '11px', color: '#6b7280' }}>{room.monthlyRent.toLocaleString()} THB/mo</p>

                        {tenant && (
                          <>
                            <p style={{ fontSize: '12px', color: '#374151', fontWeight: '500', marginTop: '6px' }}>{tenant.fullName}</p>
                            <p style={{ fontSize: '11px', color: '#6b7280' }}>{tenant.phone}</p>
                          </>
                        )}

                        {room.status === 'available' && (
                          <p style={{ fontSize: '11px', color: '#16a34a', marginTop: '6px', fontWeight: '500' }}>+ Add tenant</p>
                        )}

                        {room.status === 'occupied' && !tenant && (
                          <p style={{ fontSize: '11px', color: '#dc2626', marginTop: '6px', fontWeight: '500' }}>Missing tenant record</p>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}

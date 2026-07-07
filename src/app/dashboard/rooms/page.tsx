export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

async function addRoom(formData: FormData) {
  'use server'
  const roomNumber  = formData.get('roomNumber') as string
  const floor       = parseInt(formData.get('floor') as string)
  const monthlyRent = parseFloat(formData.get('monthlyRent') as string)
  if (!roomNumber || !floor || !monthlyRent) return
  await prisma.room.create({
    data: { roomNumber, floor, monthlyRent, status: 'available' },
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
    include: { tenant: { where: { status: 'active' } } },
    orderBy: [{ floor: 'asc' }, { roomNumber: 'asc' }],
  })

  const floors = [...new Set(rooms.map(r => r.floor))].sort((a, b) => a - b)

  const statusColor: Record<string, string> = {
    available:   '#16a34a',
    occupied:    '#2563eb',
    maintenance: '#d97706',
  }

  const statusBg: Record<string, string> = {
    available:   '#f0fdf4',
    occupied:    '#eff6ff',
    maintenance: '#fffbeb',
  }

  const statusLabel: Record<string, string> = {
    available:   'Available',
    occupied:    'Occupied',
    maintenance: 'Maintenance',
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1000px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827' }}>Rooms</h1>
        <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#6b7280' }}>
          <span>Available: {rooms.filter(r => r.status === 'available').length}</span>
          <span>Occupied: {rooms.filter(r => r.status === 'occupied').length}</span>
          <span>Maintenance: {rooms.filter(r => r.status === 'maintenance').length}</span>
        </div>
      </div>

      {/* Add Room form */}
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '20px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: '700', color: '#111827', marginBottom: '16px' }}>Add New Room</h2>
        <form action={addRoom}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '12px', alignItems: 'flex-end' }}>
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
              <input name="monthlyRent" type="number" required placeholder="e.g. 3500" style={inputStyle} />
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

      {/* Rooms grouped by floor */}
      {floors.map(floor => {
        const floorRooms = rooms.filter(r => r.floor === floor)
        return (
          <div key={floor} style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '13px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
              Floor {floor} — {floorRooms.length} rooms
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))', gap: '10px' }}>
              {floorRooms.map(room => (
                <Link key={room.id} href={"/dashboard/rooms/" + room.id} style={{ textDecoration: 'none' }}>
                  <div style={{
                    background: statusBg[room.status] || 'white',
                    border: `1px solid ${statusColor[room.status] || '#e5e7eb'}`,
                    borderRadius: '12px',
                    padding: '14px',
                    cursor: 'pointer',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '17px', fontWeight: 'bold', color: '#111827' }}>{room.roomNumber}</span>
                      <span style={{
                        fontSize: '10px', fontWeight: '600',
                        color: statusColor[room.status],
                        background: 'white', padding: '2px 7px',
                        borderRadius: '999px', border: `1px solid ${statusColor[room.status]}`,
                      }}>
                        {statusLabel[room.status]}
                      </span>
                    </div>
                    <p style={{ fontSize: '11px', color: '#6b7280' }}>{room.monthlyRent.toLocaleString()} THB/mo</p>
                    {room.tenant && (
                      <>
                        <p style={{ fontSize: '12px', color: '#374151', fontWeight: '500', marginTop: '6px' }}>{room.tenant.fullName}</p>
                        <p style={{ fontSize: '11px', color: '#6b7280' }}>{room.tenant.phone}</p>
                      </>
                    )}
                    {room.status === 'available' && (
                      <p style={{ fontSize: '11px', color: '#16a34a', marginTop: '6px', fontWeight: '500' }}>+ Add tenant</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

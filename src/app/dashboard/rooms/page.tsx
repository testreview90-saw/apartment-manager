export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function RoomsPage() {
  const rooms = await prisma.room.findMany({
    include: { tenant: true },
    orderBy: { roomNumber: 'asc' },
  })

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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827' }}>Rooms</h1>
        <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#6b7280' }}>
          <span>Available: {rooms.filter(r => r.status === 'available').length}</span>
          <span>Occupied: {rooms.filter(r => r.status === 'occupied').length}</span>
          <span>Maintenance: {rooms.filter(r => r.status === 'maintenance').length}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
        {rooms.map(room => (
          <Link
            key={room.id}
            href={"/dashboard/rooms/" + room.id}
            style={{ textDecoration: 'none' }}
          >
            <div
              style={{
                background: statusBg[room.status] || 'white',
                border: `1px solid ${statusColor[room.status] || '#e5e7eb'}`,
                borderRadius: '12px',
                padding: '16px',
                cursor: 'pointer',
                transition: 'box-shadow 0.15s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827' }}>
                  {room.roomNumber}
                </span>
                <span style={{
                  fontSize: '11px',
                  fontWeight: '500',
                  color: statusColor[room.status],
                  background: 'white',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  border: `1px solid ${statusColor[room.status]}`,
                }}>
                  {statusLabel[room.status]}
                </span>
              </div>
              <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                Floor {room.floor} · {room.monthlyRent.toLocaleString()} THB/mo
              </p>
              {room.tenant && (
                <p style={{ fontSize: '13px', color: '#374151', fontWeight: '500', marginTop: '8px' }}>
                  {room.tenant.fullName}
                </p>
              )}
              {room.tenant && (
                <p style={{ fontSize: '12px', color: '#6b7280' }}>{room.tenant.phone}</p>
              )}
              {room.status === 'available' && (
                <p style={{ fontSize: '12px', color: '#16a34a', marginTop: '8px', fontWeight: '500' }}>
                  + Add tenant
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

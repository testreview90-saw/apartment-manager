export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'

export default async function TenantsPage() {
  const tenants = await prisma.tenant.findMany({
    where: { status: 'active' },
    include: { room: true },
    orderBy: { fullName: 'asc' },
  })

  return (
    <div style={{ padding: '24px', maxWidth: '900px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827' }}>Tenants</h1>
        <span style={{ fontSize: '13px', color: '#6b7280' }}>{tenants.length} active tenants</span>
      </div>

      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 140px 120px', gap: '0', padding: '12px 20px', borderBottom: '1px solid #f3f4f6', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
          <span>Name</span>
          <span>Room</span>
          <span>Phone</span>
          <span>Move-in</span>
        </div>

        {tenants.length === 0 ? (
          <p style={{ padding: '40px', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>No active tenants</p>
        ) : (
          tenants.map((tenant, i) => (
            <div
              key={tenant.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 80px 140px 120px',
                gap: '0',
                padding: '14px 20px',
                borderBottom: i < tenants.length - 1 ? '1px solid #f9fafb' : 'none',
                alignItems: 'center',
              }}
            >
              <div>
                <p style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>{tenant.fullName}</p>
                <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>Deposit: {tenant.deposit.toLocaleString()} THB</p>
              </div>
              <div>
                <span style={{
                  display: 'inline-block',
                  background: '#eff6ff',
                  color: '#2563eb',
                  fontSize: '13px',
                  fontWeight: '600',
                  padding: '3px 10px',
                  borderRadius: '999px',
                }}>
                  {tenant.room.roomNumber}
                </span>
              </div>
              <div>
                <a
                  href={"tel:" + tenant.phone}
                  style={{ fontSize: '14px', color: '#15803d', fontWeight: '500' }}
                >
                  {tenant.phone}
                </a>
              </div>
              <div>
                <p style={{ fontSize: '13px', color: '#6b7280' }}>
                  {new Date(tenant.moveInDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

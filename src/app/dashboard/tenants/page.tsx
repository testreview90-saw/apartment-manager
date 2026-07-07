export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { prisma } from '@/lib/prisma'

export default async function TenantsPage() {
  const tenants = await prisma.tenant.findMany({
    where: { status: 'active' },
    include: { room: true },
    orderBy: { fullName: 'asc' },
  })

  return (
    <div style={{ padding: '24px', maxWidth: '1000px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
        }}
      >
        <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827' }}>
          Tenants
        </h1>

        <span style={{ fontSize: '13px', color: '#6b7280' }}>
          {tenants.length} active tenants
        </span>
      </div>

      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.4fr 100px 150px 130px 90px',
            gap: '0',
            padding: '12px 20px',
            borderBottom: '1px solid #f3f4f6',
            fontSize: '12px',
            fontWeight: '600',
            color: '#6b7280',
            textTransform: 'uppercase',
          }}
        >
          <span>Name</span>
          <span>Room</span>
          <span>Phone</span>
          <span>Move-in</span>
          <span>Action</span>
        </div>

        {tenants.length === 0 ? (
          <p
            style={{
              padding: '40px',
              textAlign: 'center',
              color: '#6b7280',
              fontSize: '14px',
            }}
          >
            No active tenants
          </p>
        ) : (
          tenants.map((tenant, index) => (
            <div
              key={tenant.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '1.4fr 100px 150px 130px 90px',
                gap: '0',
                padding: '14px 20px',
                borderBottom:
                  index < tenants.length - 1 ? '1px solid #f9fafb' : 'none',
                alignItems: 'center',
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#111827',
                  }}
                >
                  {tenant.fullName}
                </p>

                <p
                  style={{
                    fontSize: '12px',
                    color: '#9ca3af',
                    marginTop: '2px',
                  }}
                >
                  Deposit: {tenant.deposit.toLocaleString()} THB
                </p>
              </div>

              <div>
                <span
                  style={{
                    display: 'inline-block',
                    background: tenant.room ? '#eff6ff' : '#fef2f2',
                    color: tenant.room ? '#2563eb' : '#dc2626',
                    fontSize: '13px',
                    fontWeight: '600',
                    padding: '3px 10px',
                    borderRadius: '999px',
                  }}
                >
                  {tenant.room?.roomNumber ?? 'No room'}
                </span>
              </div>

              <div>
                {tenant.phone ? (
                  <a
                    href={`tel:${tenant.phone}`}
                    style={{
                      fontSize: '14px',
                      color: '#15803d',
                      fontWeight: '500',
                    }}
                  >
                    {tenant.phone}
                  </a>
                ) : (
                  <span style={{ fontSize: '14px', color: '#9ca3af' }}>
                    No phone
                  </span>
                )}
              </div>

              <div>
                <p style={{ fontSize: '13px', color: '#6b7280' }}>
                  {new Date(tenant.moveInDate).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              </div>

              <div>
                <Link
                  href={`/dashboard/tenants/${tenant.id}`}
                  style={{
                    display: 'inline-block',
                    background: '#f3f4f6',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    fontSize: '13px',
                    fontWeight: '500',
                    textDecoration: 'none',
                  }}
                >
                  Detail
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

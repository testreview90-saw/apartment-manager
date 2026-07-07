export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

function formatDate(date: Date | string | null | undefined) {
  if (!date) return 'Not set'

  return new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatMoney(amount: number | null | undefined) {
  return `${Number(amount || 0).toLocaleString()} THB`
}

function parseTenantNotes(notes: string | null) {
  if (!notes) {
    return {
      details: [] as { label: string; value: string }[],
      otherNotes: '',
    }
  }

  const labelMap: Record<string, string> = {
    ID: 'ID Card Number',
    Job: 'Occupation',
    Occupants: 'Occupants',
    Emergency: 'Emergency Contact',
    'Emerg.phone': 'Emergency Phone',
  }

  const details: { label: string; value: string }[] = []
  const otherParts: string[] = []

  notes
    .split('|')
    .map((part) => part.trim())
    .filter(Boolean)
    .forEach((part) => {
      const colonIndex = part.indexOf(':')

      if (colonIndex > 0) {
        const rawLabel = part.slice(0, colonIndex).trim()
        const value = part.slice(colonIndex + 1).trim()

        details.push({
          label: labelMap[rawLabel] || rawLabel,
          value,
        })
      } else {
        otherParts.push(part)
      }
    })

  return {
    details,
    otherNotes: otherParts.join(' | '),
  }
}

export default async function TenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const tenantId = Number(id)

  if (!tenantId) redirect('/dashboard/tenants')

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      room: true,
      bills: {
        orderBy: { billingMonth: 'desc' },
      },
    },
  })

  if (!tenant) redirect('/dashboard/tenants')

  const parsedNotes = parseTenantNotes(tenant.notes)

  const unpaidBills = tenant.bills.filter((bill) => bill.status === 'unpaid')
  const paidBills = tenant.bills.filter((bill) => bill.status === 'paid')

  const unpaidTotal = unpaidBills.reduce(
    (sum, bill) => sum + bill.totalAmount,
    0
  )

  const latestBills = tenant.bills.slice(0, 8)

  const statusColor =
    tenant.status === 'active'
      ? '#16a34a'
      : tenant.status === 'moved_out'
      ? '#6b7280'
      : '#d97706'

  return (
    <div style={{ padding: '24px', maxWidth: '950px' }}>
      <Link
        href="/dashboard/tenants"
        style={{
          fontSize: '13px',
          color: '#6b7280',
          textDecoration: 'none',
          display: 'inline-block',
          marginBottom: '20px',
        }}
      >
        ← Back to Tenants
      </Link>

      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          padding: '24px',
          marginBottom: '16px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: '16px',
            alignItems: 'flex-start',
            marginBottom: '20px',
          }}
        >
          <div>
            <h1
              style={{
                fontSize: '28px',
                fontWeight: 'bold',
                color: '#111827',
                marginBottom: '6px',
              }}
            >
              {tenant.fullName}
            </h1>

            <p style={{ fontSize: '14px', color: '#6b7280' }}>
              Tenant ID: {tenant.id}
            </p>
          </div>

          <span
            style={{
              background: `${statusColor}20`,
              color: statusColor,
              border: `1px solid ${statusColor}`,
              borderRadius: '999px',
              padding: '5px 14px',
              fontSize: '13px',
              fontWeight: '700',
              textTransform: 'uppercase',
            }}
          >
            {tenant.status}
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '12px',
          }}
        >
          <div
            style={{
              background: '#f9fafb',
              borderRadius: '10px',
              padding: '14px',
            }}
          >
            <p style={{ fontSize: '12px', color: '#9ca3af' }}>Room</p>
            {tenant.room ? (
              <Link
                href={`/dashboard/rooms/${tenant.room.id}`}
                style={{
                  fontSize: '18px',
                  fontWeight: '700',
                  color: '#2563eb',
                  textDecoration: 'none',
                }}
              >
                {tenant.room.roomNumber}
              </Link>
            ) : (
              <p
                style={{
                  fontSize: '18px',
                  fontWeight: '700',
                  color: '#dc2626',
                }}
              >
                No room
              </p>
            )}
          </div>

          <div
            style={{
              background: '#f9fafb',
              borderRadius: '10px',
              padding: '14px',
            }}
          >
            <p style={{ fontSize: '12px', color: '#9ca3af' }}>Phone</p>
            {tenant.phone ? (
              <a
                href={`tel:${tenant.phone}`}
                style={{
                  fontSize: '18px',
                  fontWeight: '700',
                  color: '#15803d',
                  textDecoration: 'none',
                }}
              >
                {tenant.phone}
              </a>
            ) : (
              <p style={{ fontSize: '18px', fontWeight: '700' }}>No phone</p>
            )}
          </div>

          <div
            style={{
              background: '#f9fafb',
              borderRadius: '10px',
              padding: '14px',
            }}
          >
            <p style={{ fontSize: '12px', color: '#9ca3af' }}>Move-in Date</p>
            <p
              style={{
                fontSize: '18px',
                fontWeight: '700',
                color: '#111827',
              }}
            >
              {formatDate(tenant.moveInDate)}
            </p>
          </div>

          <div
            style={{
              background: '#f9fafb',
              borderRadius: '10px',
              padding: '14px',
            }}
          >
            <p style={{ fontSize: '12px', color: '#9ca3af' }}>Deposit</p>
            <p
              style={{
                fontSize: '18px',
                fontWeight: '700',
                color: '#111827',
              }}
            >
              {formatMoney(tenant.deposit)}
            </p>
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
          marginBottom: '16px',
        }}
      >
        <div
          style={{
            background: 'white',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            padding: '20px',
          }}
        >
          <h2
            style={{
              fontSize: '16px',
              fontWeight: '700',
              color: '#111827',
              marginBottom: '16px',
              paddingBottom: '10px',
              borderBottom: '1px solid #f3f4f6',
            }}
          >
            Tenant Information
          </h2>

          <div style={{ display: 'grid', gap: '12px' }}>
            <InfoRow label="Full Name" value={tenant.fullName} />
            <InfoRow label="Phone" value={tenant.phone || 'No phone'} />
            <InfoRow label="Status" value={tenant.status} />
            <InfoRow label="Created Date" value={formatDate(tenant.createdAt)} />
            <InfoRow label="Last Updated" value={formatDate(tenant.updatedAt)} />

            {parsedNotes.details.map((item) => (
              <InfoRow key={item.label} label={item.label} value={item.value} />
            ))}

            {parsedNotes.otherNotes && (
              <div>
                <p
                  style={{
                    fontSize: '12px',
                    color: '#9ca3af',
                    marginBottom: '4px',
                  }}
                >
                  Notes
                </p>
                <p
                  style={{
                    fontSize: '14px',
                    color: '#374151',
                    lineHeight: '1.6',
                  }}
                >
                  {parsedNotes.otherNotes}
                </p>
              </div>
            )}

            {!tenant.notes && (
              <p style={{ fontSize: '14px', color: '#9ca3af' }}>
                No extra tenant details saved yet.
              </p>
            )}
          </div>
        </div>

        <div
          style={{
            background: 'white',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            padding: '20px',
          }}
        >
          <h2
            style={{
              fontSize: '16px',
              fontWeight: '700',
              color: '#111827',
              marginBottom: '16px',
              paddingBottom: '10px',
              borderBottom: '1px solid #f3f4f6',
            }}
          >
            Billing Summary
          </h2>

          <div style={{ display: 'grid', gap: '12px' }}>
            <InfoRow label="Total Bills" value={String(tenant.bills.length)} />
            <InfoRow label="Paid Bills" value={String(paidBills.length)} />
            <InfoRow label="Unpaid Bills" value={String(unpaidBills.length)} />
            <InfoRow label="Unpaid Balance" value={formatMoney(unpaidTotal)} />
          </div>
        </div>
      </div>

      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          padding: '20px',
        }}
      >
        <h2
          style={{
            fontSize: '16px',
            fontWeight: '700',
            color: '#111827',
            marginBottom: '16px',
            paddingBottom: '10px',
            borderBottom: '1px solid #f3f4f6',
          }}
        >
          Recent Bills
        </h2>

        {latestBills.length === 0 ? (
          <p style={{ fontSize: '14px', color: '#9ca3af' }}>
            No bills found for this tenant.
          </p>
        ) : (
          <div style={{ display: 'grid', gap: '0' }}>
            {latestBills.map((bill, index) => (
              <div
                key={bill.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 120px 120px 100px',
                  gap: '12px',
                  padding: '12px 0',
                  borderBottom:
                    index < latestBills.length - 1
                      ? '1px solid #f3f4f6'
                      : 'none',
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
                    {bill.billingMonth}
                  </p>
                  <p style={{ fontSize: '12px', color: '#9ca3af' }}>
                    Water: {bill.waterUnits} units · Electric: {bill.elecUnits}{' '}
                    units
                  </p>
                </div>

                <p style={{ fontSize: '13px', color: '#6b7280' }}>
                  Due: {formatDate(bill.dueDate)}
                </p>

                <p
                  style={{
                    fontSize: '14px',
                    fontWeight: '700',
                    color: '#111827',
                  }}
                >
                  {formatMoney(bill.totalAmount)}
                </p>

                <span
                  style={{
                    display: 'inline-block',
                    width: 'fit-content',
                    background: bill.status === 'paid' ? '#f0fdf4' : '#fffbeb',
                    color: bill.status === 'paid' ? '#16a34a' : '#d97706',
                    border:
                      bill.status === 'paid'
                        ? '1px solid #bbf7d0'
                        : '1px solid #fde68a',
                    borderRadius: '999px',
                    padding: '4px 10px',
                    fontSize: '12px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                  }}
                >
                  {bill.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '3px' }}>
        {label}
      </p>
      <p style={{ fontSize: '14px', color: '#374151', fontWeight: '500' }}>
        {value || '-'}
      </p>
    </div>
  )
}

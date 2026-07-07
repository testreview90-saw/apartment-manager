export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { currentMonth } from '@/lib/utils'
import GenerateForm from './GenerateForm'
import Link from 'next/link'

export default async function GenerateBillsPage() {
  const month = currentMonth()
  const now = new Date()

  const settings = await prisma.setting.findMany()
  const getSetting = (key: string) => parseFloat(settings.find(s => s.settingKey === key)?.settingValue || '0')
  const waterRate = getSetting('water_rate')
  const elecRate  = getSetting('electricity_rate')
  const dueDay    = parseInt(settings.find(s => s.settingKey === 'due_day')?.settingValue || '5')
  const dueDate   = new Date(now.getFullYear(), now.getMonth(), dueDay).toISOString().split('T')[0]

  const rooms = await prisma.room.findMany({
    where: { status: 'occupied' },
   include: {
  tenant: { where: { status: 'active' }, select: { id: true, fullName: true } },
  bills: { orderBy: { billingMonth: 'desc' }, take: 1 },
},
    orderBy: { roomNumber: 'asc' },
  })

  const existingBills = await prisma.bill.findMany({
    where: { billingMonth: month },
    select: { roomId: true },
  })
  const existingRoomIds = new Set(existingBills.map(b => b.roomId))

  const roomData = rooms.map(room => ({
    id:              room.id,
    tenantId:        room.tenant?.id || 0,
    roomNumber:      room.roomNumber,
    tenantName:      room.tenant?.fullName || '',
    monthlyRent:     room.monthlyRent,
    waterPrev:       room.bills[0]?.waterCurr ?? 0,
    elecPrev:        room.bills[0]?.elecCurr ?? 0,
    hasExistingBill: existingRoomIds.has(room.id),
  }))

  return (
    <div style={{ padding: '24px', maxWidth: '1100px' }}>
      <Link href="/dashboard/bills" style={{ fontSize: '13px', color: '#6b7280', textDecoration: 'none', display: 'inline-block', marginBottom: '20px' }}>
        ← Back to Bills
      </Link>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827' }}>Generate Bills — {month}</h1>
        <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
          Enter current meter readings. Previous readings are auto-filled from last month.
          Water: ฿{waterRate}/unit · Electricity: ฿{elecRate}/unit · Due: {dueDay}th
        </p>
      </div>
      <GenerateForm
        rooms={roomData}
        waterRate={waterRate}
        elecRate={elecRate}
        month={month}
        dueDate={dueDate}
      />
    </div>
  )
}

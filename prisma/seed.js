const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('Seeding...')

  for (const [key, value] of [
    ['water_rate', '18'],
    ['electricity_rate', '7'],
    ['due_day', '5'],
    ['building_name', 'My Apartments'],
  ]) {
    await prisma.setting.upsert({
      where: { settingKey: key },
      update: {},
      create: { settingKey: key, settingValue: value },
    })
  }

  for (let floor = 1; floor <= 4; floor++) {
    for (let num = 1; num <= 5; num++) {
      const roomNumber = String(floor * 100 + num)
      await prisma.room.upsert({
        where: { roomNumber },
        update: {},
        create: { roomNumber, floor, monthlyRent: 3500, status: 'available' },
      })
    }
  }

  const tenants = [
    { roomNum: '101', name: 'สมชาย ใจดี',    phone: '081-234-5678' },
    { roomNum: '102', name: 'วิไล แสนสุข',    phone: '082-345-6789' },
    { roomNum: '103', name: 'ประเสริฐ มีสุข', phone: '083-456-7890' },
    { roomNum: '201', name: 'นงนุช ทองดี',    phone: '084-567-8901' },
    { roomNum: '202', name: 'สุรชัย พรมมา',   phone: '085-678-9012' },
    { roomNum: '301', name: 'มาลี สมใจ',      phone: '086-789-0123' },
    { roomNum: '302', name: 'ธนกร วงษ์ดี',    phone: '087-890-1234' },
    { roomNum: '303', name: 'พิมพ์ใจ ดีงาม', phone: '088-901-2345' },
    { roomNum: '401', name: 'อำนาจ ศรีดี',    phone: '089-012-3456' },
  ]

  const now     = new Date()
  const month   = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const dueDate = new Date(now.getFullYear(), now.getMonth(), 5)

  for (let i = 0; i < tenants.length; i++) {
    const { roomNum, name, phone } = tenants[i]
    const room = await prisma.room.findUnique({ where: { roomNumber: roomNum } })
    if (!room) continue

    await prisma.room.update({ where: { id: room.id }, data: { status: 'occupied' } })

    const tenant = await prisma.tenant.upsert({
      where: { roomId: room.id },
      update: {},
      create: {
        roomId: room.id, fullName: name, phone,
        moveInDate: new Date('2024-01-01'), deposit: 7000, status: 'active',
      },
    })

    const wUnits = Math.floor(Math.random() * 10) + 3
    const eUnits = Math.floor(Math.random() * 100) + 50
    const wAmt   = wUnits * 18
    const eAmt   = eUnits * 7

    await prisma.bill.upsert({
      where: { tenantId_billingMonth: { tenantId: tenant.id, billingMonth: month } },
      update: {},
      create: {
        tenantId: tenant.id, roomId: room.id, billingMonth: month,
        rentAmount: room.monthlyRent,
        waterPrev: 100, waterCurr: 100 + wUnits, waterUnits: wUnits, waterRate: 18, waterAmount: wAmt,
        elecPrev: 500, elecCurr: 500 + eUnits, elecUnits: eUnits, elecRate: 7, elecAmount: eAmt,
        totalAmount: room.monthlyRent + wAmt + eAmt, dueDate,
        status: i < 4 ? 'paid' : 'unpaid',
        paidDate: i < 4 ? now : null,
      },
    })
  }

  await prisma.room.update({ where: { roomNumber: '204' }, data: { status: 'maintenance' } })
  console.log('Done!')
}

main().catch(console.error).finally(() => prisma.$disconnect())
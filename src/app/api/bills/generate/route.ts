import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

type IncomingBill = {
  tenantId: number
  roomId: number
  billingMonth: string
  rentAmount: number
  waterPrev: number
  waterCurr: number
  waterUnits: number
  waterRate: number
  waterAmount: number
  elecPrev: number
  elecCurr: number
  elecUnits: number
  elecRate: number
  elecAmount: number
  totalAmount: number
  dueDate: string
}

function toNumber(value: unknown, fallback = 0) {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : fallback
}

function isValidMonth(value: unknown) {
  return typeof value === 'string' && /^\d{4}-\d{2}$/.test(value)
}

function normalizeBill(raw: IncomingBill) {
  const tenantId = toNumber(raw.tenantId)
  const roomId = toNumber(raw.roomId)
  const billingMonth = String(raw.billingMonth || '')
  const rentAmount = toNumber(raw.rentAmount)

  const waterPrev = toNumber(raw.waterPrev)
  const waterCurr = toNumber(raw.waterCurr)
  const elecPrev = toNumber(raw.elecPrev)
  const elecCurr = toNumber(raw.elecCurr)

  if (!tenantId || !roomId) throw new Error('Missing tenant or room.')
  if (!isValidMonth(billingMonth)) throw new Error('Invalid billing month.')
  if (rentAmount < 0) throw new Error('Rent amount cannot be negative.')
  if (waterCurr < waterPrev) throw new Error('Current water reading cannot be lower than previous reading.')
  if (elecCurr < elecPrev) throw new Error('Current electricity reading cannot be lower than previous reading.')

  const waterRate = toNumber(raw.waterRate)
  const elecRate = toNumber(raw.elecRate)
  const waterUnits = waterCurr - waterPrev
  const elecUnits = elecCurr - elecPrev
  const waterAmount = waterUnits * waterRate
  const elecAmount = elecUnits * elecRate
  const totalAmount = rentAmount + waterAmount + elecAmount
  const dueDate = new Date(raw.dueDate)

  if (Number.isNaN(dueDate.getTime())) throw new Error('Invalid due date.')

  return {
    tenantId,
    roomId,
    billingMonth,
    rentAmount,
    waterPrev,
    waterCurr,
    waterUnits,
    waterRate,
    waterAmount,
    elecPrev,
    elecCurr,
    elecUnits,
    elecRate,
    elecAmount,
    totalAmount,
    dueDate,
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    const rawBills = body?.bills

    if (!Array.isArray(rawBills) || rawBills.length === 0) {
      return NextResponse.json({ error: 'No bills to generate.' }, { status: 400 })
    }

    const bills = rawBills.map(normalizeBill)
    const billingMonth = bills[0].billingMonth

    if (bills.some(bill => bill.billingMonth !== billingMonth)) {
      return NextResponse.json({ error: 'All bills must use the same billing month.' }, { status: 400 })
    }

    const tenantIds = bills.map(bill => bill.tenantId)
    const roomIds = bills.map(bill => bill.roomId)

    const tenants = await prisma.tenant.findMany({
      where: {
        id: { in: tenantIds },
        status: 'active',
        roomId: { not: null },
      },
      select: {
        id: true,
        roomId: true,
        room: {
          select: {
            id: true,
            status: true,
            monthlyRent: true,
          },
        },
      },
    })

    const tenantMap = new Map(tenants.map(tenant => [tenant.id, tenant]))

    for (const bill of bills) {
      const tenant = tenantMap.get(bill.tenantId)
      if (!tenant || tenant.roomId !== bill.roomId || tenant.room?.status !== 'occupied') {
        return NextResponse.json(
          { error: `Room or tenant is not valid for tenant ID ${bill.tenantId}.` },
          { status: 400 },
        )
      }
    }

    const existingBills = await prisma.bill.findMany({
      where: {
        billingMonth,
        OR: [
          { tenantId: { in: tenantIds } },
          { roomId: { in: roomIds } },
        ],
      },
      select: { tenantId: true, roomId: true },
    })

    if (existingBills.length > 0) {
      return NextResponse.json(
        { error: 'Some selected rooms already have bills for this month. Refresh the page and try again.' },
        { status: 409 },
      )
    }

    await prisma.$transaction(
      bills.map(bill =>
        prisma.bill.create({
          data: {
            tenantId: bill.tenantId,
            roomId: bill.roomId,
            billingMonth: bill.billingMonth,
            rentAmount: bill.rentAmount,
            waterPrev: bill.waterPrev,
            waterCurr: bill.waterCurr,
            waterUnits: bill.waterUnits,
            waterRate: bill.waterRate,
            waterAmount: bill.waterAmount,
            elecPrev: bill.elecPrev,
            elecCurr: bill.elecCurr,
            elecUnits: bill.elecUnits,
            elecRate: bill.elecRate,
            elecAmount: bill.elecAmount,
            totalAmount: bill.totalAmount,
            dueDate: bill.dueDate,
            status: 'unpaid',
          },
        }),
      ),
    )

    return NextResponse.json({ ok: true, count: bills.length })
  } catch (error) {
    console.error('Bill generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate bills.' },
      { status: 500 },
    )
  }
}

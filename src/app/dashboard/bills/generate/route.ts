import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { bills } = await req.json()
    for (const bill of bills) {
      await prisma.bill.create({
        data: {
          tenantId:     bill.tenantId,
          roomId:       bill.roomId,
          billingMonth: bill.billingMonth,
          rentAmount:   bill.rentAmount,
          waterPrev:    bill.waterPrev,
          waterCurr:    bill.waterCurr,
          waterUnits:   bill.waterUnits,
          waterRate:    bill.waterRate,
          waterAmount:  bill.waterAmount,
          elecPrev:     bill.elecPrev,
          elecCurr:     bill.elecCurr,
          elecUnits:    bill.elecUnits,
          elecRate:     bill.elecRate,
          elecAmount:   bill.elecAmount,
          totalAmount:  bill.totalAmount,
          dueDate:      new Date(bill.dueDate),
          status:       'unpaid',
        },
      })
    }
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

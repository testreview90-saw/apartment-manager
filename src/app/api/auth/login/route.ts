import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'

export async function POST(req: NextRequest) {
  const { username, password } = await req.json()

  if (
    username !== process.env.ADMIN_USERNAME ||
    password !== process.env.ADMIN_PASSWORD
  ) {
    return NextResponse.json({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' }, { status: 401 })
  }

  const session = await getSession()
  session.isLoggedIn = true
  session.username = username
  await session.save()

  return NextResponse.json({ ok: true })
}
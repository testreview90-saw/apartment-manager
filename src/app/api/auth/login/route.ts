import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getSession } from '@/lib/session'

export const runtime = 'nodejs'

const failedAttempts = new Map<string, { count: number; firstAttemptAt: number }>()
const WINDOW_MS = 10 * 60 * 1000
const MAX_ATTEMPTS = 6

function getClientKey(req: NextRequest) {
  const forwardedFor = req.headers.get('x-forwarded-for')
  return forwardedFor?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown'
}

function isRateLimited(key: string) {
  const now = Date.now()
  const record = failedAttempts.get(key)

  if (!record) return false

  if (now - record.firstAttemptAt > WINDOW_MS) {
    failedAttempts.delete(key)
    return false
  }

  return record.count >= MAX_ATTEMPTS
}

function recordFailedAttempt(key: string) {
  const now = Date.now()
  const record = failedAttempts.get(key)

  if (!record || now - record.firstAttemptAt > WINDOW_MS) {
    failedAttempts.set(key, { count: 1, firstAttemptAt: now })
    return
  }

  failedAttempts.set(key, { count: record.count + 1, firstAttemptAt: record.firstAttemptAt })
}

async function passwordMatches(password: string) {
  const passwordHash = process.env.ADMIN_PASSWORD_HASH
  const plainPassword = process.env.ADMIN_PASSWORD

  if (passwordHash) {
    return bcrypt.compare(password, passwordHash)
  }

  if (!plainPassword) {
    throw new Error('Missing ADMIN_PASSWORD or ADMIN_PASSWORD_HASH environment variable.')
  }

  return password === plainPassword
}

export async function POST(req: NextRequest) {
  try {
    const key = getClientKey(req)

    if (isRateLimited(key)) {
      return NextResponse.json(
        { error: 'Too many failed attempts. Please try again later.' },
        { status: 429 },
      )
    }

    const body = await req.json().catch(() => null)
    const username = String(body?.username || '').trim()
    const password = String(body?.password || '')

    const adminUsername = process.env.ADMIN_USERNAME
    if (!adminUsername) {
      return NextResponse.json({ error: 'Server login is not configured.' }, { status: 500 })
    }

    const validUsername = username === adminUsername
    const validPassword = password ? await passwordMatches(password) : false

    if (!validUsername || !validPassword) {
      recordFailedAttempt(key)
      return NextResponse.json({ error: 'Wrong username or password' }, { status: 401 })
    }

    failedAttempts.delete(key)

    const session = await getSession()
    session.isLoggedIn = true
    session.username = username
    await session.save()

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Login failed. Check server configuration.' }, { status: 500 })
  }
}

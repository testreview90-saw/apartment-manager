import { getIronSession, SessionOptions } from 'iron-session'
import { cookies } from 'next/headers'

export interface SessionData {
  isLoggedIn: boolean
  username: string
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET as string,
  cookieName: 'apt-mgr-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7,
  },
}

export async function getSession() {
  return getIronSession<SessionData>(cookies(), sessionOptions)
}
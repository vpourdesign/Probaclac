import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { cookies } from 'next/headers'

const PASSWORD = process.env.DASHBOARD_PASSWORD ?? 'probaclac2024'
const COOKIE   = 'dash_auth'

export async function POST(req: NextRequest) {
  const { password } = await req.json()
  if (password !== PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const res = NextResponse.json({ ok: true })
  res.cookies.set(COOKIE, PASSWORD, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    secure: process.env.NODE_ENV === 'production',
  })
  return res
}

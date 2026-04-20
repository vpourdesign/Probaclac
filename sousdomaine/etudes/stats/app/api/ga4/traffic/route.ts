import { NextResponse } from 'next/server'
import { fetchGA4Traffic } from '@/lib/data'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    return NextResponse.json(await fetchGA4Traffic())
  } catch (err: any) {
    console.error('GA4 traffic error:', err)
    return NextResponse.json({ error: err?.message ?? 'Unknown GA4 error' }, { status: 500 })
  }
}

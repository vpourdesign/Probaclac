import { NextResponse } from 'next/server'
import { fetchGA4Conversions } from '@/lib/data'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    return NextResponse.json(await fetchGA4Conversions())
  } catch (err: any) {
    console.error('GA4 conversions error:', err)
    return NextResponse.json({ error: err?.message ?? 'Unknown GA4 error' }, { status: 500 })
  }
}

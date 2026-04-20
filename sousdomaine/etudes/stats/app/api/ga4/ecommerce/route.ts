import { NextResponse } from 'next/server'
import { fetchGA4Ecommerce } from '@/lib/data'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    return NextResponse.json(await fetchGA4Ecommerce())
  } catch (err: any) {
    console.error('GA4 ecommerce error:', err)
    return NextResponse.json({ error: err?.message ?? 'Unknown GA4 error' }, { status: 500 })
  }
}

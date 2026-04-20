import { NextResponse } from 'next/server'
import { fetchGSCKeywords } from '@/lib/data'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    return NextResponse.json(await fetchGSCKeywords())
  } catch (err: any) {
    console.error('GSC error:', err)
    return NextResponse.json({ error: err?.message ?? 'Unknown GSC error' }, { status: 500 })
  }
}

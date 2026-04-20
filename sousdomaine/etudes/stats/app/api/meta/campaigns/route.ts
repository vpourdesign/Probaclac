import { NextResponse } from 'next/server'
import { fetchMetaCampaigns } from '@/lib/data'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    return NextResponse.json(await fetchMetaCampaigns())
  } catch (err: any) {
    console.error('Meta campaigns error:', err)
    return NextResponse.json({ error: err?.message ?? 'Unknown Meta error' }, { status: 500 })
  }
}

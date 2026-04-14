import { NextResponse } from 'next/server'

// Mock — will be replaced by real Meta Marketing API call
export async function GET() {
  const data = {
    totalSpend: 1_840.50,
    totalImpressions: 148_000,
    totalClicks: 3_720,
    totalConversions: 94,
    avgCpc: 0.49,
    avgCpm: 12.44,
    roas: 2.8,
    campaigns: [
      {
        id: 'c1',
        name: 'Prospection — Mères 25-45',
        status: 'ACTIVE',
        spend: 840.00,
        impressions: 68_000,
        clicks: 1_820,
        conversions: 48,
        cpc: 0.46,
        roas: 3.1,
      },
      {
        id: 'c2',
        name: 'Retargeting site — 30j',
        status: 'ACTIVE',
        spend: 620.50,
        impressions: 42_000,
        clicks: 1_100,
        conversions: 36,
        cpc: 0.56,
        roas: 2.9,
      },
      {
        id: 'c3',
        name: 'Notoriété produit Bébé',
        status: 'PAUSED',
        spend: 380.00,
        impressions: 38_000,
        clicks: 800,
        conversions: 10,
        cpc: 0.48,
        roas: 1.8,
      },
    ],
  }
  return NextResponse.json(data)
}

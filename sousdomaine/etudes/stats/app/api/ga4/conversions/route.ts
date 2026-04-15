import { NextResponse } from 'next/server'

// Mock — will be replaced by real GA4 Data API call
export async function GET() {
  const data = {
    totalConversions: 184,
    conversionRate: 0.048,
    goals: [
      { name: 'Achat boutique',       conversions: 87,  value: 4_350 },
      { name: 'Contact formulaire',   conversions: 53,  value: 0     },
      { name: 'Téléchargement guide', conversions: 44,  value: 0     },
    ],
    // Weekly conversions last 8 weeks
    weekly: Array.from({ length: 8 }, (_, i) => ({
      week: `S${i + 1}`,
      conversions: Math.round(15 + Math.random() * 25),
    })),
  }
  return NextResponse.json(data)
}

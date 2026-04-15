import { NextResponse } from 'next/server'

// Mock — will be replaced by real GA4 Data API call
export async function GET() {
  const data = {
    sessions: 3842,
    users: 2971,
    newUsers: 1804,
    avgSessionDuration: 147, // seconds
    bounceRate: 0.42,
    // Daily sessions for last 30 days
    timeSeries: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 86_400_000).toISOString().slice(0, 10),
      sessions: Math.round(100 + Math.random() * 120),
      users: Math.round(75 + Math.random() * 90),
    })),
    // Top channels
    channels: [
      { channel: 'Organic Search', sessions: 1620 },
      { channel: 'Direct',         sessions: 890  },
      { channel: 'Social',         sessions: 540  },
      { channel: 'Referral',       sessions: 430  },
      { channel: 'Email',          sessions: 210  },
      { channel: 'Paid Search',    sessions: 152  },
    ],
  }
  return NextResponse.json(data)
}

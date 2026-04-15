import { NextResponse } from 'next/server'

// Mock — will be replaced by real Search Console API call
export async function GET() {
  const data = {
    totalClicks: 1_240,
    totalImpressions: 28_600,
    avgCtr: 0.043,
    avgPosition: 14.2,
    keywords: [
      { query: 'probiotiques canada',        clicks: 312, impressions: 4_200, ctr: 0.074, position: 3.1  },
      { query: 'probiotiques bébé',           clicks: 187, impressions: 3_800, ctr: 0.049, position: 5.8  },
      { query: 'probaclac',                   clicks: 156, impressions: 980,   ctr: 0.159, position: 1.2  },
      { query: 'meilleurs probiotiques',      clicks: 98,  impressions: 5_100, ctr: 0.019, position: 22.4 },
      { query: 'probiotiques grossesse',      clicks: 87,  impressions: 2_300, ctr: 0.038, position: 8.6  },
      { query: 'probiotiques enfant québec',  clicks: 76,  impressions: 1_700, ctr: 0.045, position: 11.2 },
      { query: 'lactobacillus rhamnosus',     clicks: 65,  impressions: 2_100, ctr: 0.031, position: 16.0 },
      { query: 'flore intestinale santé',     clicks: 54,  impressions: 3_400, ctr: 0.016, position: 28.5 },
      { query: 'probiotiques coliques',       clicks: 48,  impressions: 1_900, ctr: 0.025, position: 19.3 },
      { query: 'acheter probiotiques quebec', clicks: 42,  impressions: 890,   ctr: 0.047, position: 7.4  },
    ],
  }
  return NextResponse.json(data)
}

import { readFileSync } from 'fs'
import { BetaAnalyticsDataClient } from '@google-analytics/data'

const env = readFileSync('.env.local', 'utf8')
const getVar = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1] ?? ''
const credentials = JSON.parse(Buffer.from(getVar('GOOGLE_SERVICE_ACCOUNT_KEY'), 'base64').toString())
const client = new BetaAnalyticsDataClient({ credentials })
const property = `properties/${getVar('GA4_PROPERTY_ID')}`

console.log('── Top pageLocation (URLs) en realtime ──')
const [r] = await client.runRealtimeReport({
  property,
  dimensions: [{ name: 'pageLocation' }],
  metrics: [{ name: 'screenPageViews' }],
  orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
  limit: 15,
})
r.rows?.forEach(row => {
  const mark = row.dimensionValues[0].value.toLowerCase().includes('sci') ? ' ⭐' : ''
  console.log(`  ${row.metricValues[0].value.padStart(3)}× ${row.dimensionValues[0].value}${mark}`)
})

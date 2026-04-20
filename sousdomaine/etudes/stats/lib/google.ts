import { BetaAnalyticsDataClient } from '@google-analytics/data'
import { google } from 'googleapis'

/**
 * Decode the service account JSON from the base64-encoded env var.
 * Throws if GOOGLE_SERVICE_ACCOUNT_KEY is missing or malformed.
 */
function getCredentials() {
  const keyB64 = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
  if (!keyB64) {
    throw new Error(
      'GOOGLE_SERVICE_ACCOUNT_KEY is not set. Add the base64 of service-account.json to .env.local',
    )
  }
  try {
    const json = Buffer.from(keyB64, 'base64').toString('utf8')
    return JSON.parse(json)
  } catch (err) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY is not valid base64-encoded JSON')
  }
}

// ── GA4 Data API ────────────────────────────────────────────────────────
let ga4Client: BetaAnalyticsDataClient | null = null

export function getGA4Client() {
  if (!ga4Client) {
    ga4Client = new BetaAnalyticsDataClient({ credentials: getCredentials() })
  }
  return ga4Client
}

export function getGA4Property() {
  const id = process.env.GA4_PROPERTY_ID
  if (!id) throw new Error('GA4_PROPERTY_ID is not set')
  return `properties/${id}`
}

// ── Search Console (Webmasters v3) ──────────────────────────────────────
export function getGSCClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: getCredentials(),
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  })
  return google.webmasters({ version: 'v3', auth })
}

export function getGSCSiteUrl() {
  const url = process.env.GSC_SITE_URL
  if (!url) throw new Error('GSC_SITE_URL is not set')
  return url
}

// ── Utils ───────────────────────────────────────────────────────────────
/** "20260414" → "2026-04-14" */
export function formatGA4Date(raw: string): string {
  return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`
}

/** Safe parse of a GA4 metric string (can be null/undefined). */
export function num(v: string | null | undefined): number {
  return v ? Number(v) : 0
}

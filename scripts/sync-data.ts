import fs from 'fs'
import path from 'path'

const DATA_URL = 'https://yc-oss.github.io/api/industries/healthcare.json'
const DATA_DIR = path.join(process.cwd(), 'data')
const COMPANIES_FILE = path.join(DATA_DIR, 'companies.json')
const ANALYTICS_FILE = path.join(DATA_DIR, 'analytics.json')
const OVERRIDES_FILE = path.join(DATA_DIR, 'funding-overrides.json')

const AI_TAGS = new Set([
  'ai', 'artificial intelligence', 'machine learning', 'ml', 'nlp',
  'natural language processing', 'deep learning', 'generative ai', 'llm',
  'computer vision', 'predictive analytics', 'ai/ml',
])

function parseBatch(batch: string): { year: number; season: string } {
  const parts = batch.split(' ')
  if (parts.length === 2) {
    return { year: parseInt(parts[1]) || 0, season: parts[0] }
  }
  // Handle IK (Imagine K12), etc.
  return { year: 0, season: batch }
}

function batchSortKey(batch: string): number {
  const { year, season } = parseBatch(batch)
  const seasonOrder: Record<string, number> = { Winter: 0, Spring: 1, Summer: 2, Fall: 3 }
  return year * 10 + (seasonOrder[season] ?? 5)
}

function deriveIsAI(tags: string[], description: string): boolean {
  const combined = [...tags.map(t => t.toLowerCase()), description.toLowerCase()]
  return combined.some(t =>
    AI_TAGS.has(t) ||
    t.includes('artificial intelligence') ||
    t.includes('machine learning') ||
    t.includes('generative ai') ||
    t.includes(' ai ') ||
    t.startsWith('ai-') ||
    t.endsWith('-ai')
  )
}

function normalizeStatus(raw: string): 'active' | 'acquired' | 'public' | 'inactive' {
  const s = (raw || '').toLowerCase()
  if (s === 'acquired') return 'acquired'
  if (s === 'public') return 'public'
  if (s === 'inactive') return 'inactive'
  return 'active'
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeCompany(raw: any, overrides: Record<string, any>) {
  const { year, season } = parseBatch(raw.batch || '')
  const tags: string[] = raw.tags || []
  const isAI = deriveIsAI(tags, (raw.long_description || '') + ' ' + (raw.one_liner || ''))

  return {
    slug: raw.slug,
    name: raw.name,
    oneLiner: raw.one_liner || '',
    longDescription: raw.long_description || '',
    logoUrl: raw.small_logo_thumb_url || '',
    website: raw.website || '',
    ycUrl: raw.url || `https://www.ycombinator.com/companies/${raw.slug}`,
    batch: raw.batch || '',
    year,
    season,
    subindustry: (raw.subindustry || 'Other').replace(/^Healthcare -> /, ''),
    tags,
    region: (raw.regions || [])[0] || 'Unknown',
    location: typeof raw.all_locations === 'string'
      ? raw.all_locations.split(';')[0].trim()
      : (raw.all_locations || [])[0] || '',
    teamSize: raw.team_size || null,
    status: normalizeStatus(raw.status),
    isTopCompany: !!raw.top_company,
    isAI,
    ...(overrides[raw.slug] ? { funding: overrides[raw.slug] } : {}),
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildAnalytics(companies: any[]) {
  const byBatchMap = new Map<string, { year: number; season: string; count: number }>()
  const bySubindustryMap = new Map<string, { count: number; aiCount: number; topCount: number; acquiredOrPublicCount: number }>()
  const byStatus: Record<string, number> = {}
  const byRegion: Record<string, number> = {}

  for (const c of companies) {
    // batch
    if (c.batch) {
      if (!byBatchMap.has(c.batch)) {
        byBatchMap.set(c.batch, { year: c.year, season: c.season, count: 0 })
      }
      byBatchMap.get(c.batch)!.count++
    }

    // subindustry
    const sub = c.subindustry || 'Other'
    if (!bySubindustryMap.has(sub)) {
      bySubindustryMap.set(sub, { count: 0, aiCount: 0, topCount: 0, acquiredOrPublicCount: 0 })
    }
    const s = bySubindustryMap.get(sub)!
    s.count++
    if (c.isAI) s.aiCount++
    if (c.isTopCompany) s.topCount++
    if (c.status === 'acquired' || c.status === 'public') s.acquiredOrPublicCount++

    // status
    byStatus[c.status] = (byStatus[c.status] || 0) + 1

    // region
    const region = c.region || 'Unknown'
    byRegion[region] = (byRegion[region] || 0) + 1
  }

  const byBatch = [...byBatchMap.entries()]
    .map(([batch, data]) => ({ batch, ...data }))
    .sort((a, b) => batchSortKey(a.batch) - batchSortKey(b.batch))

  const bySubindustry = [...bySubindustryMap.entries()]
    .map(([subindustry, data]) => ({ subindustry, ...data }))
    .sort((a, b) => b.count - a.count)

  return {
    totalCompanies: companies.length,
    aiCount: companies.filter(c => c.isAI).length,
    topCompanyCount: companies.filter(c => c.isTopCompany).length,
    acquiredOrPublicCount: companies.filter(c => c.status === 'acquired' || c.status === 'public').length,
    byBatch,
    bySubindustry,
    byStatus,
    byRegion,
    subindustries: bySubindustry.map(s => s.subindustry),
    batches: byBatch.map(b => b.batch),
    regions: Object.keys(byRegion).sort((a, b) => byRegion[b] - byRegion[a]),
    updatedAt: new Date().toISOString(),
  }
}

async function main() {
  console.log('Fetching YC healthcare companies...')
  const res = await fetch(DATA_URL)
  if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`)
  const raw = await res.json()
  console.log(`  Got ${raw.length} companies`)

  const overrides = JSON.parse(fs.readFileSync(OVERRIDES_FILE, 'utf-8'))

  const companies = raw.map((c: unknown) => normalizeCompany(c, overrides))
  const analytics = buildAnalytics(companies)

  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
  fs.writeFileSync(COMPANIES_FILE, JSON.stringify(companies, null, 2))
  fs.writeFileSync(ANALYTICS_FILE, JSON.stringify(analytics, null, 2))

  console.log(`  Wrote ${companies.length} companies → data/companies.json`)
  console.log(`  Wrote analytics → data/analytics.json`)
  console.log(`  AI companies: ${analytics.aiCount}`)
  console.log(`  Top companies: ${analytics.topCompanyCount}`)
  console.log(`  Acquired/Public: ${analytics.acquiredOrPublicCount}`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})

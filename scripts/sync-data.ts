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

// Ordered by specificity — the first matching sector wins. Used ONLY to backfill
// YC's "Other" (uncategorized) bucket from a company's free-form tags. Results are
// flagged as inferred so they're never confused with YC's official subindustries.
const TAG_SECTOR_RULES: { sector: string; tags: string[] }[] = [
  { sector: 'Medical Devices', tags: ['medical devices', 'medical device'] },
  { sector: 'Diagnostics', tags: ['diagnostics'] },
  { sector: 'Drug Discovery and Delivery', tags: ['drug discovery', 'ai-powered drug discovery', 'drug delivery'] },
  { sector: 'Therapeutics', tags: ['therapeutics', 'gene therapy', 'cell therapy'] },
  { sector: 'Healthcare IT', tags: ['healthcare it', 'ehr', 'electronic health records'] },
  { sector: 'Healthcare Services', tags: ['insurance', 'health insurance', 'telehealth', 'telemedicine', 'healthcare services'] },
  { sector: 'Consumer Health and Wellness', tags: ['consumer health services', 'consumer health', 'health & wellness', 'wellness', 'fitness', 'mental health', 'mental health tech'] },
]

function inferSubindustryFromTags(tags: string[]): string | null {
  const lower = tags.map(t => t.toLowerCase().trim())
  for (const rule of TAG_SECTOR_RULES) {
    if (rule.tags.some(t => lower.includes(t))) return rule.sector
  }
  return null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeCompany(raw: any, overrides: Record<string, any>) {
  const { year, season } = parseBatch(raw.batch || '')
  const tags: string[] = raw.tags || []
  const isAI = deriveIsAI(tags, (raw.long_description || '') + ' ' + (raw.one_liner || ''))

  // YC stores subindustry as "Healthcare -> Healthcare IT" etc. Strip the prefix.
  // Companies with only the top-level "Healthcare" (no subcategory assigned by YC)
  // fall into "Other". For those, try to infer a sector from the free-form tags
  // and flag it as inferred.
  let subindustry = ((s: string) => (!s || s === 'Healthcare' ? 'Other' : s))(
    (raw.subindustry || '').replace(/^Healthcare -> /, '')
  )
  let subindustryInferred = false
  if (subindustry === 'Other') {
    const guess = inferSubindustryFromTags(tags)
    if (guess) {
      subindustry = guess
      subindustryInferred = true
    }
  }

  return {
    slug: raw.slug,
    name: raw.name,
    oneLiner: raw.one_liner || '',
    longDescription: raw.long_description || '',
    // yc-oss returns a relative placeholder ("/company/thumb/missing.png") for
    // companies with no logo — treat anything that isn't a real http(s) URL as
    // "no logo" so the UI shows its letter-avatar fallback instead of a 404.
    logoUrl: (raw.small_logo_thumb_url || '').startsWith('http')
      ? raw.small_logo_thumb_url
      : '',
    website: raw.website || '',
    ycUrl: raw.url || `https://www.ycombinator.com/companies/${raw.slug}`,
    batch: raw.batch || '',
    year,
    season,
    subindustry,
    subindustryInferred,
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

  const years = companies.map(c => c.year).filter(y => y > 0)
  const maxYear = years.length ? Math.max(...years) : new Date().getFullYear()
  const recentCutoff = maxYear - 1 // recent window = last two years

  // "Other" is YC's catch-all bucket for companies with no specific subindustry
  // — exclude it from sector analysis so the real sectors surface.
  const CATCH_ALL = 'Other'
  const isCategorized = (c: { subindustry: string }) => c.subindustry !== CATCH_ALL

  // ---- Sector momentum: which canonical YC subindustries are rising/cooling ----
  // Compared as share of categorized companies, recent window vs all-time.
  const categorizedAll = companies.filter(isCategorized)
  const categorizedRecent = categorizedAll.filter(c => c.year >= recentCutoff)
  const totalCatAll = categorizedAll.length || 1
  const totalCatRecent = categorizedRecent.length || 1

  const sectorMomentum = bySubindustry
    .filter(s => s.subindustry !== CATCH_ALL)
    .map(s => {
      const recentCount = categorizedRecent.filter(c => c.subindustry === s.subindustry).length
      const allCount = s.count
      const recentShare = recentCount / totalCatRecent
      const allShare = allCount / totalCatAll
      return {
        subindustry: s.subindustry,
        allCount,
        recentCount,
        recentShare,
        allShare,
        // >1 means over-indexed in recent batches (rising), <1 means cooling
        lift: allShare > 0 ? recentShare / allShare : 1,
      }
    })
    .sort((a, b) => b.lift - a.lift)

  // ---- Whitespace: least-crowded real sector (opportunity signal) ----
  const realSectors = bySubindustry.filter(s => s.subindustry !== CATCH_ALL)
  const whitespaceSector = realSectors.length
    ? realSectors.reduce((min, s) => (s.count < min.count ? s : min))
    : null

  // ---- Current-year momentum snapshot ----
  const currentYearCompanies = companies.filter(c => c.year === maxYear)
  const cySubCount = new Map<string, number>()
  for (const c of currentYearCompanies.filter(isCategorized)) {
    cySubCount.set(c.subindustry, (cySubCount.get(c.subindustry) || 0) + 1)
  }
  const topCySub = [...cySubCount.entries()].sort((a, b) => b[1] - a[1])[0]
  const currentYearStats = {
    year: maxYear,
    count: currentYearCompanies.length,
    aiCount: currentYearCompanies.filter(c => c.isAI).length,
    aiPct: currentYearCompanies.length
      ? Math.round(currentYearCompanies.filter(c => c.isAI).length / currentYearCompanies.length * 100)
      : 0,
    topSubindustry: topCySub ? topCySub[0] : '',
    topSubindustryCount: topCySub ? topCySub[1] : 0,
    whitespaceSector: whitespaceSector ? whitespaceSector.subindustry : '',
    whitespaceSectorCount: whitespaceSector ? whitespaceSector.count : 0,
  }

  const totalAll = companies.length || 1
  const latestBatch = byBatch.length ? byBatch[byBatch.length - 1].batch : ''

  // ---- Current batch snapshot (the latest batch — "who just joined") ----
  const currentBatchCompanies = companies.filter(c => c.batch === latestBatch)
  const currentBatchStats = {
    batch: latestBatch,
    count: currentBatchCompanies.length,
    aiCount: currentBatchCompanies.filter(c => c.isAI).length,
    aiPct: currentBatchCompanies.length
      ? Math.round(currentBatchCompanies.filter(c => c.isAI).length / currentBatchCompanies.length * 100)
      : 0,
  }

  // ---- Current-year sector distribution ("what's being built now") ----
  // Includes the "Other" (not-yet-categorized) bucket, shown honestly. Each
  // real sector carries its all-time momentum lift so we can flag rising/cooling.
  const liftBySector = new Map(sectorMomentum.map(s => [s.subindustry, s.lift]))
  const cyAllSubCount = new Map<string, number>()
  for (const c of currentYearCompanies) {
    cyAllSubCount.set(c.subindustry, (cyAllSubCount.get(c.subindustry) || 0) + 1)
  }
  const currentYearSectors = [...cyAllSubCount.entries()]
    .map(([subindustry, count]) => ({
      subindustry,
      count,
      lift: liftBySector.get(subindustry) ?? null,
    }))
    .sort((a, b) => {
      // Keep the catch-all last regardless of count.
      if (a.subindustry === CATCH_ALL) return 1
      if (b.subindustry === CATCH_ALL) return -1
      return b.count - a.count
    })

  return {
    totalCompanies: companies.length,
    aiCount: companies.filter(c => c.isAI).length,
    aiPct: Math.round(companies.filter(c => c.isAI).length / totalAll * 100),
    topCompanyCount: companies.filter(c => c.isTopCompany).length,
    acquiredOrPublicCount: companies.filter(c => c.status === 'acquired' || c.status === 'public').length,
    byBatch,
    bySubindustry,
    byStatus,
    byRegion,
    subindustries: bySubindustry.map(s => s.subindustry),
    batches: byBatch.map(b => b.batch),
    regions: Object.keys(byRegion).sort((a, b) => byRegion[b] - byRegion[a]),
    sectorMomentum,
    currentYearStats,
    currentBatchStats,
    currentYearSectors,
    latestBatch,
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

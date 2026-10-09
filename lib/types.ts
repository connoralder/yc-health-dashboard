export type CompanyStatus = 'active' | 'acquired' | 'public' | 'inactive'

export interface FundingOverride {
  totalRaised: string
  lastRound: string
  lastRoundDate: string
  leadInvestors: string[]
  source: string
  sourceUrl: string
  asOf: string
}

export interface Company {
  slug: string
  name: string
  oneLiner: string
  longDescription: string
  logoUrl: string
  website: string
  ycUrl: string
  batch: string
  year: number
  season: string
  subindustry: string
  subindustryInferred: boolean
  tags: string[]
  region: string
  location: string
  teamSize: number | null
  status: CompanyStatus
  isTopCompany: boolean
  isAI: boolean
  funding?: FundingOverride
}

export interface BatchPoint {
  batch: string
  year: number
  season: string
  count: number
}

export interface SubindustryPoint {
  subindustry: string
  count: number
  aiCount: number
  topCount: number
  acquiredOrPublicCount: number
}

export interface SectorMomentum {
  subindustry: string
  allCount: number
  recentCount: number
  recentShare: number
  allShare: number
  lift: number
}

export interface CurrentYearStats {
  year: number
  count: number
  aiCount: number
  aiPct: number
  topSubindustry: string
  topSubindustryCount: number
  whitespaceSector: string
  whitespaceSectorCount: number
}

export interface CurrentBatchStats {
  batch: string
  count: number
  aiCount: number
  aiPct: number
}

export interface CurrentYearSector {
  subindustry: string
  count: number
  lift: number | null
}

export interface Analytics {
  totalCompanies: number
  aiCount: number
  aiPct: number
  topCompanyCount: number
  acquiredOrPublicCount: number
  byBatch: BatchPoint[]
  bySubindustry: SubindustryPoint[]
  byStatus: Record<string, number>
  byRegion: Record<string, number>
  subindustries: string[]
  batches: string[]
  regions: string[]
  sectorMomentum: SectorMomentum[]
  currentYearStats: CurrentYearStats
  currentBatchStats: CurrentBatchStats
  currentYearSectors: CurrentYearSector[]
  latestBatch: string
  updatedAt: string
}

export interface FundingOverrides {
  [slug: string]: FundingOverride
}

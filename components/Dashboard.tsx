'use client'

import { useState, useMemo, useRef } from 'react'
import { Search, Filter, RefreshCw, ArrowDownWideNarrow } from 'lucide-react'
import { Input } from '@/components/ui/input'
import CompanyCard from '@/components/CompanyCard'
import FeaturedHero from '@/components/FeaturedHero'
import type { Company, Analytics } from '@/lib/types'

interface Filters {
  query: string
  year: string
  subindustry: string
  status: string
  region: string
  batch: string
  isAI: string
  isTop: string
}

type SortKey = 'recent' | 'oldest' | 'name' | 'team' | 'status'

const SEASON_ORDER: Record<string, number> = { Winter: 0, Spring: 1, Summer: 2, Fall: 3 }
const STATUS_ORDER: Record<string, number> = { acquired: 0, public: 1, active: 2, inactive: 3 }

function recencyKey(c: Company): number {
  return c.year * 10 + (SEASON_ORDER[c.season] ?? 5)
}

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'recent', label: 'Most recent' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'name', label: 'Name (A–Z)' },
  { value: 'team', label: 'Team size' },
  { value: 'status', label: 'Status' },
]

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[] | string[]
}) {
  const opts = options.map(o => (typeof o === 'string' ? { value: o, label: o } : o))
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-orange-300 min-w-0"
    >
      <option value="">{label}</option>
      {opts.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}

export default function Dashboard({
  companies: allCompanies,
  analytics,
  featured,
  currentBatchCompanies,
}: {
  companies: Company[]
  analytics: Analytics
  featured: Company | null
  currentBatchCompanies: Company[]
}) {
  const currentYear = analytics.currentYearStats.year

  const EMPTY_FILTERS: Filters = useMemo(() => ({
    query: '',
    year: '',
    subindustry: '',
    status: '',
    region: '',
    batch: '',
    isAI: '',
    isTop: '',
  }), [])

  // Default view: current year only.
  const [filters, setFilters] = useState<Filters>({ ...EMPTY_FILTERS, year: String(currentYear) })
  const [sort, setSort] = useState<SortKey>('recent')
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 48
  const explorerRef = useRef<HTMLDivElement>(null)

  const years = useMemo(
    () => [...new Set(allCompanies.map(c => c.year).filter(y => y > 0))].sort((a, b) => b - a),
    [allCompanies]
  )

  const set = (key: keyof Filters) => (val: string) => {
    setFilters(f => ({ ...f, [key]: val }))
    setPage(0)
  }

  // Clicking a sector in the momentum widget: filter to that subindustry across
  // all years, then jump to the explorer.
  const handleSectorClick = (sector: string) => {
    setFilters({ ...EMPTY_FILTERS, subindustry: sector })
    setPage(0)
    explorerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const filtered = useMemo(() => {
    const result = allCompanies.filter(c => {
      if (filters.query) {
        const q = filters.query.toLowerCase()
        if (
          !c.name.toLowerCase().includes(q) &&
          !c.oneLiner.toLowerCase().includes(q) &&
          !c.longDescription.toLowerCase().includes(q) &&
          !c.tags.some(t => t.toLowerCase().includes(q))
        ) return false
      }
      if (filters.year && c.year !== Number(filters.year)) return false
      if (filters.subindustry && c.subindustry !== filters.subindustry) return false
      if (filters.status && c.status !== filters.status) return false
      if (filters.region && c.region !== filters.region) return false
      if (filters.batch && c.batch !== filters.batch) return false
      if (filters.isAI === 'yes' && !c.isAI) return false
      if (filters.isAI === 'no' && c.isAI) return false
      if (filters.isTop === 'yes' && !c.isTopCompany) return false
      return true
    })

    result.sort((a, b) => {
      switch (sort) {
        case 'oldest':
          return recencyKey(a) - recencyKey(b) || a.name.localeCompare(b.name)
        case 'name':
          return a.name.localeCompare(b.name)
        case 'team':
          return (b.teamSize ?? -1) - (a.teamSize ?? -1) || a.name.localeCompare(b.name)
        case 'status':
          return (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9) || a.name.localeCompare(b.name)
        case 'recent':
        default:
          return recencyKey(b) - recencyKey(a) || a.name.localeCompare(b.name)
      }
    })
    return result
  }, [allCompanies, filters, sort])

  const paged = filtered.slice(0, (page + 1) * PAGE_SIZE)
  const hasMore = paged.length < filtered.length
  const activeFilterCount = Object.values(filters).filter(Boolean).length

  return (
    <div className="flex flex-col gap-12">
      {/* Dashboard / featured hero */}
      <section id="dashboard">
        <div className="mb-5">
          <h2 className="text-xl font-bold text-zinc-900">Today&apos;s Snapshot</h2>
          <p className="text-sm text-zinc-500 mt-1">
            A fresh look each day at what&apos;s new and what&apos;s heating up in YC healthcare
          </p>
        </div>
        <FeaturedHero
          featured={featured}
          analytics={analytics}
          currentBatchCompanies={currentBatchCompanies}
          onSectorClick={handleSectorClick}
        />
      </section>

      {/* Company explorer */}
      <section id="explorer" ref={explorerRef} className="scroll-mt-20">
        <div className="mb-5">
          <h2 className="text-xl font-bold text-zinc-900">Company Explorer</h2>
          <p className="text-sm text-zinc-500 mt-1">
            Filter, sort, and browse all {analytics.totalCompanies} YC healthcare companies
          </p>
        </div>

        <div className="flex flex-col gap-6">
          {/* Filter bar */}
          <div className="bg-white border border-zinc-200 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <Input
                  placeholder="Search companies, sectors, keywords..."
                  value={filters.query}
                  onChange={e => { set('query')(e.target.value) }}
                  className="pl-9 h-9 border-zinc-200"
                />
              </div>
              {/* Sort */}
              <div className="relative flex items-center">
                <ArrowDownWideNarrow className="absolute left-2.5 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
                <select
                  value={sort}
                  onChange={e => { setSort(e.target.value as SortKey); setPage(0) }}
                  className="h-9 rounded-lg border border-zinc-200 bg-white pl-8 pr-3 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-orange-300"
                >
                  {SORT_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              {activeFilterCount > 0 && (
                <button
                  onClick={() => { setFilters(EMPTY_FILTERS); setPage(0) }}
                  className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-700 px-3 h-9 border border-zinc-200 rounded-lg hover:border-zinc-300 transition-colors whitespace-nowrap"
                >
                  <RefreshCw className="w-3 h-3" />
                  Clear ({activeFilterCount})
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <FilterSelect
                label="All years"
                value={filters.year}
                onChange={set('year')}
                options={years.map(y => ({ value: String(y), label: String(y) }))}
              />
              <FilterSelect
                label="All subindustries"
                value={filters.subindustry}
                onChange={set('subindustry')}
                options={analytics.subindustries}
              />
              <FilterSelect
                label="All statuses"
                value={filters.status}
                onChange={set('status')}
                options={['active', 'acquired', 'public', 'inactive']}
              />
              <FilterSelect
                label="All regions"
                value={filters.region}
                onChange={set('region')}
                options={analytics.regions}
              />
              <FilterSelect
                label="All batches"
                value={filters.batch}
                onChange={set('batch')}
                options={[...analytics.batches].reverse()}
              />
              <FilterSelect
                label="AI: all"
                value={filters.isAI}
                onChange={set('isAI')}
                options={[{ value: 'yes', label: 'AI only' }, { value: 'no', label: 'Non-AI' }]}
              />
              <FilterSelect
                label="Top: all"
                value={filters.isTop}
                onChange={set('isTop')}
                options={[{ value: 'yes', label: 'Top companies' }]}
              />
            </div>
          </div>

          {/* Results count */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-sm text-zinc-500">
              Showing {paged.length} of {filtered.length} companies
            </span>
            {filters.year && (
              <button
                onClick={() => set('year')('')}
                className="text-xs text-orange-600 hover:text-orange-700 underline underline-offset-2"
              >
                (filtered to {filters.year} — show all years)
              </button>
            )}
          </div>

          {/* Cards grid */}
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-zinc-400">
              <Search className="w-8 h-8 mx-auto mb-3 opacity-40" />
              <p>No companies match your filters</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {paged.map(c => (
                  <CompanyCard key={c.slug} company={c} />
                ))}
              </div>
              {hasMore && (
                <button
                  onClick={() => setPage(p => p + 1)}
                  className="mx-auto flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-700 border border-zinc-200 hover:border-zinc-300 rounded-lg px-6 py-2.5 transition-colors"
                >
                  Load more ({filtered.length - paged.length} remaining)
                </button>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  )
}

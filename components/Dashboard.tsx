'use client'

import { useState, useMemo } from 'react'
import { Search, Filter, RefreshCw, Star, TrendingUp, Brain } from 'lucide-react'
import { Input } from '@/components/ui/input'
import CompanyCard from '@/components/CompanyCard'
import type { Company, Analytics } from '@/lib/types'

interface Filters {
  query: string
  subindustry: string
  status: string
  region: string
  batch: string
  isAI: string
  isTop: string
}

const EMPTY_FILTERS: Filters = {
  query: '',
  subindustry: '',
  status: '',
  region: '',
  batch: '',
  isAI: '',
  isTop: '',
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: string[]
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-orange-300 min-w-0"
    >
      <option value="">{label}</option>
      {options.map(o => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  )
}

function SummaryBar({ companies, analytics }: { companies: Company[]; analytics: Analytics }) {
  const ai = companies.filter(c => c.isAI).length
  const top = companies.filter(c => c.isTopCompany).length
  const exits = companies.filter(c => c.status === 'acquired' || c.status === 'public').length

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 text-center">
        <p className="text-2xl font-bold text-orange-600">{companies.length}</p>
        <p className="text-xs text-zinc-500 mt-0.5">of {analytics.totalCompanies} companies</p>
      </div>
      <div className="bg-violet-50 border border-violet-100 rounded-xl p-3 text-center">
        <p className="text-2xl font-bold text-violet-600">{ai}</p>
        <p className="text-xs text-zinc-500 mt-0.5 flex items-center justify-center gap-1">
          <Brain className="w-3 h-3" /> AI-enabled
        </p>
      </div>
      <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-center">
        <p className="text-2xl font-bold text-amber-600">{top}</p>
        <p className="text-xs text-zinc-500 mt-0.5 flex items-center justify-center gap-1">
          <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> Top companies
        </p>
      </div>
      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center">
        <p className="text-2xl font-bold text-emerald-600">{exits}</p>
        <p className="text-xs text-zinc-500 mt-0.5 flex items-center justify-center gap-1">
          <TrendingUp className="w-3 h-3" /> Acquired / Public
        </p>
      </div>
    </div>
  )
}

export default function Dashboard({
  companies: allCompanies,
  analytics,
}: {
  companies: Company[]
  analytics: Analytics
}) {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 48

  const set = (key: keyof Filters) => (val: string) => {
    setFilters(f => ({ ...f, [key]: val }))
    setPage(0)
  }

  const filtered = useMemo(() => {
    return allCompanies.filter(c => {
      if (filters.query) {
        const q = filters.query.toLowerCase()
        if (
          !c.name.toLowerCase().includes(q) &&
          !c.oneLiner.toLowerCase().includes(q) &&
          !c.longDescription.toLowerCase().includes(q) &&
          !c.tags.some(t => t.toLowerCase().includes(q))
        ) return false
      }
      if (filters.subindustry && c.subindustry !== filters.subindustry) return false
      if (filters.status && c.status !== filters.status) return false
      if (filters.region && c.region !== filters.region) return false
      if (filters.batch && c.batch !== filters.batch) return false
      if (filters.isAI === 'yes' && !c.isAI) return false
      if (filters.isAI === 'no' && c.isAI) return false
      if (filters.isTop === 'yes' && !c.isTopCompany) return false
      return true
    })
  }, [allCompanies, filters])

  const paged = filtered.slice(0, (page + 1) * PAGE_SIZE)
  const hasMore = paged.length < filtered.length
  const activeFilterCount = Object.values(filters).filter(Boolean).length

  return (
    <div className="flex flex-col gap-6">
      <SummaryBar companies={filtered} analytics={analytics} />

      {/* Filter bar */}
      <div className="bg-white border border-zinc-200 rounded-xl p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input
              placeholder="Search companies, sectors, keywords..."
              value={filters.query}
              onChange={e => { set('query')(e.target.value); setPage(0) }}
              className="pl-9 h-9 border-zinc-200"
            />
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
            options={['yes', 'no']}
          />
          <FilterSelect
            label="Top: all"
            value={filters.isTop}
            onChange={set('isTop')}
            options={['yes']}
          />
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center gap-2">
        <Filter className="w-3.5 h-3.5 text-zinc-400" />
        <span className="text-sm text-zinc-500">
          Showing {paged.length} of {filtered.length} companies
        </span>
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
  )
}

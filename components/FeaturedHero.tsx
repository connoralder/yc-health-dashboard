'use client'

import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import CompanyCard from '@/components/CompanyCard'
import {
  Sparkles, Star, ExternalLink, MapPin, Users, TrendingUp, TrendingDown,
  Minus, ArrowUpRight, Hammer, Rocket,
} from 'lucide-react'
import type { Company, Analytics } from '@/lib/types'

function CompanyOfTheDay({ company }: { company: Company }) {
  const router = useRouter()

  return (
    <div className="relative overflow-hidden rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 via-white to-amber-50 p-6 h-full">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-4 h-4 text-orange-500" />
        <span className="text-xs font-semibold uppercase tracking-wider text-orange-600">
          Company of the Day
        </span>
        <span className="text-xs text-zinc-400 ml-auto">{company.batch}</span>
      </div>

      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-xl overflow-hidden bg-white border border-zinc-200 flex-shrink-0 flex items-center justify-center shadow-sm">
          {company.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={company.logoUrl} alt={company.name} className="w-full h-full object-contain" />
          ) : (
            <span className="text-2xl font-bold text-zinc-300">{company.name[0]}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-xl font-bold text-zinc-900">{company.name}</h3>
            {company.isTopCompany && <Star className="w-4 h-4 text-amber-500 fill-amber-500" />}
            {company.isAI && (
              <Badge className="bg-violet-100 text-violet-700 hover:bg-violet-100 text-xs">AI</Badge>
            )}
          </div>
          <p className="text-sm font-medium text-orange-700 mt-0.5">{company.oneLiner}</p>
        </div>
      </div>

      <p className="text-sm text-zinc-600 leading-relaxed mt-4 line-clamp-4">
        {company.longDescription || company.oneLiner}
      </p>

      <div className="flex flex-wrap items-center gap-4 mt-4 text-xs text-zinc-500">
        {company.location && (
          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{company.location}</span>
        )}
        {company.teamSize && (
          <span className="flex items-center gap-1"><Users className="w-3 h-3" />{company.teamSize} people</span>
        )}
        {company.subindustry && company.subindustry !== 'Other' && (
          <Badge variant="outline" className="text-xs text-zinc-500 border-zinc-200">{company.subindustry}</Badge>
        )}
      </div>

      <div className="flex items-center gap-3 mt-5">
        <button
          onClick={() => router.push(`/company/${company.slug}`)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg px-4 py-2 transition-colors"
        >
          View details
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
        {company.website && (
          <a
            href={company.website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-zinc-600 hover:text-zinc-900 border border-zinc-200 hover:border-zinc-300 rounded-lg px-4 py-2 transition-colors"
          >
            Website
            <ExternalLink className="w-3 h-3 opacity-60" />
          </a>
        )}
      </div>
    </div>
  )
}

function MomentumArrow({ lift }: { lift: number | null }) {
  if (lift == null) return null
  if (lift >= 1.05) return <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
  if (lift <= 0.95) return <TrendingDown className="w-3.5 h-3.5 text-zinc-400" />
  return <Minus className="w-3.5 h-3.5 text-zinc-400" />
}

function SectorsBeingBuilt({
  analytics,
  onSectorClick,
}: {
  analytics: Analytics
  onSectorClick: (sector: string) => void
}) {
  const sectors = analytics.currentYearSectors
  const maxCount = Math.max(...sectors.map(s => s.count), 1)
  const year = analytics.currentYearStats.year

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 h-full">
      <div className="flex items-center gap-2 mb-1">
        <Hammer className="w-4 h-4 text-rose-500" />
        <span className="text-xs font-semibold uppercase tracking-wider text-rose-600">
          Sectors Being Built · {year}
        </span>
      </div>
      <p className="text-xs text-zinc-400 mb-4">
        What this year&apos;s cohort is working on. ↑/↓ = rising or cooling vs all-time.
      </p>

      <div className="flex flex-col gap-2.5">
        {sectors.map(s => {
          const isOther = s.subindustry === 'Other'
          const rising = s.lift != null && s.lift >= 1.05
          return (
            <button
              key={s.subindustry}
              onClick={() => onSectorClick(s.subindustry)}
              className="group flex items-center gap-3 text-left"
              title={`${s.count} companies in ${year}`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-medium truncate transition-colors ${isOther ? 'text-zinc-400 italic' : 'text-zinc-700 group-hover:text-rose-600'}`}>
                    {isOther ? 'Not yet categorized' : s.subindustry}
                  </span>
                  <span className="text-xs font-semibold text-zinc-500 flex items-center gap-1 flex-shrink-0 ml-2">
                    <MomentumArrow lift={s.lift} />
                    {s.count}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-zinc-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      isOther ? 'bg-zinc-200'
                        : rising ? 'bg-gradient-to-r from-emerald-400 to-teal-400'
                        : 'bg-gradient-to-r from-orange-300 to-amber-300'
                    }`}
                    style={{ width: `${Math.max((s.count / maxCount) * 100, 6)}%` }}
                  />
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function MomentumBar({ analytics }: { analytics: Analytics }) {
  const cy = analytics.currentYearStats
  const cb = analytics.currentBatchStats
  const aiDelta = cy.aiPct - analytics.aiPct

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {/* Yearly */}
      <div className="rounded-xl border border-zinc-200 bg-white p-3.5">
        <p className="text-xs text-zinc-400 mb-1">New in {cy.year}</p>
        <p className="text-2xl font-bold text-zinc-900">{cy.count}</p>
        <p className="text-xs text-zinc-500 mt-0.5">companies joined this year</p>
      </div>
      <div className="rounded-xl border border-violet-100 bg-violet-50 p-3.5">
        <p className="text-xs text-violet-400 mb-1">AI-native in {cy.year}</p>
        <p className="text-2xl font-bold text-violet-700">{cy.aiPct}%</p>
        <p className="text-xs text-violet-500 mt-0.5 flex items-center gap-1">
          <TrendingUp className="w-3 h-3" />
          {aiDelta >= 0 ? '+' : ''}{aiDelta} pts vs all-time
        </p>
      </div>
      {/* Current batch */}
      <div className="rounded-xl border border-orange-100 bg-orange-50 p-3.5">
        <p className="text-xs text-orange-400 mb-1 flex items-center gap-1">
          <Rocket className="w-3 h-3" /> Current batch
        </p>
        <p className="text-base font-bold text-orange-700 leading-tight mt-1">{cb.batch}</p>
        <p className="text-xs text-orange-500 mt-0.5">{cb.count} companies so far</p>
      </div>
      <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3.5">
        <p className="text-xs text-emerald-500 mb-1">AI-native this batch</p>
        <p className="text-2xl font-bold text-emerald-700">{cb.aiPct}%</p>
        <p className="text-xs text-emerald-600 mt-0.5">{cb.aiCount} of {cb.count} new companies</p>
      </div>
    </div>
  )
}

function CurrentBatchSpotlight({
  batch,
  companies,
  aiPct,
}: {
  batch: string
  companies: Company[]
  aiPct: number
}) {
  if (companies.length === 0) return null

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6">
      <div className="flex items-center gap-2 mb-1">
        <Rocket className="w-4 h-4 text-orange-500" />
        <span className="text-xs font-semibold uppercase tracking-wider text-orange-600">
          Current Batch Spotlight · {batch}
        </span>
        <span className="ml-auto text-xs text-zinc-400">
          {companies.length} companies · {aiPct}% AI-native
        </span>
      </div>
      <p className="text-xs text-zinc-400 mb-4">
        The newest cohort — exactly who&apos;s building right now (YC often categorizes
        sectors weeks later, so some show as uncategorized)
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {companies.map(c => (
          <CompanyCard key={c.slug} company={c} />
        ))}
      </div>
    </div>
  )
}

export default function FeaturedHero({
  featured,
  analytics,
  currentBatchCompanies,
  onSectorClick,
}: {
  featured: Company | null
  analytics: Analytics
  currentBatchCompanies: Company[]
  onSectorClick: (sector: string) => void
}) {
  return (
    <div className="flex flex-col gap-4">
      <MomentumBar analytics={analytics} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          {featured && <CompanyOfTheDay company={featured} />}
        </div>
        <div className="lg:col-span-1">
          <SectorsBeingBuilt analytics={analytics} onSectorClick={onSectorClick} />
        </div>
      </div>
      <CurrentBatchSpotlight
        batch={analytics.currentBatchStats.batch}
        companies={currentBatchCompanies}
        aiPct={analytics.currentBatchStats.aiPct}
      />
    </div>
  )
}

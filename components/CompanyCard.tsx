'use client'

import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { ExternalLink, Star, TrendingUp } from 'lucide-react'
import type { Company } from '@/lib/types'

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  acquired: 'bg-blue-100 text-blue-800',
  public: 'bg-purple-100 text-purple-800',
  inactive: 'bg-zinc-100 text-zinc-500',
}

export default function CompanyCard({ company }: { company: Company }) {
  const router = useRouter()
  return (
    <div
      onClick={() => router.push(`/company/${company.slug}`)}
      className="block group cursor-pointer"
    >
      <div className="bg-white border border-zinc-200 rounded-xl p-4 h-full flex flex-col gap-3 hover:border-orange-300 hover:shadow-md transition-all">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg overflow-hidden bg-zinc-100 flex-shrink-0 flex items-center justify-center">
            {company.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={company.logoUrl}
                alt={company.name}
                className="w-full h-full object-contain"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            ) : (
              <span className="text-lg font-bold text-zinc-400">{company.name[0]}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-zinc-900 truncate text-sm group-hover:text-orange-600 transition-colors" aria-label={`View ${company.name}`}>
                {company.name}
              </h3>
              {company.isTopCompany && (
                <Star className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 fill-amber-500" />
              )}
            </div>
            <p className="text-xs text-zinc-500">{company.batch}</p>
          </div>
          {company.website && (
            <a
              href={company.website}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="text-zinc-400 hover:text-zinc-600 flex-shrink-0"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>

        {/* One-liner */}
        <p className="text-sm text-zinc-600 leading-snug line-clamp-2 flex-1">
          {company.oneLiner || company.longDescription.slice(0, 120)}
        </p>

        {/* Footer badges */}
        <div className="flex flex-wrap gap-1.5 mt-auto">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[company.status]}`}>
            {company.status}
          </span>
          {company.isAI && (
            <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-violet-100 text-violet-700 hover:bg-violet-100">
              AI
            </Badge>
          )}
          {company.funding && (
            <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
              <TrendingUp className="w-2.5 h-2.5 mr-0.5" />
              {company.funding.totalRaised}
            </Badge>
          )}
          {company.subindustry && company.subindustry !== 'Other' && (
            <Badge variant="outline" className="text-xs px-2 py-0.5 text-zinc-500 border-zinc-200">
              {company.subindustry}
            </Badge>
          )}
        </div>
      </div>
    </div>
  )
}

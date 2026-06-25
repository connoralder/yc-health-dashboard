import { getCompanyBySlug, getCompanies } from '@/lib/data'
import { canonicalizeTags } from '@/lib/tags'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ExternalLink, Star, Globe, MapPin, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export async function generateStaticParams() {
  const companies = getCompanies()
  return companies.map(c => ({ slug: c.slug }))
}

export default async function CompanyPage(props: PageProps<'/company/[slug]'>) {
  const { slug } = await props.params
  const company = getCompanyBySlug(slug)

  if (!company) notFound()

  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    acquired: 'bg-blue-100 text-blue-800',
    public: 'bg-purple-100 text-purple-800',
    inactive: 'bg-zinc-100 text-zinc-500',
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to dashboard
        </Link>

        <div className="bg-white border border-zinc-200 rounded-2xl p-6 sm:p-8 flex flex-col gap-6">
          {/* Header */}
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-zinc-100 flex-shrink-0 flex items-center justify-center">
              {company.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={company.logoUrl}
                  alt={company.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <span className="text-2xl font-bold text-zinc-400">{company.name[0]}</span>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-zinc-900">{company.name}</h1>
                {company.isTopCompany && (
                  <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                )}
              </div>
              <p className="text-zinc-500 text-sm mt-1">{company.batch}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[company.status]}`}>
                  {company.status}
                </span>
                <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 text-xs">
                  {company.subindustry === 'Other' ? 'Uncategorized' : company.subindustry}
                </Badge>
                {company.isAI && (
                  <Badge className="bg-violet-100 text-violet-700 hover:bg-violet-100 text-xs">AI</Badge>
                )}
              </div>
            </div>
          </div>

          {/* One-liner */}
          {company.oneLiner && (
            <p className="text-lg text-zinc-700 font-medium leading-snug">{company.oneLiner}</p>
          )}

          {/* Description */}
          {company.longDescription && (
            <p className="text-sm text-zinc-600 leading-relaxed">{company.longDescription}</p>
          )}

          {/* Meta */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2 border-t border-zinc-100">
            {company.location && (
              <div className="flex items-center gap-2 text-sm text-zinc-600">
                <MapPin className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                <span className="truncate">{company.location}</span>
              </div>
            )}
            {company.teamSize && (
              <div className="flex items-center gap-2 text-sm text-zinc-600">
                <Users className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                <span>{company.teamSize} employees</span>
              </div>
            )}
            {company.region && company.region !== 'Unknown' && (
              <div className="flex items-center gap-2 text-sm text-zinc-600">
                <Globe className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                <span>{company.region}</span>
              </div>
            )}
          </div>

          {/* Funding */}
          {company.funding && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4">
              <h3 className="text-sm font-semibold text-emerald-800 mb-2">Funding</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-emerald-600">Total Raised</p>
                  <p className="font-bold text-emerald-900">{company.funding.totalRaised}</p>
                </div>
                <div>
                  <p className="text-xs text-emerald-600">Last Round</p>
                  <p className="font-medium text-emerald-900">{company.funding.lastRound}</p>
                </div>
                {company.funding.leadInvestors.length > 0 && (
                  <div className="col-span-2">
                    <p className="text-xs text-emerald-600 mb-1">Lead Investors</p>
                    <div className="flex flex-wrap gap-1">
                      {company.funding.leadInvestors.map(inv => (
                        <span key={inv} className="text-xs bg-emerald-100 text-emerald-800 rounded-full px-2 py-0.5">{inv}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {company.funding.source && (
                <p className="text-xs text-emerald-600 mt-2">
                  Source:{' '}
                  <a href={company.funding.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline">
                    {company.funding.source}
                  </a>
                  {' '}· as of {company.funding.asOf}
                </p>
              )}
            </div>
          )}

          {/* Tags */}
          {canonicalizeTags(company.tags).length > 0 && (
            <div>
              <p className="text-xs text-zinc-400 mb-2 uppercase tracking-wider font-medium">Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {canonicalizeTags(company.tags).map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs text-zinc-600 border-zinc-200">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Links */}
          <div className="flex flex-wrap gap-3 pt-2 border-t border-zinc-100">
            {company.website && (
              <a
                href={company.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900 border border-zinc-200 hover:border-zinc-300 rounded-lg px-4 py-2 transition-colors"
              >
                <Globe className="w-4 h-4" />
                Website
                <ExternalLink className="w-3 h-3 opacity-50" />
              </a>
            )}
            <a
              href={company.ycUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-orange-600 hover:text-orange-700 border border-orange-200 hover:border-orange-300 rounded-lg px-4 py-2 transition-colors"
            >
              YC Profile
              <ExternalLink className="w-3 h-3 opacity-50" />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

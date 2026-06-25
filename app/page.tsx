import { Suspense } from 'react'
import { getCompanies, getAnalytics } from '@/lib/data'
import { getFeaturedCompany } from '@/lib/featured'
import Dashboard from '@/components/Dashboard'
import IdeaEngine from '@/components/IdeaEngine'
import {
  BatchTrendChart,
  SubindustryChart,
  OutcomesChart,
  AIAdoptionChart,
} from '@/components/AnalyticsCharts'
import { Activity, RefreshCw } from 'lucide-react'

export const metadata = {
  title: 'YC Healthcare Dashboard',
  description: 'Intelligence dashboard for all 681 YC healthcare companies',
}

export default function Home() {
  const companies = getCompanies()
  const analytics = getAnalytics()
  const featured = getFeaturedCompany(companies)
  const currentBatchCompanies = analytics
    ? companies.filter(c => c.batch === analytics.latestBatch)
    : []

  if (!analytics || companies.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4 text-zinc-500">
        <RefreshCw className="w-8 h-8 animate-spin opacity-40" />
        <p className="text-sm">No data yet. Run <code className="bg-zinc-100 px-2 py-0.5 rounded text-zinc-700">npm run sync</code> to fetch YC companies.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-40">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-orange-500 rounded-lg flex items-center justify-center">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <h1 className="font-bold text-zinc-900 text-base">YC Healthcare</h1>
            <span className="hidden sm:block text-xs text-zinc-400 bg-zinc-100 rounded-full px-2 py-0.5">
              {analytics.totalCompanies} companies · updated {new Date(analytics.updatedAt).toLocaleDateString()}
            </span>
          </div>
          <nav className="flex items-center gap-4 text-sm text-zinc-500">
            <a href="#dashboard" className="hover:text-zinc-900 transition-colors">Dashboard</a>
            <a href="#explorer" className="hover:text-zinc-900 transition-colors">Explore</a>
            <a href="#analytics" className="hover:text-zinc-900 transition-colors">Analytics</a>
            <a href="#ideas" className="hover:text-zinc-900 transition-colors">Ideas</a>
          </nav>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-12">
        {/* Dashboard + explorer (hero, filters, grid) */}
        <Suspense>
          <Dashboard
            companies={companies}
            analytics={analytics}
            featured={featured}
            currentBatchCompanies={currentBatchCompanies}
          />
        </Suspense>

        {/* Analytics section */}
        <section id="analytics">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-zinc-900">Analytics</h2>
            <p className="text-sm text-zinc-500 mt-1">Trends, sector breakdown, and outcomes</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <BatchTrendChart analytics={analytics} />
            <AIAdoptionChart analytics={analytics} />
            <SubindustryChart analytics={analytics} />
            <OutcomesChart analytics={analytics} />
          </div>
        </section>

        {/* Idea Engine section */}
        <section id="ideas">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-zinc-900">Idea Engine</h2>
            <p className="text-sm text-zinc-500 mt-1">
              AI-powered insights grounded in the real dataset — find whitespace, spin-offs, and compounding trends
            </p>
          </div>
          <div className="max-w-2xl">
            <IdeaEngine analytics={analytics} />
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-200 mt-12 py-6">
        <p className="text-center text-xs text-zinc-400">
          Data sourced from{' '}
          <a href="https://github.com/yc-oss/api" target="_blank" rel="noopener noreferrer" className="underline hover:text-zinc-600">
            yc-oss/api
          </a>
          {' '}· Run <code className="bg-zinc-100 px-1 rounded">npm run sync</code> to refresh
        </p>
      </footer>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { Lightbulb, Loader2, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Analytics } from '@/lib/types'

interface IdeaResult {
  title: string
  problem: string
  why_now: string
  inspired_by: string[]
  whitespace: string
}

const PROMPTS = [
  { id: 'whitespace', label: 'Find whitespace', description: 'Underserved areas with few YC companies but high potential' },
  { id: 'spinoff', label: 'Spin-off ideas', description: 'Adjacent verticals from what\'s already working' },
  { id: 'compounding', label: 'What\'s compounding', description: 'Sectors gaining momentum batch over batch' },
]

export default function IdeaEngine({ analytics }: { analytics: Analytics }) {
  const [mode, setMode] = useState<string>('whitespace')
  const [loading, setLoading] = useState(false)
  const [ideas, setIdeas] = useState<IdeaResult[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function generate() {
    setLoading(true)
    setIdeas(null)
    setError(null)

    try {
      const res = await fetch('/api/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, analytics }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }))
        throw new Error(err.error || 'Generation failed')
      }

      const data = await res.json()
      setIdeas(data.ideas)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-5 flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <Lightbulb className="w-5 h-5 text-amber-500" />
        <h2 className="font-semibold text-zinc-900">AI Idea Engine</h2>
        <span className="ml-auto text-xs text-zinc-400 bg-zinc-50 border border-zinc-200 rounded-full px-2.5 py-0.5">
          Powered by dataset analysis
        </span>
      </div>

      {/* Dataset stats teaser */}
      <div className="grid grid-cols-4 gap-3 bg-zinc-50 rounded-lg p-3">
        <div className="text-center">
          <p className="text-lg font-bold text-zinc-900">{analytics.totalCompanies}</p>
          <p className="text-xs text-zinc-500">companies</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-violet-600">{analytics.aiCount}</p>
          <p className="text-xs text-zinc-500">AI-enabled</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-emerald-600">{analytics.acquiredOrPublicCount}</p>
          <p className="text-xs text-zinc-500">exits/public</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-amber-600">{analytics.bySubindustry.length}</p>
          <p className="text-xs text-zinc-500">subsectors</p>
        </div>
      </div>

      {/* Mode selector */}
      <div className="flex flex-col gap-2">
        {PROMPTS.map(p => (
          <button
            key={p.id}
            onClick={() => setMode(p.id)}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-all ${
              mode === p.id
                ? 'border-orange-300 bg-orange-50 text-orange-900'
                : 'border-zinc-200 hover:border-zinc-300 text-zinc-700'
            }`}
          >
            <ChevronRight className={`w-4 h-4 flex-shrink-0 transition-transform ${mode === p.id ? 'rotate-90 text-orange-500' : 'text-zinc-400'}`} />
            <div>
              <p className="font-medium text-sm">{p.label}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{p.description}</p>
            </div>
          </button>
        ))}
      </div>

      <Button
        onClick={generate}
        disabled={loading}
        className="w-full bg-orange-500 hover:bg-orange-600 text-white"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Analyzing dataset...
          </>
        ) : (
          <>
            <Lightbulb className="w-4 h-4 mr-2" />
            Generate ideas
          </>
        )}
      </Button>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          <strong>Error:</strong> {error}
        </div>
      )}

      {ideas && ideas.length > 0 && (
        <div className="flex flex-col gap-4">
          {ideas.map((idea, i) => (
            <div key={i} className="rounded-lg border border-zinc-200 p-4 flex flex-col gap-2">
              <h3 className="font-semibold text-zinc-900 text-sm">{i + 1}. {idea.title}</h3>
              <p className="text-sm text-zinc-600">{idea.problem}</p>
              {idea.why_now && (
                <p className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-1">
                  <strong>Why now:</strong> {idea.why_now}
                </p>
              )}
              {idea.whitespace && (
                <p className="text-xs text-violet-700 bg-violet-50 rounded px-2 py-1">
                  <strong>Whitespace:</strong> {idea.whitespace}
                </p>
              )}
              {idea.inspired_by && idea.inspired_by.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {idea.inspired_by.map((name, j) => (
                    <span key={j} className="text-xs bg-zinc-100 text-zinc-600 rounded-full px-2 py-0.5">
                      {name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

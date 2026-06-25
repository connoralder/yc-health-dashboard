'use client'

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend, Cell
} from 'recharts'
import type { Analytics } from '@/lib/types'

const COLORS = ['#f97316', '#fb923c', '#fdba74', '#fed7aa', '#fef3c7', '#fde68a', '#fcd34d', '#fbbf24']

export function BatchTrendChart({ analytics }: { analytics: Analytics }) {
  const data = analytics.byBatch.map(b => ({
    name: b.batch.replace('Winter ', 'W').replace('Summer ', 'S').replace('Fall ', 'F').replace('Spring ', 'Sp'),
    companies: b.count,
    year: b.year,
  }))

  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-5">
      <h3 className="font-semibold text-zinc-900 mb-1 text-sm">Companies per Batch</h3>
      <p className="text-xs text-zinc-400 mb-4">YC healthcare companies over time</p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10, fill: '#71717a' }}
            interval={2}
            angle={-45}
            textAnchor="end"
            height={50}
          />
          <YAxis tick={{ fontSize: 11, fill: '#71717a' }} />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e4e4e7' }}
            formatter={(val) => [val, 'Companies']}
          />
          <Bar dataKey="companies" fill="#f97316" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function SubindustryChart({ analytics }: { analytics: Analytics }) {
  const data = analytics.bySubindustry.slice(0, 12).map(s => ({
    name: s.subindustry.length > 20 ? s.subindustry.slice(0, 18) + '…' : s.subindustry,
    fullName: s.subindustry,
    total: s.count,
    ai: s.aiCount,
    top: s.topCount,
  }))

  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-5">
      <h3 className="font-semibold text-zinc-900 mb-1 text-sm">Top Subindustries</h3>
      <p className="text-xs text-zinc-400 mb-4">Company count by healthcare segment</p>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} layout="vertical" margin={{ left: 0, right: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11, fill: '#71717a' }} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#71717a' }} width={120} />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e4e4e7' }}
            formatter={(val, name) => [val, name === 'total' ? 'All companies' : name === 'ai' ? 'AI companies' : 'Top companies']}
            labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
          />
          <Legend formatter={(val) => val === 'total' ? 'All' : val === 'ai' ? 'AI' : 'Top'} />
          <Bar dataKey="total" fill="#f97316" radius={[0, 3, 3, 0]} />
          <Bar dataKey="ai" fill="#8b5cf6" radius={[0, 3, 3, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function OutcomesChart({ analytics }: { analytics: Analytics }) {
  const data = analytics.bySubindustry
    .filter(s => s.count >= 5)
    .slice(0, 10)
    .map(s => ({
      name: s.subindustry.length > 20 ? s.subindustry.slice(0, 18) + '…' : s.subindustry,
      rate: Math.round((s.acquiredOrPublicCount / s.count) * 100),
      count: s.acquiredOrPublicCount,
      total: s.count,
    }))
    .sort((a, b) => b.rate - a.rate)

  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-5">
      <h3 className="font-semibold text-zinc-900 mb-1 text-sm">Outcome Rate by Sector</h3>
      <p className="text-xs text-zinc-400 mb-4">% acquired or public (sectors with 5+ companies)</p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#71717a' }} angle={-35} textAnchor="end" height={60} />
          <YAxis tick={{ fontSize: 11, fill: '#71717a' }} unit="%" />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e4e4e7' }}
            formatter={(val, _, props) => [`${val}% (${props.payload.count}/${props.payload.total})`, 'Acquired or Public']}
          />
          <Bar dataKey="rate" radius={[3, 3, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function AIAdoptionChart({ analytics }: { analytics: Analytics }) {
  const yearData = new Map<number, { total: number; ai: number }>()

  for (const b of analytics.byBatch) {
    if (!b.year) continue
    if (!yearData.has(b.year)) yearData.set(b.year, { total: 0, ai: 0 })
    yearData.get(b.year)!.total += b.count
  }

  // We need AI counts by year — compute from subindustry isn't enough, need batch-level
  // Use byBatch directly since sync bakes total count; AI breakdown would need a second pass
  // For now show total growth per year with a note
  const data = [...yearData.entries()]
    .filter(([year]) => year >= 2012 && year <= 2026)
    .sort(([a], [b]) => a - b)
    .map(([year, d]) => ({ year: String(year), companies: d.total }))

  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-5">
      <h3 className="font-semibold text-zinc-900 mb-1 text-sm">Growth by Year</h3>
      <p className="text-xs text-zinc-400 mb-4">Total healthcare companies entering YC per year</p>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
          <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#71717a' }} />
          <YAxis tick={{ fontSize: 11, fill: '#71717a' }} />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e4e4e7' }}
            formatter={(val) => [val, 'Companies']}
          />
          <Line
            type="monotone"
            dataKey="companies"
            stroke="#f97316"
            strokeWidth={2}
            dot={{ fill: '#f97316', r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

import { NextRequest } from 'next/server'
import type { Analytics, SubindustryPoint } from '@/lib/types'

// Market size estimates (rough) for each subindustry — used to weight whitespace score
const MARKET_ESTIMATES: Record<string, number> = {
  'Healthcare IT': 390,
  'Drug Discovery and Delivery': 1200,
  'Diagnostics': 380,
  'Medical Devices': 520,
  'Therapeutics': 1500,
  'Healthcare Services': 290,
  'Consumer Health and Wellness': 450,
  'Industrial Bio': 250,
  'Healthcare': 600,
}

interface Idea {
  title: string
  problem: string
  why_now: string
  whitespace: string
  inspired_by: string[]
}

function findWhitespace(analytics: Analytics): Idea[] {
  // Score each subindustry by market_size / company_count (underserved = high market, few companies)
  const scored = analytics.bySubindustry.map(s => ({
    ...s,
    marketEst: MARKET_ESTIMATES[s.subindustry] || 200,
    whitespaceScore: (MARKET_ESTIMATES[s.subindustry] || 200) / Math.max(s.count, 1),
  }))
  scored.sort((a, b) => b.whitespaceScore - a.whitespaceScore)

  const ideas: Idea[] = []

  // Idea 1: Rarest sector with highest market
  const rarest = scored[0]
  ideas.push({
    title: `AI-native ${rarest.subindustry} platform for mid-market hospitals`,
    problem: `The ${rarest.subindustry} space has only ${rarest.count} YC companies despite a ~$${rarest.marketEst}B market. Existing solutions are fragmented, expensive, and built for enterprise — mid-market providers are underserved.`,
    why_now: `Foundation models now enable specialized workflows to be built 10× faster. Regulatory momentum (FDA, CMS) is creating new software-billable categories that didn't exist 3 years ago.`,
    whitespace: `${rarest.count} companies vs ${MARKET_ESTIMATES[rarest.subindustry] || '?'}B market — lowest YC coverage ratio in the dataset.`,
    inspired_by: analytics.bySubindustry.slice(0, 3).map(s => s.subindustry),
  })

  // Idea 2: Second-rarest sector
  const second = scored[1]
  ideas.push({
    title: `Vertical SaaS for ${second.subindustry} workflow automation`,
    problem: `${second.subindustry} ($${second.marketEst}B market) has just ${second.count} YC startups. Manual processes dominate — billing, prior auth, referrals — driving up cost per patient interaction.`,
    why_now: `GPT-class LLMs finally handle clinical language well enough to automate documentation and coding tasks that previously required human reviewers.`,
    whitespace: `Only ${second.count} YC companies in a $${second.marketEst}B+ space, with just ${second.aiCount} AI-focused — massive room for AI-first entrants.`,
    inspired_by: analytics.bySubindustry.slice(3, 6).map(s => s.subindustry),
  })

  // Idea 3: High-exit-rate sector with room for new entrant
  const highExit = [...analytics.bySubindustry]
    .filter(s => s.count >= 10)
    .sort((a, b) => (b.acquiredOrPublicCount / b.count) - (a.acquiredOrPublicCount / a.count))[0]
  if (highExit) {
    ideas.push({
      title: `Next-generation ${highExit.subindustry} platform with embedded AI`,
      problem: `${highExit.subindustry} has the highest acquisition/public rate (${Math.round(highExit.acquiredOrPublicCount / highExit.count * 100)}%) of any sector in the YC portfolio — proving strong buyer demand — but most incumbents are pre-AI.`,
      why_now: `The window to displace recently acquired legacy players is now: acquirers slow down product velocity, creating an opening for an AI-native challenger.`,
      whitespace: `${highExit.acquiredOrPublicCount} of ${highExit.count} ${highExit.subindustry} companies exited — validated market, but only ${highExit.aiCount} AI-native players in the cohort.`,
      inspired_by: analytics.bySubindustry.slice(0, 4).map(s => s.subindustry),
    })
  }

  // Idea 4: Cross-sector opportunity
  const aiHeavy = [...analytics.bySubindustry].sort((a, b) => (b.aiCount / b.count) - (a.aiCount / a.count))[0]
  const aiLight = [...analytics.bySubindustry].filter(s => s.count >= 10).sort((a, b) => (a.aiCount / a.count) - (b.aiCount / b.count))[0]
  if (aiHeavy && aiLight) {
    ideas.push({
      title: `Apply ${aiHeavy.subindustry} AI techniques to ${aiLight.subindustry}`,
      problem: `${aiHeavy.subindustry} leads YC healthcare in AI adoption (${Math.round(aiHeavy.aiCount / aiHeavy.count * 100)}% AI companies) while ${aiLight.subindustry} has almost none (${Math.round(aiLight.aiCount / aiLight.count * 100)}%). The same foundation models powering one sector apply directly to the other.`,
      why_now: `Cross-sector AI transfer is happening now — the infrastructure built for one vertical commoditizes and gets repackaged for the next.`,
      whitespace: `${aiLight.subindustry} is one of the least AI-penetrated sectors in the YC portfolio, ripe for the same disruption that's already happened in ${aiHeavy.subindustry}.`,
      inspired_by: [aiHeavy.subindustry, aiLight.subindustry],
    })
  }

  // Idea 5: Global health / non-US
  const usCompanies = analytics.byRegion['United States of America'] || 0
  const total = analytics.totalCompanies
  ideas.push({
    title: `Healthcare infrastructure for emerging markets (LATAM / SEA)`,
    problem: `~${Math.round(usCompanies / total * 100)}% of YC healthcare companies are US-focused. Emerging markets (LATAM, SEA, Africa) have younger populations, lower insurance penetration, and mobile-first behavior — a structurally different and underserved opportunity.`,
    why_now: `Mobile health adoption accelerated post-COVID. Regulatory frameworks in India, Brazil, and Indonesia are now clear enough to build on. AI-powered diagnostics can bypass the specialist shortage.`,
    whitespace: `The YC portfolio is heavily US-centric — virtually no companies targeting LATAM/SEA primary care or insurance infrastructure at scale.`,
    inspired_by: analytics.bySubindustry.slice(0, 3).map(s => s.subindustry),
  })

  return ideas.slice(0, 5)
}

function generateSpinoffs(analytics: Analytics): Idea[] {
  const top = analytics.bySubindustry.slice(0, 5)

  return top.slice(0, 5).map((s, i): Idea => {
    const exitRate = Math.round(s.acquiredOrPublicCount / s.count * 100)
    const aiRate = Math.round(s.aiCount / s.count * 100)

    const spinoffAngles = [
      { angle: 'SMB-focused vertical SaaS', why: 'Enterprise players dominate; no one is serving the small practice / clinic well' },
      { angle: 'international expansion', why: 'US-built playbook applied to Europe, LATAM, or Southeast Asia' },
      { angle: 'AI-native workflow layer on top of existing EHR/EMR', why: 'EHRs are entrenched; the opportunity is a new UX layer, not replacing the database' },
      { angle: 'consumer-facing / DTC version', why: 'B2B saturated; the same clinical value can be delivered direct-to-patient' },
      { angle: 'specialty-specific niche within the broader category', why: 'Horizontal platforms are crowded; verticalize to one specialty (oncology, cardiology, etc.)' },
    ]
    const { angle, why } = spinoffAngles[i % spinoffAngles.length]

    return {
      title: `${s.subindustry} ${angle}`,
      problem: `${s.subindustry} is the #${i + 1} most active YC healthcare sector (${s.count} companies), validating strong demand. The ${angle} represents the next evolution: ${why}.`,
      why_now: `${aiRate}% of ${s.subindustry} companies are AI-enabled, proving the tech works. First-wave players validated the market; second-wave spin-offs capture specific niches with better unit economics.`,
      whitespace: `${exitRate}% exit rate (${s.acquiredOrPublicCount}/${s.count}) shows buyers exist. The ${angle} is the gap incumbent acquirers can't fill.`,
      inspired_by: [`${s.subindustry} sector (${s.count} YC companies)`],
    }
  })
}

function findCompounding(analytics: Analytics): Idea[] {
  // Find sectors with recent acceleration
  const recentBatches = analytics.byBatch.slice(-8)
  const totalRecent = recentBatches.reduce((sum, b) => sum + b.count, 0)

  // AI acceleration: 41% of portfolio is AI, but recent batches likely higher
  const aiRatio = analytics.aiCount / analytics.totalCompanies
  const topAI = [...analytics.bySubindustry].sort((a, b) => (b.aiCount / b.count) - (a.aiCount / a.count)).slice(0, 5)

  const ideas: Idea[] = []

  // Idea 1: AI adoption compounding
  ideas.push({
    title: `AI-first clinical documentation and coding startup`,
    problem: `${Math.round(aiRatio * 100)}% of YC healthcare companies now use AI, up from near-zero in 2019. Clinical documentation (nursing notes, physician notes, coding) is the single largest time sink in healthcare — and AI is now good enough to automate it.`,
    why_now: `The 2024-2025 batches are dominated by AI-first healthcare companies. The wave is accelerating. Foundation models specifically tuned for clinical language (MedPaLM, Med-Gemini) are now available.`,
    whitespace: `Despite ${analytics.aiCount} AI companies in the YC healthcare portfolio, clinical documentation specifically is still dominated by legacy vendors like Nuance (acquired by Microsoft).`,
    inspired_by: topAI.slice(0, 3).map(s => s.subindustry),
  })

  // Idea 2: Drug discovery
  const drugSector = analytics.bySubindustry.find(s => s.subindustry.includes('Drug'))
  if (drugSector) {
    const aiPct = Math.round(drugSector.aiCount / drugSector.count * 100)
    ideas.push({
      title: `AI-guided drug repurposing platform for rare diseases`,
      problem: `Drug Discovery has the highest AI adoption in the YC portfolio (${aiPct}% AI companies). But most AI drug discovery targets blockbusters. Rare diseases (7,000+) are underserved — AI makes the economics of small-indication drugs viable for the first time.`,
      why_now: `FDA Rare Disease designation provides 7 years of market exclusivity and expedited review. AI can reduce target identification from years to weeks, making rare disease economics work.`,
      whitespace: `Only ${drugSector.acquiredOrPublicCount} Drug Discovery exits in the YC portfolio vs the scale of the opportunity — rare disease specifically has almost no YC representation.`,
      inspired_by: ['Drug Discovery and Delivery sector'],
    })
  }

  // Idea 3: Recent batch momentum
  const recentCount = analytics.byBatch.slice(-4).reduce((s, b) => s + b.count, 0)
  ideas.push({
    title: `Health data interoperability infrastructure (post-HTI-1)`,
    problem: `${recentCount} companies entered YC healthcare in the last 4 batches. A large portion tackles data fragmentation. The 21st Century Cures Act + HTI-1 final rule mandates EHR data sharing — creating a compliance deadline that forces healthcare systems to open their data.`,
    why_now: `HTI-1 compliance deadlines hit 2024-2025. Every health system now must expose FHIR APIs. The infrastructure layer to make that data useful (clean, de-identify, normalize, query) is the emergent opportunity.`,
    whitespace: `Healthcare data infrastructure companies are underrepresented in YC relative to the $80B+ data management market being unlocked by new interoperability mandates.`,
    inspired_by: analytics.bySubindustry.slice(0, 4).map(s => s.subindustry),
  })

  // Idea 4: Consumer health compounding
  const consumer = analytics.bySubindustry.find(s => s.subindustry.includes('Consumer'))
  if (consumer) {
    ideas.push({
      title: `AI health coach for chronic disease management (GLP-1 era)`,
      problem: `Consumer Health has ${consumer.count} YC companies — the 2nd largest sector. GLP-1s (Ozempic, Wegovy) are changing chronic disease trajectories for millions. People on these medications need behavior change support, monitoring, and comorbidity management that the current system can't provide at scale.`,
      why_now: `25M+ Americans projected on GLP-1s by 2030. Each needs ongoing lifestyle coaching, nutritional guidance, and side effect management. AI makes this personalized support economically viable at scale.`,
      whitespace: `GLP-1 adherence and lifestyle support is a nascent category — virtually no YC companies specifically targeting this cohort despite the explosive growth.`,
      inspired_by: ['Consumer Health and Wellness sector'],
    })
  }

  // Idea 5: Mental health tech
  ideas.push({
    title: `B2B mental health benefits platform for hourly / gig workers`,
    problem: `Mental health is one of the fastest-growing categories in recent YC batches. But current solutions (Headspace for Work, Lyra) serve desk workers with traditional benefits. The 80M+ hourly/gig workers in the US have virtually no access.`,
    why_now: `State mandates for mental health parity are expanding. Employer-sponsored coverage for gig platforms (under evolving labor law) is growing. AI-driven matching makes therapist access 10× cheaper to deliver.`,
    whitespace: `YC mental health companies overwhelmingly target enterprise desk-workers — the gig/hourly market is wide open with massive scale.`,
    inspired_by: analytics.bySubindustry.slice(4, 8).map(s => s.subindustry),
  })

  return ideas.slice(0, 5)
}

export async function POST(req: NextRequest) {
  const body = await req.json() as { mode: string; analytics: Analytics }
  const { mode, analytics } = body

  let ideas: Idea[]
  switch (mode) {
    case 'spinoff':
      ideas = generateSpinoffs(analytics)
      break
    case 'compounding':
      ideas = findCompounding(analytics)
      break
    default:
      ideas = findWhitespace(analytics)
  }

  return Response.json({ ideas })
}

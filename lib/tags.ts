// Canonicalize YC's free-form tags for display: merge synonyms (the AI cluster
// is split four ways in the raw data) and drop umbrella terms that apply to
// nearly every company and carry no signal.

const SYNONYMS: Record<string, string> = {
  'ai': 'AI',
  'artificial intelligence': 'AI',
  'machine learning': 'AI',
  'generative ai': 'AI',
  'ai-powered drug discovery': 'AI Drug Discovery',
  'drug discovery': 'Drug Discovery',
  'biotech': 'Biotech',
  'biotechnology': 'Biotech',
  'synthetic biology': 'Synthetic Biology',
  'telemedicine': 'Telehealth',
  'telehealth': 'Telehealth',
  'mental health tech': 'Mental Health',
  'mental health': 'Mental Health',
  'consumer health services': 'Consumer Health',
  'health & wellness': 'Health & Wellness',
}

// Generic umbrella tags that nearly every healthcare company carries — no signal.
const NOISE = new Set([
  'healthcare', 'health tech', 'digital health', 'health',
])

export function canonicalizeTags(tags: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const raw of tags) {
    const key = raw.toLowerCase().trim()
    if (NOISE.has(key)) continue
    const canon = SYNONYMS[key] ?? raw
    const canonKey = canon.toLowerCase()
    if (seen.has(canonKey)) continue
    seen.add(canonKey)
    result.push(canon)
  }
  return result
}

import type { Company } from './types'

/**
 * Deterministically pick a "Company of the Day" from the most recent cohort.
 * Stable for a given calendar day, rotates daily. Biased toward the current
 * year's companies (the freshest batch) that have enough description to feature.
 */
export function getFeaturedCompany(companies: Company[], date = new Date()): Company | null {
  if (companies.length === 0) return null

  const maxYear = Math.max(...companies.map(c => c.year).filter(y => y > 0))

  // Prefer current-year companies with a real description; widen the net if needed.
  let pool = companies.filter(
    c => c.year === maxYear && c.longDescription.length > 80
  )
  if (pool.length < 3) {
    pool = companies.filter(c => c.year >= maxYear - 1 && c.longDescription.length > 80)
  }
  if (pool.length === 0) pool = companies.filter(c => c.year === maxYear)
  if (pool.length === 0) pool = companies

  // Stable, sorted pool so the index maps consistently.
  pool = [...pool].sort((a, b) => a.slug.localeCompare(b.slug))

  // Seed an index from the calendar day (YYYY-MM-DD).
  const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
  let hash = 0
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) | 0
  }
  const index = Math.abs(hash) % pool.length
  return pool[index]
}

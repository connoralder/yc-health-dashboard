import fs from 'fs'
import path from 'path'
import type { Company, Analytics, FundingOverrides } from './types'

const dataDir = path.join(process.cwd(), 'data')

export function getCompanies(): Company[] {
  try {
    const raw = fs.readFileSync(path.join(dataDir, 'companies.json'), 'utf-8')
    return JSON.parse(raw) as Company[]
  } catch {
    return []
  }
}

export function getAnalytics(): Analytics | null {
  try {
    const raw = fs.readFileSync(path.join(dataDir, 'analytics.json'), 'utf-8')
    return JSON.parse(raw) as Analytics
  } catch {
    return null
  }
}

export function getFundingOverrides(): FundingOverrides {
  try {
    const raw = fs.readFileSync(path.join(dataDir, 'funding-overrides.json'), 'utf-8')
    return JSON.parse(raw) as FundingOverrides
  } catch {
    return {}
  }
}

export function getCompanyBySlug(slug: string): Company | null {
  const companies = getCompanies()
  return companies.find(c => c.slug === slug) ?? null
}

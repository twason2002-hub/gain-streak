import { ensureBadgeTiers } from './config'

export async function getBadge(weeks) {
  const tiers = await ensureBadgeTiers()
  return tiers.find(t => weeks >= t.weeks) || null
}

export async function getNextBadge(weeks) {
  const tiers = await ensureBadgeTiers()
  for (const tier of tiers) {
    if (weeks < tier.weeks) return tier
  }
  return null
}

export async function getProgressToNextBadge(weeks) {
  const next = await getNextBadge(weeks)
  if (!next) return { next: null, progress: 1 }
  const current = await getBadge(weeks)
  const currentWeeks = current ? current.weeks : 0
  const range = next.weeks - currentWeeks
  const progress = range > 0 ? (weeks - currentWeeks) / range : 1
  return { next, progress: Math.min(Math.max(progress, 0), 1) }
}

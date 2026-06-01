import { supabase } from './supabase'
import { withTimeout } from './supabaseHelpers'
import { getDummyBadgeTiers, getDummyExerciseTypes } from './seedData'

const cache = {}

export async function ensureBadgeTiers() {
  if (cache.badgeTiers) return cache.badgeTiers
  try {
    const { data } = await withTimeout(
      supabase.from('badge_tiers').select('*').order('weeks', { ascending: false }),
      10000
    )
    cache.badgeTiers = data || []
  } catch {
    cache.badgeTiers = getDummyBadgeTiers()
  }
  return cache.badgeTiers
}

export async function ensureExerciseTypes() {
  if (cache.exerciseTypes) return cache.exerciseTypes
  try {
    const { data } = await withTimeout(
      supabase.from('exercise_types').select('*').order('sort_order', { ascending: true }),
      10000
    )
    cache.exerciseTypes = data || []
  } catch {
    cache.exerciseTypes = getDummyExerciseTypes()
  }
  return cache.exerciseTypes
}

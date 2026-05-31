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

let _motivationCache = null
let _selectedQuote = null

export async function ensureMotivationMessages() {
  if (_motivationCache) return _motivationCache
  const { data } = await supabase.from('motivation_messages').select('*')
  _motivationCache = data || []
  return _motivationCache
}

export function getCachedQuote(text) {
  if (!_selectedQuote && text) {
    _selectedQuote = text
  }
  return _selectedQuote
}

export function resetQuoteCache() {
  _selectedQuote = null
}

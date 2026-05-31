import { ensureExerciseTypes } from './config'

export function calculatePRs(workouts) {
  if (!workouts || workouts.length === 0) return { exercises: [], totalWorkouts: 0, totalSets: 0, bestVolume: null }

  const exercises = {}
  let bestVolume = null

  workouts.forEach(w => {
    const name = w.exercise_name
    const weight = parseFloat(w.weight) || 0
    const reps = parseInt(w.reps) || 0
    const volume = weight * reps
    const date = w.date

    if (!exercises[name]) {
      exercises[name] = {
        name,
        bestWeight: { value: 0, reps: 0, date: null },
        bestVolume: { value: 0, reps: 0, weight: 0, date: null },
        totalSets: 0,
        totalReps: 0,
      }
    }

    const ex = exercises[name]
    ex.totalSets++
    ex.totalReps += reps

    if (weight > ex.bestWeight.value) {
      ex.bestWeight = { value: weight, reps, date }
    }

    if (volume > ex.bestVolume.value) {
      ex.bestVolume = { value: volume, reps, weight, date }
    }

    if (volume > (bestVolume?.value || 0)) {
      bestVolume = { value: volume, exercise: name, reps, weight, date }
    }
  })

  const sorted = Object.values(exercises).sort((a, b) => b.bestWeight.value - a.bestWeight.value)

  return {
    exercises: sorted,
    totalWorkouts: workouts.length,
    totalSets: sorted.reduce((sum, e) => sum + e.totalSets, 0),
    bestVolume,
  }
}

export async function getTopPRs(exercisePRs, count = 5) {
  const types = await ensureExerciseTypes()
  const compoundNames = types.filter(t => t.is_compound).map(t => t.name.toLowerCase())

  const ranked = []
  const seen = new Set()

  compoundNames.forEach(cname => {
    const found = exercisePRs.find(e =>
      e.name.toLowerCase() === cname ||
      e.name.toLowerCase().includes(cname)
    )
    if (found && !seen.has(found.name)) {
      ranked.push(found)
      seen.add(found.name)
    }
  })

  exercisePRs.forEach(e => {
    if (!seen.has(e.name) && ranked.length < count) {
      ranked.push(e)
      seen.add(e.name)
    }
  })

  return ranked.slice(0, count)
}

export function getExerciseIcon(name, types) {
  const found = types.find(t => t.name.toLowerCase() === name.toLowerCase())
  return found ? found.icon : name.substring(0, 2).toUpperCase()
}

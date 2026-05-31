export function getDummyProfile() {
  return {
    id: 'dummy',
    username: 'demo',
    display_name: 'Demo User',
    bio: 'Consistency over intensity. Show up every week.',
    age: 28,
    height_cm: 178,
    weight_kg: 82,
    created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
  }
}

export function getDummyWorkouts() {
  const workouts = []
  const exercises = ['Bench Press', 'Squat', 'Deadlift', 'Overhead Press', 'Pull Up', 'Barbell Row']
  const today = new Date()

  for (let week = 0; week < 10; week++) {
    const daysInWeek = week < 8 ? 3 : 2
    const days = new Set()
    while (days.size < daysInWeek) {
      days.add(Math.floor(Math.random() * 7))
    }

    days.forEach((dayOfWeek) => {
      const date = new Date(today)
      const mondayOffset = (today.getDay() || 7) - 1
      date.setDate(today.getDate() - mondayOffset + dayOfWeek - week * 7)

      const numExercises = 2 + Math.floor(Math.random() * 3)
      for (let i = 0; i < numExercises; i++) {
        const exercise = exercises[Math.floor(Math.random() * exercises.length)]
        const weight = Math.round((40 + Math.random() * 80 + week * 2) / 5) * 5
        const reps = 6 + Math.floor(Math.random() * 10)
        workouts.push({
          id: `dummy-${workouts.length}`,
          user_id: 'dummy',
          exercise_name: exercise,
          reps,
          weight,
          date: date.toISOString().split('T')[0],
          created_at: date.toISOString(),
        })
      }
    })
  }

  return workouts
}

export function getDummyBadgeTiers() {
  return [
    { id: 1, weeks: 12, label: 'Gold Tick', title: '3 Months', color: '#EAB308', icon: 'G' },
    { id: 2, weeks: 24, label: 'Purple Tick', title: '6 Months', color: '#A855F7', icon: 'P' },
    { id: 3, weeks: 52, label: 'Teal Tick', title: '1 Year', color: '#14B8A6', icon: 'T' },
    { id: 4, weeks: 104, label: 'Red Tick', title: '2 Years', color: '#EF4444', icon: 'X' },
  ]
}

export function getDummyExerciseTypes() {
  return [
    { name: 'Deadlift', icon: 'DL', is_compound: true, sort_order: 1 },
    { name: 'Squat', icon: 'SQ', is_compound: true, sort_order: 2 },
    { name: 'Bench Press', icon: 'BP', is_compound: true, sort_order: 3 },
    { name: 'Overhead Press', icon: 'OH', is_compound: true, sort_order: 4 },
    { name: 'Barbell Row', icon: 'BR', is_compound: true, sort_order: 5 },
    { name: 'Pull Ups', icon: 'PU', is_compound: true, sort_order: 6 },
    { name: 'Push Ups', icon: 'PS', is_compound: false, sort_order: 7 },
    { name: 'Bicep Curl', icon: 'BC', is_compound: false, sort_order: 8 },
    { name: 'Tricep Extension', icon: 'TE', is_compound: false, sort_order: 9 },
    { name: 'Lat Pulldown', icon: 'LP', is_compound: false, sort_order: 10 },
    { name: 'Leg Press', icon: 'LP', is_compound: false, sort_order: 11 },
    { name: 'Cable Row', icon: 'CR', is_compound: true, sort_order: 12 },
  ]
}

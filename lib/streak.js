export function getDateStr(item) {
  if (item.date) return item.date
  if (item.completed_at) return new Date(item.completed_at).toISOString().split('T')[0]
  if (item.started_at) return new Date(item.started_at).toISOString().split('T')[0]
  if (item.created_at) return new Date(item.created_at).toISOString().split('T')[0]
  return new Date().toISOString().split('T')[0]
}

export function getWeekId(date = new Date()) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(d.setDate(diff))
  return monday.toISOString().split('T')[0]
}

export function getCurrentWeekRange() {
  const today = new Date()
  const day = today.getDay()
  const diff = today.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(today.setDate(diff))
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return { start: monday, end: sunday }
}

export function getWeeksInRange(startDate, endDate) {
  const weeks = []
  const current = new Date(startDate)
  while (current <= endDate) {
    weeks.push(getWeekId(current))
    current.setDate(current.getDate() + 7)
  }
  return weeks
}

export function getWorkoutDaysInWeek(items, weekId) {
  const days = new Set()
  items.forEach(w => {
    const dateStr = getDateStr(w)
    const wWeek = getWeekId(new Date(dateStr))
    if (wWeek === weekId) {
      days.add(dateStr)
    }
  })
  return days.size
}

export function calculateStreak(items, minDaysPerWeek = 3) {
  if (!items || items.length === 0) return { streak: 0, totalCompleteWeeks: 0, currentWeekDays: 0 }

  const today = new Date()
  const currentWeekId = getWeekId(today)

  const currentDays = getWorkoutDaysInWeek(items, currentWeekId)

  const weeklyMap = {}
  items.forEach(w => {
    const dateStr = getDateStr(w)
    const weekId = getWeekId(new Date(dateStr))
    if (!weeklyMap[weekId]) weeklyMap[weekId] = new Set()
    weeklyMap[weekId].add(dateStr)
  })

  const weekIds = Object.keys(weeklyMap).sort().reverse()
  let streak = 0
  let totalCompleteWeeks = 0

  Object.values(weeklyMap).forEach(days => {
    if (days.size >= minDaysPerWeek) totalCompleteWeeks++
  })

  const currentComplete = (weeklyMap[currentWeekId]?.size || 0) >= minDaysPerWeek

  if (currentComplete) {
    streak = 1
    for (let i = 0; i < weekIds.length; i++) {
      if (weekIds[i] === currentWeekId) continue
      const prevDate = new Date(weekIds[i] + 'T00:00:00')
      const expectedPrevWeek = new Date(today)
      expectedPrevWeek.setDate(expectedPrevWeek.getDate() - (streak * 7))

      const expectedWeekId = getWeekId(expectedPrevWeek)
      if (weekIds[i] === expectedWeekId && weeklyMap[weekIds[i]]?.size >= minDaysPerWeek) {
        streak++
      } else {
        break
      }
    }
  } else {
    for (let i = 0; i < weekIds.length; i++) {
      if (weekIds[i] === currentWeekId) continue
      if (weeklyMap[weekIds[i]]?.size >= minDaysPerWeek) {
        streak++
      } else {
        break
      }
    }
  }

  return { streak, totalCompleteWeeks, currentWeekDays: currentDays }
}

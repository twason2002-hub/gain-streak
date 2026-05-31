import { ensureMotivationMessages } from './config'

let _sessionQuote = null

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

export async function getMotivation(streak, totalWorkouts, hasPRThisWeek) {
  const messages = await ensureMotivationMessages()
  const streakMsgs = messages.filter(m => m.type === 'streak').sort((a, b) => b.min_streak - a.min_streak)
  const quotes = messages.filter(m => m.type === 'quote')

  const streakMsg = streakMsgs.find(m => streak >= m.min_streak)?.text || streakMsgs[0]?.text || ''

  if (hasPRThisWeek) {
    if (!_sessionQuote) {
      _sessionQuote = pickRandom(quotes)?.text || streakMsg
    }
    return _sessionQuote
  }

  if (streak > 0 && totalWorkouts > 10) {
    return streakMsg
  }

  if (totalWorkouts === 0) {
    return streakMsgs[0]?.text || ''
  }

  return streakMsg
}

export function resetSessionQuote() {
  _sessionQuote = null
}

const ADJECTIVES = [
  'Swift', 'Iron', 'Bold', 'Fierce', 'Mighty', 'Savage', 'Prime',
  'Epic', 'Brave', 'Solid', 'Raw', 'Peak', 'Hard', 'True',
  'Wild', 'Dark', 'Cool', 'Fast', 'Strong', 'Loud',
]

const NOUNS = [
  'Lifter', 'Barbell', 'Squat', 'Press', 'Beast', 'Titan', 'Wolf',
  'Bear', 'Hawk', 'Lion', 'Bull', 'Fox', 'Storm', 'Blade',
  'Hammer', 'Anvil', 'Forge', 'Steel', 'Rock', 'Flame',
]

export function generateGuestUsername() {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)]
  const num = Math.floor(Math.random() * 900) + 100
  return `${adj}${noun}${num}`
}

export async function signInAsGuest(supabase) {
  const username = generateGuestUsername()

  const { data, error } = await supabase.auth.signUp({
    email: `${username}@guest.gainstreak.app`,
    password: `guest_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    options: {
      data: {
        username,
        display_name: username,
        is_guest: true,
      },
    },
  })

  if (error) throw error

  if (data.user) {
    await supabase.from('profiles').update({
      username,
      display_name: username,
      is_guest: true,
      nickname: username,
    }).eq('id', data.user.id)
  }

  return { user: data.user, username }
}

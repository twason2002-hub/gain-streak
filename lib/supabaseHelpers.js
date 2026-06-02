export function withTimeout(promise, ms = 15000) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timed out')), ms)
    ),
  ])
}

export async function withRetry(fn, retries = 3, delayMs = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (e) {
      const msg = e?.message || ''
      const isTransient =
        msg.includes('Database error') ||
        msg.includes('unexpected_failure') ||
        msg.includes('Connection refused') ||
        msg.includes('timeout') ||
        msg.includes('Request timed out')
      if (!isTransient || i === retries - 1) throw e
      await new Promise(r => setTimeout(r, delayMs * (i + 1)))
    }
  }
}

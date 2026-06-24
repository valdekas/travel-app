const CACHE_TTL   = 24 * 60 * 60 * 1000
const MAX_ENTRIES = 50
const KEY_PREFIX  = 'suggestions_'

export function getCachedSuggestions<T>(key: string): T[] | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const { data, timestamp } = JSON.parse(raw) as { data: T[]; timestamp: number }
    if (Date.now() - timestamp > CACHE_TTL) {
      localStorage.removeItem(key)
      return null
    }
    return data
  } catch { return null }
}

export function setCachedSuggestions<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }))
    evictOldest()
  } catch {}
}

function evictOldest(): void {
  try {
    const entries: { key: string; timestamp: number }[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (!k?.startsWith(KEY_PREFIX)) continue
      const raw = localStorage.getItem(k)
      if (!raw) continue
      const { timestamp } = JSON.parse(raw) as { timestamp: number }
      entries.push({ key: k, timestamp })
    }
    if (entries.length <= MAX_ENTRIES) return
    entries.sort((a, b) => a.timestamp - b.timestamp)
    const toRemove = entries.slice(0, entries.length - MAX_ENTRIES)
    for (const { key } of toRemove) localStorage.removeItem(key)
  } catch {}
}

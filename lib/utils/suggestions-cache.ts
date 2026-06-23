const CACHE_TTL = 30 * 60 * 1000

export function getCachedSuggestions<T>(key: string): T[] | null {
  try {
    const raw = sessionStorage.getItem(key)
    if (!raw) return null
    const { data, timestamp } = JSON.parse(raw) as { data: T[]; timestamp: number }
    if (Date.now() - timestamp > CACHE_TTL) {
      sessionStorage.removeItem(key)
      return null
    }
    return data
  } catch { return null }
}

export function setCachedSuggestions<T>(key: string, data: T[]): void {
  try {
    sessionStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }))
  } catch {}
}

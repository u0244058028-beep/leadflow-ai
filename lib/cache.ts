// Enkel cache for å unngå unødvendige API-kall
interface CacheEntry {
  data: any
  timestamp: number
}

const cache = new Map<string, CacheEntry>()
const DEFAULT_TTL = 5 * 60 * 1000 // 5 minutter

export async function withCache<T>(
  key: string,
  fn: () => Promise<T>,
  ttl: number = DEFAULT_TTL
): Promise<T> {
  const cached = cache.get(key)
  
  if (cached && Date.now() - cached.timestamp < ttl) {
    console.log(`📦 Cache HIT: ${key}`)
    return cached.data as T
  }
  
  console.log(`🔄 Cache MISS: ${key}`)
  const data = await fn()
  cache.set(key, { data, timestamp: Date.now() })
  return data
}

export function clearCache(key?: string) {
  if (key) {
    cache.delete(key)
    console.log(`🗑️ Cache cleared for: ${key}`)
  } else {
    cache.clear()
    console.log('🗑️ All cache cleared')
  }
}

export function getCacheStats() {
  return {
    size: cache.size,
    keys: Array.from(cache.keys())
  }
}
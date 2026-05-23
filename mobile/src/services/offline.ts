import AsyncStorage from '@react-native-async-storage/async-storage'

const OFFLINE_CACHE_PREFIX = 'masar-cache-'
const OFFLINE_QUEUE_KEY = 'masar-offline-queue'

export interface OfflineAction {
  id: string
  endpoint: string
  method: 'POST' | 'PUT' | 'DELETE'
  body?: any
  timestamp: number
}

export async function cacheData(key: string, data: any, ttlMs: number = 5 * 60 * 1000) {
  const entry = { data, expiresAt: Date.now() + ttlMs }
  await AsyncStorage.setItem(OFFLINE_CACHE_PREFIX + key, JSON.stringify(entry))
}

export async function getCachedData<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(OFFLINE_CACHE_PREFIX + key)
    if (!raw) return null
    const entry = JSON.parse(raw)
    if (Date.now() > entry.expiresAt) {
      await AsyncStorage.removeItem(OFFLINE_CACHE_PREFIX + key)
      return null
    }
    return entry.data as T
  } catch {
    return null
  }
}

export async function queueOfflineAction(action: Omit<OfflineAction, 'id' | 'timestamp'>) {
  const queue = await getOfflineQueue()
  queue.push({ ...action, id: `${Date.now()}-${Math.random()}`, timestamp: Date.now() })
  await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue))
}

export async function getOfflineQueue(): Promise<OfflineAction[]> {
  try {
    const raw = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export async function clearOfflineQueue() {
  await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY)
}

export async function syncOfflineQueue(syncFn: (action: OfflineAction) => Promise<void>) {
  const queue = await getOfflineQueue()
  if (queue.length === 0) return

  const remaining: OfflineAction[] = []
  for (const action of queue) {
    try {
      await syncFn(action)
    } catch {
      remaining.push(action)
    }
  }

  if (remaining.length === 0) {
    await clearOfflineQueue()
  } else {
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remaining))
  }
}

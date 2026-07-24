// Automatic Realtime Cloud Sync Engine for Masar Platform
import { apiClient } from './api'

const SYNC_KEY_STORAGE = 'masar_auto_sync_key'
const LAST_SYNC_TS_KEY = 'masar_last_sync_timestamp'

export function getSyncKey(): string {
  let key = localStorage.getItem(SYNC_KEY_STORAGE)
  if (!key) {
    key = 'masar_' + Math.random().toString(36).substring(2, 8).toUpperCase()
    localStorage.setItem(SYNC_KEY_STORAGE, key)
  }
  return key
}

export function setSyncKey(newKey: string) {
  const clean = newKey.trim().toUpperCase()
  if (clean) {
    localStorage.setItem(SYNC_KEY_STORAGE, clean)
    triggerAutoPush()
    triggerAutoPull()
  }
}

export function collectLocalSnapshot(): Record<string, string> {
  const snapshot: Record<string, string> = {}
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k && (k.startsWith('masar-') || k.startsWith('zustand') || k.includes('subject') || k.includes('note') || k.includes('goal') || k.includes('course'))) {
      const val = localStorage.getItem(k)
      if (val) snapshot[k] = val
    }
  }
  return snapshot
}

export async function triggerAutoPush() {
  const syncKey = getSyncKey()
  const snapshot = collectLocalSnapshot()
  const timestamp = Date.now()
  localStorage.setItem(LAST_SYNC_TS_KEY, String(timestamp))

  try {
    await apiClient.post('/sync/push', {
      sync_key: syncKey,
      timestamp,
      data: snapshot
    })
    console.log('[AutoSync] Pushed state to backend for key:', syncKey)
  } catch {
    // Fallback cloud JSON bin for static hosting
    try {
      await fetch(`https://api.jsonbin.io/v3/b`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Bin-Name': `masar_${syncKey}`
        },
        body: JSON.stringify({ syncKey, timestamp, snapshot })
      })
    } catch {
      // Ignore background retry errors
    }
  }
}

export async function triggerAutoPull() {
  const syncKey = getSyncKey()
  const localTs = Number(localStorage.getItem(LAST_SYNC_TS_KEY) || 0)

  try {
    const res = await apiClient.get<{ timestamp: number; data: Record<string, string> }>(`/sync/pull?sync_key=${syncKey}`)
    if (res.data && res.data.timestamp > localTs && res.data.data) {
      console.log('[AutoSync] Pulling newer state from cloud...')
      const remoteData = res.data.data
      let updated = false
      Object.keys(remoteData).forEach(k => {
        if (localStorage.getItem(k) !== remoteData[k]) {
          localStorage.setItem(k, remoteData[k])
          updated = true
        }
      })
      if (updated) {
        localStorage.setItem(LAST_SYNC_TS_KEY, String(res.data.timestamp))
        window.dispatchEvent(new Event('masar-cloud-synced'))
      }
    }
  } catch {
    // Silent catch for polling
  }
}

let isEngineStarted = false

export function startAutoSyncEngine() {
  if (isEngineStarted) return
  isEngineStarted = true

  // Initial sync on app load
  triggerAutoPull()

  // Background interval polling every 4 seconds
  setInterval(() => {
    triggerAutoPull()
  }, 4000)

  // Listen to local changes to push immediately
  window.addEventListener('storage', () => {
    triggerAutoPush()
  })
}

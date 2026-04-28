// Offline detection and action queueing for offline-first functionality

export interface QueuedAction {
  id: string
  type: string
  payload: unknown
  timestamp: number
}

const QUEUE_KEY = 'vitalfi_offline_queue'

export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true
}

export function getOfflineQueue(): QueuedAction[] {
  try {
    const stored = localStorage.getItem(QUEUE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

export function addToQueue(action: Omit<QueuedAction, 'id' | 'timestamp'>): QueuedAction {
  const queue = getOfflineQueue()
  const item: QueuedAction = {
    ...action,
    id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
    timestamp: Date.now(),
  }
  queue.push(item)
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
  return item
}

export function removeFromQueue(id: string): void {
  const queue = getOfflineQueue().filter((a) => a.id !== id)
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
}

export function clearQueue(): void {
  localStorage.removeItem(QUEUE_KEY)
}

export async function processQueue(): Promise<{ processed: number; failed: number }> {
  if (!isOnline()) {
    return { processed: 0, failed: 0 }
  }

  const queue = getOfflineQueue()
  let processed = 0
  let failed = 0

  for (const action of queue) {
    try {
      // Process action based on type - placeholder for actual sync logic
      // In a real app, this would call APIs to sync data
      await new Promise((resolve) => setTimeout(resolve, 100))
      removeFromQueue(action.id)
      processed++
    } catch {
      failed++
    }
  }

  return { processed, failed }
}

export function useOnlineStatus(): boolean {
  return isOnline()
}

// IndexedDB utilities for offline data storage

interface DBConfig {
  name: string
  version: number
  stores: {
    name: string
    keyPath: string
    indexes?: Array<{ name: string; keyPath: string; unique?: boolean }>
  }[]
}

class OfflineDB {
  private db: IDBDatabase | null = null
  private dbName: string
  private version: number
  private stores: DBConfig['stores']

  constructor(config: DBConfig) {
    this.dbName = config.name
    this.version = config.version
    this.stores = config.stores
  }

  async open(): Promise<IDBDatabase> {
    if (this.db) return this.db

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve(this.db)
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        this.stores.forEach((store) => {
          if (!db.objectStoreNames.contains(store.name)) {
            const objectStore = db.createObjectStore(store.name, {
              keyPath: store.keyPath,
            })

            store.indexes?.forEach((index) => {
              objectStore.createIndex(index.name, index.keyPath, {
                unique: index.unique || false,
              })
            })
          }
        })
      }
    })
  }

  async get<T>(storeName: string, key: string): Promise<T | undefined> {
    const db = await this.open()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.get(key)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    const db = await this.open()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.getAll()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }

  async set<T>(storeName: string, value: T): Promise<void> {
    const db = await this.open()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.put(value)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async delete(storeName: string, key: string): Promise<void> {
    const db = await this.open()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.delete(key)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async clear(storeName: string): Promise<void> {
    const db = await this.open()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.clear()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }
}

// Initialize offline database
export const offlineDB = new OfflineDB({
  name: 'logivox-offline',
  version: 1,
  stores: [
    {
      name: 'inventory',
      keyPath: 'id',
      indexes: [
        { name: 'sku', keyPath: 'sku', unique: true },
        { name: 'warehouseId', keyPath: 'warehouseId' },
        { name: 'categoryId', keyPath: 'categoryId' },
      ],
    },
    {
      name: 'bookings',
      keyPath: 'id',
      indexes: [
        { name: 'customerId', keyPath: 'customerId' },
        { name: 'status', keyPath: 'status' },
      ],
    },
    {
      name: 'customers',
      keyPath: 'id',
      indexes: [{ name: 'email', keyPath: 'email', unique: true }],
    },
    {
      name: 'pendingSync',
      keyPath: 'id',
      indexes: [
        { name: 'timestamp', keyPath: 'timestamp' },
        { name: 'type', keyPath: 'type' },
      ],
    },
  ],
})

// Sync queue for offline operations
export interface PendingSyncItem {
  id: string
  type: 'create' | 'update' | 'delete'
  endpoint: string
  data: any
  timestamp: number
}

export async function addToSyncQueue(item: Omit<PendingSyncItem, 'id' | 'timestamp'>) {
  const syncItem: PendingSyncItem = {
    id: `sync-${Date.now()}-${Math.random()}`,
    timestamp: Date.now(),
    ...item,
  }
  await offlineDB.set('pendingSync', syncItem)
}

export async function processSyncQueue() {
  const items = await offlineDB.getAll<PendingSyncItem>('pendingSync')
  
  for (const item of items) {
    try {
      let response: Response
      
      switch (item.type) {
        case 'create':
          response = await fetch(item.endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item.data),
          })
          break
        case 'update':
          response = await fetch(item.endpoint, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item.data),
          })
          break
        case 'delete':
          response = await fetch(item.endpoint, {
            method: 'DELETE',
          })
          break
      }

      if (response.ok) {
        await offlineDB.delete('pendingSync', item.id)
      }
    } catch (error) {
      console.error('Sync failed for item:', item, error)
      // Item remains in queue for retry
    }
  }
}

// Detect online/offline status
export function setupOfflineSync() {
  if (typeof window === 'undefined') return

  window.addEventListener('online', async () => {
    console.log('Back online, syncing data...')
    await processSyncQueue()
  })

  window.addEventListener('offline', () => {
    console.log('Offline mode activated')
  })

  // Check online status periodically
  setInterval(async () => {
    if (navigator.onLine) {
      await processSyncQueue()
    }
  }, 60000) // Every minute
}

// Check if offline
export function isOffline(): boolean {
  return typeof navigator !== 'undefined' && !navigator.onLine
}

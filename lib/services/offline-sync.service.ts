/**
 * Offline Sync Service
 * Handle offline data synchronization for mobile app
 */

export interface SyncEntity {
  id: string;
  entity: string;
  action: "CREATE" | "UPDATE" | "DELETE";
  data: any;
  localId: string;
  timestamp: Date;
  synced: boolean;
  syncedAt?: Date;
  error?: string;
}

export interface SyncState {
  lastSyncAt: Date | null;
  pendingChanges: number;
  isSyncing: boolean;
  lastError: string | null;
}

export class OfflineSyncService {
  private static readonly STORAGE_KEY = "flowstock_offline_data";
  private static readonly SYNC_INTERVAL = 30000; // 30 seconds
  private static syncTimer: NodeJS.Timeout | null = null;

  /**
   * Initialize offline sync
   */
  static async initialize(): Promise<void> {
    console.log("Initializing offline sync service");

    // Start auto-sync timer
    this.startAutoSync();

    // Listen for online/offline events
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => this.handleOnline());
      window.addEventListener("offline", () => this.handleOffline());
    }
  }

  /**
   * Start automatic sync
   */
  static startAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    this.syncTimer = setInterval(() => {
      this.syncIfOnline();
    }, this.SYNC_INTERVAL);
  }

  /**
   * Stop automatic sync
   */
  static stopAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  /**
   * Sync if online
   */
  static async syncIfOnline(): Promise<void> {
    if (this.isOnline()) {
      await this.sync();
    }
  }

  /**
   * Check if device is online
   */
  static isOnline(): boolean {
    if (typeof navigator !== "undefined") {
      return navigator.onLine;
    }
    return true;
  }

  /**
   * Handle online event
   */
  private static async handleOnline(): Promise<void> {
    console.log("Device is online - syncing data");
    await this.sync();
  }

  /**
   * Handle offline event
   */
  private static handleOffline(): void {
    console.log("Device is offline - queueing changes");
  }

  /**
   * Get sync state
   */
  static getSyncState(): SyncState {
    const data = this.loadOfflineData();
    const pendingChanges = data.filter((item) => !item.synced).length;

    return {
      lastSyncAt: this.getLastSyncTime(),
      pendingChanges,
      isSyncing: false,
      lastError: null,
    };
  }

  /**
   * Queue change for sync
   */
  static queueChange(
    entity: string,
    action: "CREATE" | "UPDATE" | "DELETE",
    data: any,
  ): string {
    const localId = this.generateLocalId();

    const change: SyncEntity = {
      id: data.id || localId,
      entity,
      action,
      data,
      localId,
      timestamp: new Date(),
      synced: false,
    };

    const queue = this.loadOfflineData();
    queue.push(change);
    this.saveOfflineData(queue);

    // Try to sync immediately if online
    if (this.isOnline()) {
      setTimeout(() => this.sync(), 100);
    }

    return localId;
  }

  /**
   * Sync pending changes with server
   */
  static async sync(): Promise<{
    success: boolean;
    appliedChanges: number;
    failedChanges: number;
  }> {
    if (!this.isOnline()) {
      return {
        success: false,
        appliedChanges: 0,
        failedChanges: 0,
      };
    }

    const queue = this.loadOfflineData();
    const pendingChanges = queue.filter((item) => !item.synced);

    if (pendingChanges.length === 0) {
      // Just pull server changes
      await this.pullServerChanges();
      return {
        success: true,
        appliedChanges: 0,
        failedChanges: 0,
      };
    }

    try {
      // Send pending changes to server
      const response = await fetch("/api/mobile/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.getAuthToken()}`,
        },
        body: JSON.stringify({
          lastSyncAt: this.getLastSyncTime()?.toISOString(),
          pendingChanges: pendingChanges.map((change) => ({
            entity: change.entity,
            action: change.action,
            data: change.data,
            localId: change.localId,
            timestamp: change.timestamp.toISOString(),
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Sync failed");
      }

      const result = await response.json();

      // Mark changes as synced
      const updatedQueue = queue.map((item) => {
        const applied = result.data.appliedChanges.find(
          (c: any) => c.localId === item.localId,
        );

        if (applied) {
          return {
            ...item,
            synced: true,
            syncedAt: new Date(),
            id: applied.serverId || item.id,
          };
        }

        const failed = result.data.failedChanges.find(
          (c: any) => c.localId === item.localId,
        );

        if (failed) {
          return {
            ...item,
            error: failed.error,
          };
        }

        return item;
      });

      this.saveOfflineData(updatedQueue);
      this.setLastSyncTime(new Date());

      // Apply server changes to local storage
      if (result.data.serverChanges) {
        this.applyServerChanges(result.data.serverChanges);
      }

      return {
        success: true,
        appliedChanges: result.data.appliedChanges.length,
        failedChanges: result.data.failedChanges.length,
      };
    } catch (error) {
      console.error("Sync error:", error);
      return {
        success: false,
        appliedChanges: 0,
        failedChanges: pendingChanges.length,
      };
    }
  }

  /**
   * Pull server changes
   */
  private static async pullServerChanges(): Promise<void> {
    try {
      const response = await fetch("/api/mobile/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.getAuthToken()}`,
        },
        body: JSON.stringify({
          lastSyncAt: this.getLastSyncTime()?.toISOString(),
          pendingChanges: [],
        }),
      });

      if (response.ok) {
        const result = await response.json();

        if (result.data.serverChanges) {
          this.applyServerChanges(result.data.serverChanges);
        }

        this.setLastSyncTime(new Date());
      }
    } catch (error) {
      console.error("Pull server changes error:", error);
    }
  }

  /**
   * Apply server changes to local storage
   */
  private static applyServerChanges(changes: any): void {
    // Update local cache with server data
    if (changes.tasks) {
      localStorage.setItem("cached_tasks", JSON.stringify(changes.tasks));
    }

    if (changes.items) {
      localStorage.setItem("cached_items", JSON.stringify(changes.items));
    }

    console.log("Applied server changes to local storage");
  }

  /**
   * Clear synced changes
   */
  static clearSyncedChanges(): void {
    const queue = this.loadOfflineData();
    const pending = queue.filter((item) => !item.synced);
    this.saveOfflineData(pending);
  }

  /**
   * Get cached data for offline use
   */
  static getCachedData<T>(key: string): T | null {
    try {
      const data = localStorage.getItem(`cached_${key}`);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  /**
   * Set cached data
   */
  static setCachedData<T>(key: string, data: T): void {
    try {
      localStorage.setItem(`cached_${key}`, JSON.stringify(data));
    } catch (error) {
      console.error("Failed to cache data:", error);
    }
  }

  /**
   * Load offline data from storage
   */
  private static loadOfflineData(): SyncEntity[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  /**
   * Save offline data to storage
   */
  private static saveOfflineData(data: SyncEntity[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error("Failed to save offline data:", error);
    }
  }

  /**
   * Get last sync time
   */
  private static getLastSyncTime(): Date | null {
    const time = localStorage.getItem("last_sync_time");
    return time ? new Date(time) : null;
  }

  /**
   * Set last sync time
   */
  private static setLastSyncTime(time: Date): void {
    localStorage.setItem("last_sync_time", time.toISOString());
  }

  /**
   * Get auth token
   */
  private static getAuthToken(): string {
    return localStorage.getItem("auth_token") || "";
  }

  /**
   * Generate local ID
   */
  private static generateLocalId(): string {
    return `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clean up old synced data
   */
  static cleanup(olderThanDays: number = 7): void {
    const queue = this.loadOfflineData();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const filtered = queue.filter((item) => {
      if (item.synced && item.syncedAt) {
        return new Date(item.syncedAt) > cutoffDate;
      }
      return true; // Keep unsynced items
    });

    this.saveOfflineData(filtered);
  }
}

import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { apiClient } from "@/lib/api/client";

const QUEUE_KEY = "flowstock_sync_queue";
const MAX_RETRIES = 3;

export type SyncOperationType =
  | "PICK_ITEM"
  | "RECEIVE_ITEM"
  | "STOCK_ADJUST"
  | "CREATE_INVOICE"
  | "SEND_INVOICE"
  | "COMPLETE_PICKING"
  | "YARD_CHECKIN"
  | "YARD_CHECKOUT";

export interface QueuedOperation {
  id: string;
  type: SyncOperationType;
  endpoint: string;
  method: "POST" | "PUT" | "PATCH" | "DELETE";
  payload: Record<string, unknown>;
  retries: number;
  createdAt: string;
  lastError?: string;
}

interface OfflineState {
  isOnline: boolean;
  isSyncing: boolean;
  queue: QueuedOperation[];
  lastSyncAt: string | null;
  pendingCount: number;

  // Actions
  initialize: () => Promise<void>;
  enqueue: (op: Omit<QueuedOperation, "id" | "retries" | "createdAt">) => Promise<void>;
  processQueue: () => Promise<void>;
  clearQueue: () => Promise<void>;
  setOnline: (online: boolean) => void;
}

export const useOfflineStore = create<OfflineState>((set, get) => ({
  isOnline: true,
  isSyncing: false,
  queue: [],
  lastSyncAt: null,
  pendingCount: 0,

  // ── Initialize + subscribe to network changes ──────────────────────────────
  initialize: async () => {
    // Load persisted queue
    try {
      const raw = await AsyncStorage.getItem(QUEUE_KEY);
      if (raw) {
        const queue: QueuedOperation[] = JSON.parse(raw);
        set({ queue, pendingCount: queue.length });
      }
    } catch {
      // Reset corrupt queue
      await AsyncStorage.removeItem(QUEUE_KEY);
    }

    // Subscribe to connectivity changes
    NetInfo.addEventListener((state: { isConnected: boolean | null; isInternetReachable: boolean | null }) => {
      const isOnline = state.isConnected === true && state.isInternetReachable !== false;
      get().setOnline(isOnline);
      if (isOnline && get().queue.length > 0) {
        get().processQueue();
      }
    });
  },

  setOnline: (isOnline: boolean) => set({ isOnline }),

  // ── Add operation to offline queue ────────────────────────────────────────
  enqueue: async (op) => {
    const operation: QueuedOperation = {
      ...op,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      retries: 0,
      createdAt: new Date().toISOString(),
    };

    const queue = [...get().queue, operation];
    set({ queue, pendingCount: queue.length });
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  },

  // ── Process all queued operations ─────────────────────────────────────────
  processQueue: async () => {
    const { queue, isSyncing, isOnline } = get();
    if (isSyncing || !isOnline || queue.length === 0) return;

    set({ isSyncing: true });

    const remaining: QueuedOperation[] = [];

    for (const op of queue) {
      try {
        await apiClient.request({
          method: op.method,
          url: op.endpoint,
          data: op.payload,
        });
      } catch (err) {
        const updatedOp = {
          ...op,
          retries: op.retries + 1,
          lastError: err instanceof Error ? err.message : String(err),
        };
        if (updatedOp.retries < MAX_RETRIES) {
          remaining.push(updatedOp);
        }
        // Silently drop after max retries to avoid infinite loops
      }
    }

    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
    set({
      queue: remaining,
      pendingCount: remaining.length,
      isSyncing: false,
      lastSyncAt: new Date().toISOString(),
    });
  },

  clearQueue: async () => {
    await AsyncStorage.removeItem(QUEUE_KEY);
    set({ queue: [], pendingCount: 0 });
  },
}));

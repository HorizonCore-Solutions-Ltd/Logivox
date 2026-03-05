
import { apiClient } from "./client";

export interface ManualTransferPayload {
  sourceOrgId: string;
  targetOrgId: string;
  sku: string;
  quantity: number;
  boxId?: string;
  originalOrderId?: string;
  requesterId?: string;
}

export const transferApi = {
  /**
   * Initiate an Inter-Organization Transfer manually.
   * This triggers the full financial and logistical flow.
   */
  createManualTransfer: async (payload: ManualTransferPayload) => {
    const { data } = await apiClient.post("/api/logistics/transfers/manual", payload);
    return data;
  },

  /**
   * Run a Global Recall Analysis.
   * Identifies stagnant stock across the network.
   */
  runGlobalRecall: async (mainDcId: string) => {
    const { data } = await apiClient.get(`/api/logistics/transfers/cron/recall`, {
      params: { dcId: mainDcId },
    });
    return data;
  },
};

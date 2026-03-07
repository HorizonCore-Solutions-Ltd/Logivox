export const ShippingService = {
  getByTrackingNumber: async (trackingNumber: string) => {
    return { trackingNumber, status: "IN_TRANSIT", updates: [] };
  },
  getShippingMetrics: async (params: any) => {
    return { total: 0, onTime: 0, delayed: 0 };
  },
  createShipment: async (data: any) => {
    return { id: "mock-shipment-id", ...data, status: "CREATED" };
  },
  getRateQuotes: async (data: any) => {
    return [{ carrier: "MockCarrier", rate: 10.0, currency: "USD" }];
  },
  selectOptimalCarrier: async (data: any) => {
    return { carrier: "MockCarrier", rate: 10.0, currency: "USD" };
  },
  generateLabel: async (data: any) => {
    return { labelUrl: "https://example.com/label.pdf", format: "PDF" };
  },
  bulkShip: async (data: any) => {
    return { processed: data.shipments?.length || 0, failed: 0 };
  },
};

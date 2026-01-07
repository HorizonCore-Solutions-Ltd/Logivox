// =============================================================================
// PROMETHEUS METRICS SERVICE
// =============================================================================
// Export application metrics in Prometheus format

import {
  Registry,
  Counter,
  Histogram,
  Gauge,
  collectDefaultMetrics,
} from "prom-client";

// Create a Registry to register metrics
export const register = new Registry();

// Collect default metrics (CPU, memory, etc.)
collectDefaultMetrics({
  register,
  prefix: "logivox_",
  gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
});

// ===========================================================================
// HTTP METRICS
// ===========================================================================

export const httpRequestDuration = new Histogram({
  name: "logivox_http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.001, 0.005, 0.015, 0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 1, 2, 5],
  registers: [register],
});

export const httpRequestTotal = new Counter({
  name: "logivox_http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
  registers: [register],
});

export const httpRequestSizeBytes = new Histogram({
  name: "logivox_http_request_size_bytes",
  help: "Size of HTTP requests in bytes",
  labelNames: ["method", "route"],
  buckets: [100, 1000, 5000, 10000, 50000, 100000, 500000, 1000000],
  registers: [register],
});

export const httpResponseSizeBytes = new Histogram({
  name: "logivox_http_response_size_bytes",
  help: "Size of HTTP responses in bytes",
  labelNames: ["method", "route"],
  buckets: [100, 1000, 5000, 10000, 50000, 100000, 500000, 1000000],
  registers: [register],
});

// ===========================================================================
// DATABASE METRICS
// ===========================================================================

export const dbQueryDuration = new Histogram({
  name: "logivox_db_query_duration_seconds",
  help: "Duration of database queries in seconds",
  labelNames: ["model", "action"],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});

export const dbQueryTotal = new Counter({
  name: "logivox_db_queries_total",
  help: "Total number of database queries",
  labelNames: ["model", "action", "status"],
  registers: [register],
});

export const dbConnectionPoolSize = new Gauge({
  name: "logivox_db_connection_pool_size",
  help: "Current size of database connection pool",
  registers: [register],
});

export const dbConnectionPoolUsed = new Gauge({
  name: "logivox_db_connection_pool_used",
  help: "Number of connections currently in use",
  registers: [register],
});

// ===========================================================================
// BUSINESS METRICS
// ===========================================================================

export const ordersTotal = new Counter({
  name: "logivox_orders_total",
  help: "Total number of orders",
  labelNames: ["type", "status"],
  registers: [register],
});

export const orderProcessingDuration = new Histogram({
  name: "logivox_order_processing_duration_seconds",
  help: "Time taken to process orders",
  labelNames: ["type"],
  buckets: [1, 5, 10, 30, 60, 120, 300, 600],
  registers: [register],
});

export const inventoryItemsTotal = new Gauge({
  name: "logivox_inventory_items_total",
  help: "Total number of inventory items",
  labelNames: ["warehouse"],
  registers: [register],
});

export const inventoryQuantityTotal = new Gauge({
  name: "logivox_inventory_quantity_total",
  help: "Total inventory quantity",
  labelNames: ["warehouse"],
  registers: [register],
});

export const picksTotal = new Counter({
  name: "logivox_picks_total",
  help: "Total number of picks",
  labelNames: ["warehouse", "status"],
  registers: [register],
});

export const pickAccuracyRate = new Gauge({
  name: "logivox_pick_accuracy_rate",
  help: "Pick accuracy rate (percentage)",
  labelNames: ["warehouse"],
  registers: [register],
});

export const shipmentsTotal = new Counter({
  name: "logivox_shipments_total",
  help: "Total number of shipments",
  labelNames: ["carrier", "status"],
  registers: [register],
});

// ===========================================================================
// AUTHENTICATION & SECURITY METRICS
// ===========================================================================

export const authAttemptsTotal = new Counter({
  name: "logivox_auth_attempts_total",
  help: "Total number of authentication attempts",
  labelNames: ["method", "result"],
  registers: [register],
});

export const mfaVerificationsTotal = new Counter({
  name: "logivox_mfa_verifications_total",
  help: "Total number of MFA verifications",
  labelNames: ["result"],
  registers: [register],
});

export const apiKeyUsageTotal = new Counter({
  name: "logivox_api_key_usage_total",
  help: "Total number of API key authentications",
  labelNames: ["result"],
  registers: [register],
});

export const activeSessionsGauge = new Gauge({
  name: "logivox_active_sessions",
  help: "Number of active user sessions",
  registers: [register],
});

export const rateLimitHitsTotal = new Counter({
  name: "logivox_rate_limit_hits_total",
  help: "Total number of rate limit hits",
  labelNames: ["route"],
  registers: [register],
});

// ===========================================================================
// INTEGRATION METRICS
// ===========================================================================

export const integrationCallsTotal = new Counter({
  name: "logivox_integration_calls_total",
  help: "Total number of external integration calls",
  labelNames: ["service", "status"],
  registers: [register],
});

export const integrationDuration = new Histogram({
  name: "logivox_integration_duration_seconds",
  help: "Duration of external integration calls",
  labelNames: ["service"],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
  registers: [register],
});

export const webhookDeliveriesTotal = new Counter({
  name: "logivox_webhook_deliveries_total",
  help: "Total number of webhook deliveries",
  labelNames: ["status"],
  registers: [register],
});

// ===========================================================================
// APPLICATION HEALTH METRICS
// ===========================================================================

export const healthCheckStatus = new Gauge({
  name: "logivox_health_check_status",
  help: "Health check status (1 = healthy, 0 = unhealthy)",
  labelNames: ["component"],
  registers: [register],
});

export const errorTotal = new Counter({
  name: "logivox_errors_total",
  help: "Total number of errors",
  labelNames: ["type", "severity"],
  registers: [register],
});

// ===========================================================================
// VOICE OPERATIONS METRICS
// ===========================================================================

export const voiceCommandsTotal = new Counter({
  name: "logivox_voice_commands_total",
  help: "Total number of voice commands",
  labelNames: ["module", "command", "status"],
  registers: [register],
});

export const voiceRecognitionAccuracy = new Gauge({
  name: "logivox_voice_recognition_accuracy",
  help: "Voice recognition accuracy rate (percentage)",
  labelNames: ["module"],
  registers: [register],
});

// ===========================================================================
// HELPER FUNCTIONS
// ===========================================================================

/**
 * Track HTTP request metrics
 */
export function trackHttpRequest(
  method: string,
  route: string,
  statusCode: number,
  duration: number,
  requestSize?: number,
  responseSize?: number,
) {
  httpRequestTotal.labels(method, route, statusCode.toString()).inc();
  httpRequestDuration
    .labels(method, route, statusCode.toString())
    .observe(duration / 1000);

  if (requestSize) {
    httpRequestSizeBytes.labels(method, route).observe(requestSize);
  }

  if (responseSize) {
    httpResponseSizeBytes.labels(method, route).observe(responseSize);
  }
}

/**
 * Track database query metrics
 */
export function trackDatabaseQuery(
  model: string,
  action: string,
  duration: number,
  success: boolean,
) {
  dbQueryTotal.labels(model, action, success ? "success" : "error").inc();
  dbQueryDuration.labels(model, action).observe(duration / 1000);
}

/**
 * Track authentication metrics
 */
export function trackAuthentication(method: string, success: boolean) {
  authAttemptsTotal.labels(method, success ? "success" : "failure").inc();
}

/**
 * Track MFA verification
 */
export function trackMFAVerification(success: boolean) {
  mfaVerificationsTotal.labels(success ? "success" : "failure").inc();
}

/**
 * Track integration call
 */
export function trackIntegration(
  service: string,
  duration: number,
  success: boolean,
) {
  integrationCallsTotal.labels(service, success ? "success" : "error").inc();
  integrationDuration.labels(service).observe(duration / 1000);
}

/**
 * Track error
 */
export function trackError(
  type: string,
  severity: "low" | "medium" | "high" | "critical",
) {
  errorTotal.labels(type, severity).inc();
}

/**
 * Update health status
 */
export function updateHealthStatus(component: string, healthy: boolean) {
  healthCheckStatus.labels(component).set(healthy ? 1 : 0);
}

/**
 * Track voice command
 */
export function trackVoiceCommand(
  module: string,
  command: string,
  success: boolean,
) {
  voiceCommandsTotal
    .labels(module, command, success ? "success" : "error")
    .inc();
}

// Export metrics for use in API route
export async function getMetrics(): Promise<string> {
  return await register.metrics();
}

export default {
  register,
  httpRequestDuration,
  httpRequestTotal,
  dbQueryDuration,
  dbQueryTotal,
  ordersTotal,
  inventoryItemsTotal,
  authAttemptsTotal,
  mfaVerificationsTotal,
  trackHttpRequest,
  trackDatabaseQuery,
  trackAuthentication,
  trackMFAVerification,
  trackIntegration,
  trackError,
  updateHealthStatus,
  trackVoiceCommand,
  getMetrics,
};

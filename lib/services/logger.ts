// =============================================================================
// STRUCTURED LOGGING SERVICE
// =============================================================================
// Production-ready logging with Pino for performance and structure

import pino from "pino";

// Configure log level based on environment
const logLevel =
  process.env.LOG_LEVEL ||
  (process.env.NODE_ENV === "production" ? "info" : "debug");

// Create base logger instance
const logger = pino({
  level: logLevel,
  ...(process.env.NODE_ENV !== "production" && {
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:standard",
        ignore: "pid,hostname",
      },
    },
  }),
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  base: {
    env: process.env.NODE_ENV,
    app: "logivox-wms",
  },
});

// Context types for structured logging
interface LogContext {
  userId?: string;
  organizationId?: string;
  requestId?: string;
  correlationId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  path?: string;
  method?: string;
  statusCode?: number;
  duration?: number;
  [key: string]: any;
}

interface ErrorContext extends LogContext {
  error: Error;
  stack?: string;
  errorCode?: string;
  errorMessage?: string;
}

/**
 * Create a child logger with context
 */
export function createLogger(context: LogContext) {
  return logger.child(context);
}

/**
 * Log an info message
 */
export function info(message: string, context?: LogContext) {
  logger.info(context, message);
}

/**
 * Log a warning
 */
export function warn(message: string, context?: LogContext) {
  logger.warn(context, message);
}

/**
 * Log an error
 */
export function error(message: string, context?: ErrorContext) {
  if (context?.error) {
    logger.error(
      {
        ...context,
        err: {
          message: context.error.message,
          stack: context.error.stack,
          name: context.error.name,
        },
      },
      message,
    );
  } else {
    logger.error(context, message);
  }
}

/**
 * Log a debug message
 */
export function debug(message: string, context?: LogContext) {
  logger.debug(context, message);
}

/**
 * Log a fatal error (application termination)
 */
export function fatal(message: string, context?: ErrorContext) {
  if (context?.error) {
    logger.fatal(
      {
        ...context,
        err: {
          message: context.error.message,
          stack: context.error.stack,
          name: context.error.name,
        },
      },
      message,
    );
  } else {
    logger.fatal(context, message);
  }
}

/**
 * Log HTTP request
 */
export function logRequest(req: {
  method: string;
  url: string;
  headers: any;
  userId?: string;
  organizationId?: string;
  startTime: number;
}) {
  const duration = Date.now() - req.startTime;

  logger.info(
    {
      type: "http_request",
      method: req.method,
      path: req.url,
      userId: req.userId,
      organizationId: req.organizationId,
      ipAddress: req.headers["x-forwarded-for"] || req.headers["x-real-ip"],
      userAgent: req.headers["user-agent"],
      duration,
    },
    `${req.method} ${req.url} - ${duration}ms`,
  );
}

/**
 * Log HTTP response
 */
export function logResponse(req: {
  method: string;
  url: string;
  statusCode: number;
  duration: number;
  userId?: string;
}) {
  const level =
    req.statusCode >= 500 ? "error" : req.statusCode >= 400 ? "warn" : "info";

  logger[level](
    {
      type: "http_response",
      method: req.method,
      path: req.url,
      statusCode: req.statusCode,
      duration: req.duration,
      userId: req.userId,
    },
    `${req.method} ${req.url} ${req.statusCode} - ${req.duration}ms`,
  );
}

/**
 * Log database query
 */
export function logQuery(query: {
  model: string;
  action: string;
  duration: number;
  userId?: string;
}) {
  logger.debug(
    {
      type: "database_query",
      model: query.model,
      action: query.action,
      duration: query.duration,
      userId: query.userId,
    },
    `DB Query: ${query.model}.${query.action} - ${query.duration}ms`,
  );
}

/**
 * Log business event
 */
export function logEvent(event: {
  type: string;
  action: string;
  entityType?: string;
  entityId?: string;
  userId?: string;
  organizationId?: string;
  details?: any;
}) {
  logger.info(
    {
      type: "business_event",
      eventType: event.type,
      action: event.action,
      entityType: event.entityType,
      entityId: event.entityId,
      userId: event.userId,
      organizationId: event.organizationId,
      details: event.details,
    },
    `Event: ${event.type} - ${event.action}`,
  );
}

/**
 * Log security event
 */
export function logSecurityEvent(event: {
  type: "authentication" | "authorization" | "mfa" | "session" | "api_key";
  action: string;
  userId?: string;
  success: boolean;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: any;
}) {
  const level = event.success ? "info" : "warn";

  logger[level](
    {
      type: "security_event",
      securityEventType: event.type,
      action: event.action,
      userId: event.userId,
      success: event.success,
      reason: event.reason,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      details: event.details,
    },
    `Security: ${event.type} - ${event.action} - ${event.success ? "SUCCESS" : "FAILED"}`,
  );
}

/**
 * Log performance metric
 */
export function logPerformance(metric: {
  name: string;
  value: number;
  unit: "ms" | "bytes" | "count";
  labels?: Record<string, string>;
}) {
  logger.debug(
    {
      type: "performance_metric",
      metricName: metric.name,
      value: metric.value,
      unit: metric.unit,
      labels: metric.labels,
    },
    `Metric: ${metric.name} = ${metric.value}${metric.unit}`,
  );
}

/**
 * Log integration event
 */
export function logIntegration(integration: {
  service: string;
  action: string;
  success: boolean;
  duration?: number;
  error?: Error;
  details?: any;
}) {
  const level = integration.success ? "info" : "error";

  logger[level](
    {
      type: "integration_event",
      service: integration.service,
      action: integration.action,
      success: integration.success,
      duration: integration.duration,
      error: integration.error
        ? {
            message: integration.error.message,
            stack: integration.error.stack,
          }
        : undefined,
      details: integration.details,
    },
    `Integration: ${integration.service} - ${integration.action} - ${integration.success ? "SUCCESS" : "FAILED"}`,
  );
}

// Export logger instance for custom usage
export { logger };

export default {
  logger,
  createLogger,
  info,
  warn,
  error,
  debug,
  fatal,
  logRequest,
  logResponse,
  logQuery,
  logEvent,
  logSecurityEvent,
  logPerformance,
  logIntegration,
};

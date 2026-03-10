/**
 * Logivox Production Telemetry & Logging
 * Centralized structured JSON logging wrapper for Datadog / ELK / New Relic
 */
import { v4 as uuidv4 } from "uuid";

type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR" | "FATAL";

interface LogPayload {
  msg: string;
  context?: Record<string, any>;
  userId?: string;
  error?: Error | unknown;
  durationMs?: number;
}

class TelemetryLogger {
  private baseContext: Record<string, any> = {};

  constructor(private serviceName: string = "logivox-monolith") {}

  // Context appending for distributed tracing
  public withContext(ctx: Record<string, any>) {
    this.baseContext = { ...this.baseContext, ...ctx };
    return this;
  }

  private formatEntry(level: LogLevel, payload: LogPayload) {
    const traceId = payload.context?.traceId || uuidv4();
    
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      service: this.serviceName,
      traceId,
      message: payload.msg,
      ...this.baseContext,
      ...payload.context,
      userId: payload.userId,
      errorMsg: payload.error instanceof Error ? payload.error.message : payload.error,
      errorStack: payload.error instanceof Error ? payload.error.stack : undefined,
      durationMs: payload.durationMs,
    });
  }

  private write(level: LogLevel, payload: LogPayload) {
    const entry = this.formatEntry(level, payload);
    
    // In actual production, this would flush to an exporter, 
    // but stdout is standard for Docker/Kubernetes log aggregators (fluentbit/datadog-agent) 
    if (level === "ERROR" || level === "FATAL") {
      console.error(entry);
    } else if (level === "WARN") {
      console.warn(entry);
    } else {
      console.log(entry);
    }
  }

  public debug(msg: string, context?: Record<string, any>) {
    if (process.env.NODE_ENV !== "production" || process.env.DEBUG_LOGS === "true") {
      this.write("DEBUG", { msg, context });
    }
  }

  public info(msg: string, context?: Record<string, any>) {
    this.write("INFO", { msg, context });
  }

  public warn(msg: string, context?: Record<string, any>) {
    this.write("WARN", { msg, context });
  }

  public error(msg: string, error?: Error | unknown, context?: Record<string, any>) {
    this.write("ERROR", { msg, error, context });
  }

  public fatal(msg: string, error?: Error | unknown, context?: Record<string, any>) {
    this.write("FATAL", { msg, error, context });
    // Hooks for PagerDuty or Critical Alerting go here
  }
}

export const logger = new TelemetryLogger();

import { logger } from "./logger";

/**
 * Universal Error Handler for Next.js App Router (Server Actions & Route Handlers)
 * Wraps async functions to automatically catch, format, log, and classify errors.
 */
export async function withErrorBoundary<T>(
  operationName: string,
  operation: () => Promise<T>,
  context?: Record<string, any>
): Promise<{ success: true; data: T } | { success: false; error: any }> {
  const startTime = Date.now();
  try {
    const data = await operation();
    logger.info(`Operation successful: ${operationName}`, {
      ...context,
      durationMs: Date.now() - startTime,
    });
    return { success: true, data };
  } catch (error: any) {
    const durationMs = Date.now() - startTime;
    logger.error(`Operation failed: ${operationName}`, error, {
      ...context,
      durationMs,
    });
    return { success: false, error };
  }
}

import pino from "pino";

// Observability and tracing correlation
export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: [
      "req.headers.authorization",
      "password",
      "token",
      "newPassword",
      "oldPassword",
      "secret",
    ],
    censor: "[REDACTED]",
  },
});

export async function trackError(error: Error, metadata: any = {}) {
  const { logger } = await import("./logger");
  logger.error({ err: error, ...metadata }, "Application Error");
}

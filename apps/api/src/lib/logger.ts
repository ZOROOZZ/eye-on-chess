import pino from "pino";
import type { LoggerOptions } from "pino";

const isProduction = process.env.NODE_ENV === "production";

// Pino options shared between Fastify and standalone loggers
export const loggerOptions: LoggerOptions = {
  level: process.env.LOG_LEVEL || (isProduction ? "info" : "debug"),
  ...(isProduction
    ? {}
    : {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "HH:MM:ss.l",
            ignore: "pid,hostname",
          },
        },
      }),
};

// Standalone logger for non-Fastify code (worker, etc.)
export const logger = pino(loggerOptions);

export function createChildLogger(name: string) {
  return logger.child({ module: name });
}

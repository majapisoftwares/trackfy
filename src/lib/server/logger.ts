import pino from "pino";

declare global {
  var _trackfyLogger: ReturnType<typeof pino> | undefined;
}

const isDevelopment = process.env.NODE_ENV !== "production";

export const logger =
  global._trackfyLogger ??
  pino({
    level: process.env.LOG_LEVEL?.trim() || (isDevelopment ? "debug" : "info"),
    ...(isDevelopment
      ? {
          transport: {
            target: "pino-pretty",
            options: { colorize: true },
          },
        }
      : {}),
  });

if (!global._trackfyLogger) {
  global._trackfyLogger = logger;
}

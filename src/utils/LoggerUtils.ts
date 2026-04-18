import { createLogger, format, transports } from 'winston';

/**
 * LoggerUtils – replaces Java LoggerUtils (Log4j2).
 * Provides levelled logging: info, debug, warn, error, fatal.
 * Each log entry shows the caller's context using the Error stack.
 */
const logger = createLogger({
  level: 'debug',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    format.printf(({ timestamp, level, message }) => {
      const callerInfo = getCallerInfo();
      return `${timestamp} [${level.toUpperCase().padEnd(5)}] [${callerInfo}] ${message}`;
    })
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'test-output/logs/framework.log', options: { flags: 'a' } }),
  ],
});

function getCallerInfo(): string {
  const err = new Error();
  const stack = err.stack?.split('\n') ?? [];
  // Skip Error, getCallerInfo, the LoggerUtils method → index 3+
  for (let i = 3; i < stack.length; i++) {
    const line = stack[i].trim();
    if (!line.includes('LoggerUtils')) {
      const match = line.match(/at (.+?) \(/);
      return match ? match[1] : 'unknown';
    }
  }
  return 'unknown';
}

export const LoggerUtils = {
  info: (message: string): void => { logger.info(message); },
  debug: (message: string): void => { logger.debug(message); },
  warn: (message: string): void => { logger.warn(message); },
  error: (message: string, err?: unknown): void => {
    if (err instanceof Error) {
      logger.error(`${message} | ${err.message}`);
    } else {
      logger.error(message);
    }
  },
  fatal: (message: string): void => { logger.error(`[FATAL] ${message}`); },
};

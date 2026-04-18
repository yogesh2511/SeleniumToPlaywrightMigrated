import dotenv from 'dotenv';
import path from 'path';

// Load .env from the project root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Config – mirrors Java's Config.java + config.properties.
 * All values are read from environment variables (set via .env or CI).
 */
export class Config {
  static getBaseUrl(): string {
    return process.env.BASE_URL ?? 'https://www.labcorp.com';
  }

  static getBrowser(): string {
    return process.env.BROWSER ?? 'chromium';
  }

  static isHeadless(): boolean {
    return (process.env.HEADLESS ?? 'false').toLowerCase() === 'true';
  }

  static isNotificationsDisabled(): boolean {
    return (process.env.DISABLE_NOTIFICATIONS ?? 'true').toLowerCase() === 'true';
  }

  static getApiBaseUrl(): string {
    return process.env.API_BASE_URL ?? 'https://echo.free.beeceptor.com';
  }

  static getDefaultTimeout(): number {
    return parseInt(process.env.DEFAULT_TIMEOUT ?? '30000', 10);
  }

  static isDebugMode(): boolean {
    return (process.env.DEBUG ?? 'false').toLowerCase() === 'true';
  }
}

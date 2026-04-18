/**
 * AliasUtility – replaces Java AliasUtility.java.
 *
 * Provides a thread-safe (within one Cucumber scenario) key-value store
 * for storing runtime values (e.g. window handles, job titles) and
 * retrieving them in later steps.
 *
 * In Playwright/Cucumber-JS there is no multi-thread concern per scenario,
 * but the store is still scoped per-scenario via the World object.
 * This global singleton is sufficient for sequential scenario runs.
 * For parallel scenarios, use the World-scoped version instead.
 */
export class AliasUtility {
  private static readonly aliasStore: Map<string, unknown> = new Map();

  private constructor() {
    throw new Error('Utility class cannot be instantiated');
  }

  /** Store a runtime alias → value pair */
  static storeAlias(alias: string, value: unknown): void {
    AliasUtility.aliasStore.set(alias, value);
    console.log(`Alias stored: ${alias} -> ${String(value)}`);
  }

  /** Retrieve a value by alias key; returns undefined if not found */
  static getValue<T>(alias: string): T {
    const value = AliasUtility.aliasStore.get(alias);
    if (value === undefined) {
      console.warn(`Alias not found: ${alias}`);
    }
    return value as T;
  }

  /** Clear all stored aliases (call in AfterEach) */
  static clear(): void {
    AliasUtility.aliasStore.clear();
  }
}

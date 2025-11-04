/**
 * Optimized logger utility with timestamp caching
 * Caches timestamp for 100ms to reduce Date() and ISO string formatting overhead
 */

export class Logger {
  private static timestampCache: { time: number; iso: string } | null = null;
  private static CACHE_DURATION = 100; // Cache for 100ms

  constructor(private context: string) {}

  /**
   * Get cached or fresh timestamp
   */
  private getTimestamp(): string {
    const now = Date.now();

    // Use cached timestamp if within cache duration
    if (Logger.timestampCache && 
        now - Logger.timestampCache.time < Logger.CACHE_DURATION) {
      return Logger.timestampCache.iso;
    }

    // Generate new timestamp
    const iso = new Date(now).toISOString();
    Logger.timestampCache = { time: now, iso };
    return iso;
  }

  info(message: string): void {
    console.log(`[${this.getTimestamp()}] [${this.context}] INFO: ${message}`);
  }

  debug(message: string): void {
    console.log(`[${this.getTimestamp()}] [${this.context}] DEBUG: ${message}`);
  }

  warn(message: string): void {
    console.warn(`[${this.getTimestamp()}] [${this.context}] WARN: ${message}`);
  }

  error(message: string, error?: any): void {
    console.error(`[${this.getTimestamp()}] [${this.context}] ERROR: ${message}`);
    if (error) {
      console.error(error);
    }
  }

  success(message: string): void {
    console.log(`[${this.getTimestamp()}] [${this.context}] ✓ ${message}`);
  }
}


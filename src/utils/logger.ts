/**
 * Simple logger utility for tracking PDF generation progress
 */

export class Logger {
  constructor(private context: string) {}

  info(message: string): void {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${this.context}] INFO: ${message}`);
  }

  debug(message: string): void {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${this.context}] DEBUG: ${message}`);
  }

  warn(message: string): void {
    const timestamp = new Date().toISOString();
    console.warn(`[${timestamp}] [${this.context}] WARN: ${message}`);
  }

  error(message: string, error?: any): void {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] [${this.context}] ERROR: ${message}`);
    if (error) {
      console.error(error);
    }
  }

  success(message: string): void {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${this.context}] ✓ ${message}`);
  }
}


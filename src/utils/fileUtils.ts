/**
 * File utility functions
 */

import * as fs from 'fs/promises';
import * as path from 'path';

export class FileUtils {
  /**
   * Ensure directory exists, create if not
   */
  public static async ensureDirectory(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  /**
   * Generate unique output filename
   */
  public static generateOutputFilename(prefix: string = 'TREC_Report'): string {
    const timestamp = Date.now();
    const date = new Date(timestamp);
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
    return `${prefix}_${dateStr}_${timestamp}.pdf`;
  }

  /**
   * Read JSON file and parse
   */
  public static async readJSON<T>(filePath: string): Promise<T> {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  }

  /**
   * Check if file exists
   */
  public static async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get file size in MB
   */
  public static async getFileSizeMB(filePath: string): Promise<number> {
    const stats = await fs.stat(filePath);
    return stats.size / 1024 / 1024;
  }
}


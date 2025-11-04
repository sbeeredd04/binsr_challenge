/**
 * Image Cache System
 * Implements two-tier caching: memory (fast) + disk (persistent)
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import { FileUtils } from './fileUtils';
import { Logger } from './logger';

export class ImageCache {
  private memoryCache = new Map<string, Buffer>();
  private diskCacheDir = 'cache/images';
  private logger = new Logger('ImageCache');
  private maxMemoryCacheSize = 50 * 1024 * 1024; // 50MB max memory cache
  private currentMemorySize = 0;

  constructor() {
    this.initializeCache();
  }

  /**
   * Initialize cache directory
   */
  private async initializeCache(): Promise<void> {
    try {
      await FileUtils.ensureDirectory(this.diskCacheDir);
    } catch (error) {
      this.logger.warn('Failed to initialize cache directory');
    }
  }

  /**
   * Get image from cache (memory first, then disk)
   */
  public async get(url: string): Promise<Buffer | null> {
    // 1. Check memory cache (fastest)
    if (this.memoryCache.has(url)) {
      return this.memoryCache.get(url)!;
    }

    // 2. Check disk cache
    try {
      const cacheKey = this.hashUrl(url);
      const cachePath = path.join(this.diskCacheDir, cacheKey);

      if (await FileUtils.fileExists(cachePath)) {
        const buffer = await fs.readFile(cachePath);
        
        // Populate memory cache if space available
        if (this.currentMemorySize + buffer.length < this.maxMemoryCacheSize) {
          this.setMemoryCache(url, buffer);
        }
        
        return buffer;
      }
    } catch (error) {
      this.logger.debug(`Cache miss for: ${url}`);
    }

    return null;
  }

  /**
   * Set image in cache (both memory and disk)
   */
  public async set(url: string, buffer: Buffer): Promise<void> {
    // Memory cache
    this.setMemoryCache(url, buffer);

    // Disk cache (async, don't wait)
    this.setDiskCache(url, buffer).catch(error => {
      this.logger.warn(`Failed to cache image to disk: ${error.message}`);
    });
  }

  /**
   * Set in memory cache with size limit
   */
  private setMemoryCache(url: string, buffer: Buffer): void {
    // Check if we need to evict old entries
    while (this.currentMemorySize + buffer.length > this.maxMemoryCacheSize && this.memoryCache.size > 0) {
      // Evict oldest entry (first in Map)
      const firstKeyIterator = this.memoryCache.keys().next();
      if (firstKeyIterator.done) break;
      
      const firstKey = firstKeyIterator.value as string;
      const firstBuffer = this.memoryCache.get(firstKey);
      if (firstBuffer) {
        this.currentMemorySize -= firstBuffer.length;
      }
      this.memoryCache.delete(firstKey);
    }

    this.memoryCache.set(url, buffer);
    this.currentMemorySize += buffer.length;
  }

  /**
   * Set in disk cache
   */
  private async setDiskCache(url: string, buffer: Buffer): Promise<void> {
    const cacheKey = this.hashUrl(url);
    const cachePath = path.join(this.diskCacheDir, cacheKey);
    
    await FileUtils.ensureDirectory(this.diskCacheDir);
    await fs.writeFile(cachePath, buffer);
  }

  /**
   * Hash URL to create cache key
   */
  private hashUrl(url: string): string {
    return crypto
      .createHash('md5')
      .update(url)
      .digest('hex');
  }

  /**
   * Get cache statistics
   */
  public getStats(): {
    memoryCacheSize: number;
    memoryCacheEntries: number;
    memoryCacheSizeMB: number;
  } {
    return {
      memoryCacheSize: this.currentMemorySize,
      memoryCacheEntries: this.memoryCache.size,
      memoryCacheSizeMB: this.currentMemorySize / 1024 / 1024,
    };
  }

  /**
   * Clear memory cache
   */
  public clearMemory(): void {
    this.memoryCache.clear();
    this.currentMemorySize = 0;
  }

  /**
   * Clear disk cache
   */
  public async clearDisk(): Promise<void> {
    try {
      const files = await fs.readdir(this.diskCacheDir);
      for (const file of files) {
        await fs.unlink(path.join(this.diskCacheDir, file));
      }
      this.logger.info('Disk cache cleared');
    } catch (error) {
      this.logger.warn('Failed to clear disk cache');
    }
  }
}


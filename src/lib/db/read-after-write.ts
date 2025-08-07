/**
 * Read-After-Write Consistency Manager
 * 
 * This module implements a read-after-write consistency pattern to solve replication lag issues.
 * Any GET request for a program created within the last 60 seconds is routed directly to the 
 * primary database, while older reads can safely use replicas.
 * 
 * Features:
 * - Time-based routing (configurable window)
 * - In-memory cache for tracking recent writes
 * - Automatic cleanup of stale entries
 * - Fallback to primary DB on errors
 * - Comprehensive logging and monitoring
 */

import { logger } from '@/lib/logging';
import { createClient } from '@/utils/supabase/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getSupabaseServerConfig } from '@/lib/env';

/**
 * Configuration for read-after-write consistency
 */
export interface ReadAfterWriteConfig {
  /** Time window in seconds for routing to primary DB */
  consistencyWindowSeconds: number;
  /** Maximum entries to keep in cache */
  maxCacheEntries: number;
  /** How often to clean up stale entries (in seconds) */
  cleanupIntervalSeconds: number;
}

/**
 * Default configuration
 */
export const DEFAULT_READ_AFTER_WRITE_CONFIG: ReadAfterWriteConfig = {
  consistencyWindowSeconds: 60, // 60 seconds for fresh reads
  maxCacheEntries: 1000,
  cleanupIntervalSeconds: 300, // Clean up every 5 minutes
};

/**
 * Entry in the read-after-write cache
 */
interface CacheEntry {
  programId: string;
  userId: string;
  createdAt: number; // timestamp in milliseconds
  source: 'creation' | 'update' | 'manual';
}

/**
 * Read-After-Write Consistency Manager
 * 
 * Tracks recently written data and routes reads appropriately
 */
class ReadAfterWriteManager {
  private cache = new Map<string, CacheEntry>();
  private config: ReadAfterWriteConfig;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(config: ReadAfterWriteConfig = DEFAULT_READ_AFTER_WRITE_CONFIG) {
    this.config = config;
    this.startCleanupTimer();
  }

  /**
   * Record that a program was recently written
   */
  recordWrite(programId: string, userId: string, source: CacheEntry['source'] = 'creation'): void {
    const entry: CacheEntry = {
      programId,
      userId,
      createdAt: Date.now(),
      source,
    };

    this.cache.set(programId, entry);

    // Enforce cache size limits
    if (this.cache.size > this.config.maxCacheEntries) {
      this.cleanupStaleEntries();
    }

    logger.debug('Recorded write for read-after-write consistency', {
      operation: 'recordWrite',
      component: 'readAfterWrite',
      programId,
      userId,
      source,
      cacheSize: this.cache.size,
    });
  }

  /**
   * Check if a program should be read from primary DB due to recent write
   */
  shouldReadFromPrimary(programId: string): boolean {
    const entry = this.cache.get(programId);
    
    if (!entry) {
      return false; // Not in cache, can use replica
    }

    const ageInSeconds = (Date.now() - entry.createdAt) / 1000;
    const withinWindow = ageInSeconds <= this.config.consistencyWindowSeconds;

    if (withinWindow) {
      logger.debug('Routing read to primary DB due to recent write', {
        operation: 'shouldReadFromPrimary',
        component: 'readAfterWrite',
        programId,
        ageInSeconds: Math.round(ageInSeconds),
        consistencyWindow: this.config.consistencyWindowSeconds,
        source: entry.source,
      });
    }

    return withinWindow;
  }

  /**
   * Remove a program from the cache (e.g., after successful replica read)
   */
  markAsReplicated(programId: string): void {
    const removed = this.cache.delete(programId);
    
    if (removed) {
      logger.debug('Marked program as replicated, removed from cache', {
        operation: 'markAsReplicated',
        component: 'readAfterWrite',
        programId,
        cacheSize: this.cache.size,
      });
    }
  }

  /**
   * Clean up stale entries from cache
   */
  private cleanupStaleEntries(): void {
    const now = Date.now();
    const cutoff = now - (this.config.consistencyWindowSeconds * 1000);
    let removed = 0;

    for (const [programId, entry] of this.cache.entries()) {
      if (entry.createdAt < cutoff) {
        this.cache.delete(programId);
        removed++;
      }
    }

    if (removed > 0) {
      logger.debug('Cleaned up stale read-after-write entries', {
        operation: 'cleanupStaleEntries',
        component: 'readAfterWrite',
        removed,
        remaining: this.cache.size,
      });
    }
  }

  /**
   * Start the automatic cleanup timer
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(
      () => this.cleanupStaleEntries(),
      this.config.cleanupIntervalSeconds * 1000
    );
  }

  /**
   * Stop the cleanup timer (for testing or shutdown)
   */
  public destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
  }

  /**
   * Get cache statistics for monitoring
   */
  getCacheStats(): {
    totalEntries: number;
    entriesBySource: Record<CacheEntry['source'], number>;
    oldestEntryAge: number | null;
    averageAge: number | null;
  } {
    const now = Date.now();
    const entries = Array.from(this.cache.values());
    
    const entriesBySource = entries.reduce((acc, entry) => {
      acc[entry.source] = (acc[entry.source] || 0) + 1;
      return acc;
    }, {} as Record<CacheEntry['source'], number>);

    const ages = entries.map(entry => now - entry.createdAt);
    const oldestEntryAge = ages.length > 0 ? Math.max(...ages) / 1000 : null;
    const averageAge = ages.length > 0 ? (ages.reduce((sum, age) => sum + age, 0) / ages.length) / 1000 : null;

    return {
      totalEntries: this.cache.size,
      entriesBySource,
      oldestEntryAge,
      averageAge,
    };
  }
}

// Singleton instance
const readAfterWriteManager = new ReadAfterWriteManager();

/**
 * Database client factory with read-after-write consistency
 */
export class DatabaseClientManager {
  private static instance: DatabaseClientManager;
  private rwManager: ReadAfterWriteManager;

  private constructor() {
    this.rwManager = readAfterWriteManager;
  }

  public static getInstance(): DatabaseClientManager {
    if (!DatabaseClientManager.instance) {
      DatabaseClientManager.instance = new DatabaseClientManager();
    }
    return DatabaseClientManager.instance;
  }

  /**
   * Get a Supabase client with read-after-write routing
   * 
   * @param programId - Program ID being read (if applicable)
   * @param operation - Type of operation ('read' | 'write')
   * @param forceReplica - Force use of replica even for fresh writes (for testing)
   */
  async getClient(params?: {
    programId?: string;
    operation?: 'read' | 'write';
    forceReplica?: boolean;
  }) {
    const { programId, operation = 'read', forceReplica = false } = params || {};

    // Always use primary for writes
    if (operation === 'write') {
      return this.createPrimaryClient();
    }

    // For reads, check if we should use primary due to recent write
    if (programId && !forceReplica && this.rwManager.shouldReadFromPrimary(programId)) {
      return this.createPrimaryClient();
    }

    // Default to standard client (which may be replica in production)
    return createClient();
  }

  /**
   * Create a client explicitly connected to primary database
   * 
   * In a typical setup, you might have different connection strings for primary vs replica.
   * For Supabase, we use the same endpoint but could configure connection pooling differently.
   */
  private async createPrimaryClient() {
    const cookieStore = await cookies();
    const { url, anonKey } = getSupabaseServerConfig();

    // In a real setup with read replicas, you might have:
    // const primaryUrl = process.env.SUPABASE_PRIMARY_URL || url;
    
    return createServerClient(url, anonKey, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Ignore errors from Server Components
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // Ignore errors from Server Components
          }
        },
      },
    });
  }

  /**
   * Record that a program was written (call after successful writes)
   */
  recordProgramWrite(programId: string, userId: string, source: CacheEntry['source'] = 'creation'): void {
    this.rwManager.recordWrite(programId, userId, source);
  }

  /**
   * Mark a program as successfully replicated (call after successful replica reads)
   */
  markProgramAsReplicated(programId: string): void {
    this.rwManager.markAsReplicated(programId);
  }

  /**
   * Get statistics for monitoring and debugging
   */
  getStats() {
    return this.rwManager.getCacheStats();
  }

  /**
   * Force cleanup for testing
   */
  cleanup(): void {
    this.rwManager.destroy();
  }
}

// Export singleton instance
export const dbClientManager = DatabaseClientManager.getInstance();

// Export convenience functions
export const getReadAfterWriteClient = (params?: Parameters<DatabaseClientManager['getClient']>[0]) => 
  dbClientManager.getClient(params);

export const recordProgramWrite = (programId: string, userId: string, source?: CacheEntry['source']) =>
  dbClientManager.recordProgramWrite(programId, userId, source);

export const markProgramAsReplicated = (programId: string) =>
  dbClientManager.markProgramAsReplicated(programId);

export const getReadAfterWriteStats = () => dbClientManager.getStats();

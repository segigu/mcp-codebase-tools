/**
 * Cache Manager - Result caching system for MCP tools
 *
 * Features:
 * - TTL (time-to-live) per tool type
 * - Size limits (max entries)
 * - Cache invalidation
 * - File-based persistence
 * - Hit/miss statistics
 */

import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Cache entry interface
 */
export interface CacheEntry<T = any> {
  /** Cache key (hash of tool + params) */
  key: string

  /** Tool identifier */
  tool: string

  /** Cached result */
  result: T

  /** When this entry was created */
  createdAt: string

  /** When this entry expires */
  expiresAt: string

  /** Input parameters (for debugging) */
  params?: any

  /** Result size in bytes (approximate) */
  sizeBytes?: number

  /** How many times this entry was hit */
  hits: number
}

/**
 * Cache statistics
 */
export interface CacheStats {
  totalEntries: number
  totalHits: number
  totalMisses: number
  hitRate: string
  totalSizeBytes: number
  totalSizeMB: string
  entriesByTool: Record<string, number>
  oldestEntry: string | null
  newestEntry: string | null
}

/**
 * Cache configuration per tool
 */
export interface CacheConfig {
  /** TTL in milliseconds */
  ttl: number

  /** Whether caching is enabled for this tool */
  enabled: boolean
}

/**
 * Default TTL configurations (in milliseconds)
 */
const DEFAULT_TTL_CONFIG: Record<string, number> = {
  // Fast-changing data - short TTL (5 minutes)
  'gitHotspots': 5 * 60 * 1000,
  'findImports': 5 * 60 * 1000,
  'findUsages': 5 * 60 * 1000,
  'callersAnalysis': 5 * 60 * 1000,

  // Moderate-changing data - medium TTL (30 minutes)
  'securityAudit': 30 * 60 * 1000,
  'a11yAudit': 30 * 60 * 1000,
  'techDebtCalculator': 30 * 60 * 1000,
  'analyzeComplexity': 30 * 60 * 1000,
  'analyzeUnusedExports': 30 * 60 * 1000,
  'testCoverageGaps': 30 * 60 * 1000,
  'rerendersDetection': 30 * 60 * 1000,
  'stateManagementAnalysis': 30 * 60 * 1000,
  'bundleAnalysis': 30 * 60 * 1000,

  // Slow-changing data - long TTL (2 hours)
  'i18nAnalysis': 2 * 60 * 60 * 1000,
  'findComponents': 2 * 60 * 60 * 1000,
  'codeStructure': 2 * 60 * 60 * 1000,
  'componentInventory': 2 * 60 * 60 * 1000,
  'designTokens': 2 * 60 * 60 * 1000,
  'apiInventory': 2 * 60 * 60 * 1000,
  'tailwindOptimizer': 2 * 60 * 60 * 1000,

  // Default for unknown tools (15 minutes)
  'default': 15 * 60 * 1000
}

/**
 * Maximum cache size (entries)
 */
const MAX_CACHE_ENTRIES = 1000

/**
 * Maximum cache size (bytes) - 100MB
 */
const MAX_CACHE_SIZE_BYTES = 100 * 1024 * 1024

/**
 * Cache file path
 */
const CACHE_FILE_PATH = path.resolve(__dirname, '..', '..', 'docs', 'cache', 'MCP_CACHE.json')

/**
 * Statistics file path
 */
const STATS_FILE_PATH = path.resolve(__dirname, '..', '..', 'docs', 'cache', 'CACHE_STATS.json')

/**
 * In-memory cache storage
 */
let cacheStore: Map<string, CacheEntry> = new Map()

/**
 * Cache statistics
 */
let stats = {
  totalHits: 0,
  totalMisses: 0
}

/**
 * Initialize cache system
 */
export function initCache(): void {
  const cacheDir = path.dirname(CACHE_FILE_PATH)

  // Create cache directory if it doesn't exist
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true })
  }

  // Load existing cache from file
  if (fs.existsSync(CACHE_FILE_PATH)) {
    try {
      const data = fs.readFileSync(CACHE_FILE_PATH, 'utf-8')
      const parsed = JSON.parse(data)

      cacheStore = new Map(parsed.entries || [])

      // Clean expired entries on load
      cleanExpiredEntries()
    } catch (error) {
      console.warn('Failed to load cache, starting fresh:', error)
      cacheStore = new Map()
    }
  }

  // Load statistics
  if (fs.existsSync(STATS_FILE_PATH)) {
    try {
      const data = fs.readFileSync(STATS_FILE_PATH, 'utf-8')
      stats = JSON.parse(data)
    } catch (error) {
      console.warn('Failed to load cache stats:', error)
    }
  }
}

/**
 * Generate cache key from tool name and parameters
 */
export function generateCacheKey(tool: string, params: any): string {
  const normalized = {
    tool,
    params: params || {}
  }

  const hash = crypto
    .createHash('sha256')
    .update(JSON.stringify(normalized))
    .digest('hex')

  return `${tool}:${hash.substring(0, 16)}`
}

/**
 * Get cached result
 */
export function getCached<T = any>(tool: string, params: any): T | null {
  const key = generateCacheKey(tool, params)
  const entry = cacheStore.get(key)

  if (!entry) {
    stats.totalMisses++
    saveStats()
    return null
  }

  // Check if expired
  const now = new Date().toISOString()
  if (now > entry.expiresAt) {
    // Expired, remove it
    cacheStore.delete(key)
    stats.totalMisses++
    saveStats()
    saveCache()
    return null
  }

  // Cache hit!
  entry.hits++
  stats.totalHits++
  saveStats()
  saveCache()

  return entry.result as T
}

/**
 * Set cached result
 */
export function setCached<T = any>(
  tool: string,
  params: any,
  result: T,
  customTTL?: number
): void {
  const key = generateCacheKey(tool, params)
  const ttl = customTTL || DEFAULT_TTL_CONFIG[tool] || DEFAULT_TTL_CONFIG['default']

  const now = new Date()
  const expiresAt = new Date(now.getTime() + ttl)

  const resultJson = JSON.stringify(result)
  const sizeBytes = Buffer.byteLength(resultJson, 'utf-8')

  const entry: CacheEntry<T> = {
    key,
    tool,
    result,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    params,
    sizeBytes,
    hits: 0
  }

  cacheStore.set(key, entry)

  // Enforce size limits
  enforceLimit()

  saveCache()
}

/**
 * Clean expired entries
 */
function cleanExpiredEntries(): void {
  const now = new Date().toISOString()
  let removed = 0

  for (const [key, entry] of cacheStore.entries()) {
    if (now > entry.expiresAt) {
      cacheStore.delete(key)
      removed++
    }
  }

  if (removed > 0) {
    saveCache()
  }
}

/**
 * Enforce cache size limits
 */
function enforceLimit(): void {
  // Limit by number of entries
  if (cacheStore.size > MAX_CACHE_ENTRIES) {
    const entriesToRemove = cacheStore.size - MAX_CACHE_ENTRIES

    // Remove oldest entries
    const sorted = Array.from(cacheStore.entries())
      .sort((a, b) => a[1].createdAt.localeCompare(b[1].createdAt))

    for (let i = 0; i < entriesToRemove; i++) {
      cacheStore.delete(sorted[i][0])
    }
  }

  // Limit by total size
  let totalSize = 0
  for (const entry of cacheStore.values()) {
    totalSize += entry.sizeBytes || 0
  }

  if (totalSize > MAX_CACHE_SIZE_BYTES) {
    // Remove entries until under limit, starting with least-hit
    const sorted = Array.from(cacheStore.entries())
      .sort((a, b) => a[1].hits - b[1].hits)

    for (const [key, entry] of sorted) {
      if (totalSize <= MAX_CACHE_SIZE_BYTES) break
      totalSize -= entry.sizeBytes || 0
      cacheStore.delete(key)
    }
  }
}

/**
 * Clear all cache
 */
export function clearCache(tool?: string): number {
  if (tool) {
    // Clear only specific tool
    let removed = 0
    for (const [key, entry] of cacheStore.entries()) {
      if (entry.tool === tool) {
        cacheStore.delete(key)
        removed++
      }
    }
    saveCache()
    return removed
  } else {
    // Clear all
    const count = cacheStore.size
    cacheStore.clear()
    saveCache()
    return count
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats(): CacheStats {
  cleanExpiredEntries()

  const entries = Array.from(cacheStore.values())
  let totalSize = 0
  const byTool: Record<string, number> = {}

  for (const entry of entries) {
    totalSize += entry.sizeBytes || 0
    byTool[entry.tool] = (byTool[entry.tool] || 0) + 1
  }

  const totalRequests = stats.totalHits + stats.totalMisses
  const hitRate = totalRequests > 0
    ? ((stats.totalHits / totalRequests) * 100).toFixed(1)
    : '0.0'

  const oldest = entries.length > 0
    ? entries.reduce((a, b) => a.createdAt < b.createdAt ? a : b).createdAt
    : null

  const newest = entries.length > 0
    ? entries.reduce((a, b) => a.createdAt > b.createdAt ? a : b).createdAt
    : null

  return {
    totalEntries: cacheStore.size,
    totalHits: stats.totalHits,
    totalMisses: stats.totalMisses,
    hitRate: `${hitRate}%`,
    totalSizeBytes: totalSize,
    totalSizeMB: `${(totalSize / (1024 * 1024)).toFixed(2)} MB`,
    entriesByTool: byTool,
    oldestEntry: oldest,
    newestEntry: newest
  }
}

/**
 * Save cache to file
 */
function saveCache(): void {
  try {
    const data = {
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      entries: Array.from(cacheStore.entries())
    }

    fs.writeFileSync(CACHE_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8')
  } catch (error) {
    console.error('Failed to save cache:', error)
  }
}

/**
 * Save statistics to file
 */
function saveStats(): void {
  try {
    fs.writeFileSync(STATS_FILE_PATH, JSON.stringify(stats, null, 2), 'utf-8')
  } catch (error) {
    console.error('Failed to save cache stats:', error)
  }
}

/**
 * Check if caching is enabled for a tool
 */
export function isCachingEnabled(tool: string): boolean {
  // All tools have caching enabled by default
  // Can be extended to read from config file
  return true
}

/**
 * Get TTL for a tool (in milliseconds)
 */
export function getTTL(tool: string): number {
  return DEFAULT_TTL_CONFIG[tool] || DEFAULT_TTL_CONFIG['default']
}

// Initialize cache on module load
initCache()

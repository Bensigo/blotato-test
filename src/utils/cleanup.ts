import { db } from '../lib/db'
import { cleanupModerationCache } from '../lib/openai'
import { STORAGE } from '../lib/constants'

export interface CleanupStats {
  postsRemoved: number
  draftsRemoved: number
  cacheCleared: boolean
  totalSizeBefore: number
  totalSizeAfter: number
  timeMs: number
}

/**
 * Performs comprehensive cleanup of all storage and cache systems
 */
export async function performCleanup(): Promise<CleanupStats> {
  const startTime = Date.now()
  const stats = db.getStats()
  const totalSizeBefore = stats.totalSize

  // Get initial counts
  const initialPosts = stats.posts
  const initialDrafts = stats.drafts

  // Run database cleanup
  const hasChanges = db.cleanup()

  // Cleanup moderation cache
  cleanupModerationCache()

  // Get final stats
  const finalStats = db.getStats()
  const totalSizeAfter = finalStats.totalSize

  return {
    postsRemoved: initialPosts - finalStats.posts,
    draftsRemoved: initialDrafts - finalStats.drafts,
    cacheCleared: true,
    totalSizeBefore,
    totalSizeAfter,
    timeMs: Date.now() - startTime,
  }
}

/**
 * Checks if emergency cleanup is needed due to storage constraints
 */
export function needsEmergencyCleanup(): boolean {
  const stats = db.getStats()
  
  // Check if we're approaching storage limits
  const maxStorageSize = 5 * 1024 * 1024 // 5MB rough limit
  if (stats.totalSize > maxStorageSize) {
    return true
  }

  // Check if we have too many items
  if (stats.posts > STORAGE.MAX_POSTS_HISTORY * 2) {
    return true
  }

  if (stats.drafts > STORAGE.MAX_DRAFTS * 2) {
    return true
  }

  return false
}

/**
 * Performs emergency cleanup to free up storage space
 */
export async function performEmergencyCleanup(): Promise<CleanupStats> {
  const startTime = Date.now()
  const stats = db.getStats()
  const totalSizeBefore = stats.totalSize

  // Get initial counts
  const initialPosts = stats.posts
  const initialDrafts = stats.drafts

  // Aggressive cleanup - keep only recent items
  const posts = db.getPosts()
  const drafts = db.getDrafts()

  // Keep only the most recent 50% of posts
  const recentPosts = posts.slice(0, Math.floor(STORAGE.MAX_POSTS_HISTORY / 2))
  db.setPosts(recentPosts)

  // Keep only the most recent 50% of drafts
  const recentDrafts = drafts.slice(0, Math.floor(STORAGE.MAX_DRAFTS / 2))
  db.setDrafts(recentDrafts)

  // Clear all caches
  cleanupModerationCache()

  // Update cleanup timestamp
  db.setLastCleanup(Date.now())

  // Get final stats
  const finalStats = db.getStats()
  const totalSizeAfter = finalStats.totalSize

  return {
    postsRemoved: initialPosts - finalStats.posts,
    draftsRemoved: initialDrafts - finalStats.drafts,
    cacheCleared: true,
    totalSizeBefore,
    totalSizeAfter,
    timeMs: Date.now() - startTime,
  }
}

/**
 * Validates storage health and returns recommendations
 */
export function getStorageHealth(): {
  status: 'healthy' | 'warning' | 'critical'
  issues: string[]
  recommendations: string[]
  stats: ReturnType<typeof db.getStats>
} {
  const stats = db.getStats()
  const issues: string[] = []
  const recommendations: string[] = []
  
  let status: 'healthy' | 'warning' | 'critical' = 'healthy'

  // Check storage size
  const maxSize = 5 * 1024 * 1024 // 5MB
  if (stats.totalSize > maxSize * 0.9) {
    status = 'critical'
    issues.push('Storage nearly full')
    recommendations.push('Run emergency cleanup')
  } else if (stats.totalSize > maxSize * 0.7) {
    status = 'warning'
    issues.push('Storage usage high')
    recommendations.push('Consider cleaning up old data')
  }

  // Check item counts
  if (stats.posts > STORAGE.MAX_POSTS_HISTORY) {
    status = status === 'critical' ? 'critical' : 'warning'
    issues.push('Too many posts stored')
    recommendations.push('Remove old posts')
  }

  if (stats.drafts > STORAGE.MAX_DRAFTS) {
    status = status === 'critical' ? 'critical' : 'warning'
    issues.push('Too many drafts stored')
    recommendations.push('Remove old drafts')
  }

  // Check cleanup frequency
  if (stats.needsCleanup) {
    issues.push('Cleanup overdue')
    recommendations.push('Run regular cleanup')
  }

  // Check localStorage availability
  if (!db.isAvailable()) {
    status = 'critical'
    issues.push('localStorage not available')
    recommendations.push('Check browser storage settings')
  }

  return {
    status,
    issues,
    recommendations,
    stats,
  }
}

/**
 * Formats storage size for human readability
 */
export function formatStorageSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  
  const units = ['B', 'KB', 'MB', 'GB']
  const k = 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${units[i]}`
}

/**
 * Estimates how long until storage is full
 */
export function estimateStorageLifetime(): {
  daysUntilFull: number | null
  projectedUsage: number
  baselineUsage: number
} {
  const stats = db.getStats()
  const currentUsage = stats.totalSize
  
  // Get usage from a week ago (if available)
  const posts = db.getPosts()
  const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
  
  const oldPosts = posts.filter(post => 
    new Date(post.createdAt).getTime() < oneWeekAgo
  )
  
  if (oldPosts.length === 0) {
    return {
      daysUntilFull: null,
      projectedUsage: currentUsage,
      baselineUsage: currentUsage,
    }
  }

  // Rough estimation based on post count growth
  const recentPosts = posts.length - oldPosts.length
  const growthRate = recentPosts / 7 // posts per day
  
  if (growthRate <= 0) {
    return {
      daysUntilFull: null,
      projectedUsage: currentUsage,
      baselineUsage: currentUsage,
    }
  }

  // Estimate bytes per post (rough average)
  const avgBytesPerPost = currentUsage / posts.length || 1000
  const bytesPerDay = growthRate * avgBytesPerPost
  
  const maxSize = 5 * 1024 * 1024 // 5MB
  const remainingSpace = maxSize - currentUsage
  
  const daysUntilFull = remainingSpace / bytesPerDay

  return {
    daysUntilFull: Math.max(0, Math.floor(daysUntilFull)),
    projectedUsage: currentUsage + (bytesPerDay * 7), // projected usage in a week
    baselineUsage: currentUsage,
  }
} 
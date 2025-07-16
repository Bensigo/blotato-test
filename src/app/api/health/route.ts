import { NextRequest, NextResponse } from 'next/server'
import { HTTP_STATUS, APP_NAME, APP_VERSION } from '../../../lib/constants'
import { db } from '../../../lib/db'
import { getModerationCacheStats } from '../../../lib/openai'
import { getStorageHealth, performCleanup } from '../../../utils/cleanup'
import type { ApiResponse } from '../../../lib/types'

export async function GET(request?: NextRequest) {
  try {
    // Check if cleanup is requested
    const searchParams = request?.nextUrl?.searchParams
    const shouldCleanup = searchParams?.get('cleanup') === 'true'
    
    let cleanupResults = null
    
    // Perform cleanup if requested
    if (shouldCleanup) {
      try {
        // Clean up storage and cache
        const storageCleanupResult = await performCleanup()
        
        cleanupResults = {
          storage: storageCleanupResult,
          timestamp: new Date().toISOString()
        }
      } catch (cleanupError) {
        console.error('Cleanup failed:', cleanupError)
        cleanupResults = {
          error: cleanupError instanceof Error ? cleanupError.message : 'Cleanup failed'
        }
      }
    }

    // Check storage health
    const storageHealth = getStorageHealth()
    
    // Get database stats
    const dbStats = db.getStats()
    
    // Get moderation cache stats
    const moderationStats = getModerationCacheStats()
    
    // Check if localStorage is available
    const isStorageAvailable = db.isAvailable()
    
    // Calculate overall health status
    const isHealthy = storageHealth.status !== 'critical' && isStorageAvailable
    
    const healthData = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      application: {
        name: APP_NAME,
        version: APP_VERSION,
        environment: process.env.NODE_ENV || 'development',
      },
      storage: {
        available: isStorageAvailable,
        health: storageHealth.status,
        issues: storageHealth.issues,
        recommendations: storageHealth.recommendations,
        stats: {
          posts: dbStats.posts,
          drafts: dbStats.drafts,
          totalSize: dbStats.totalSize,
          lastCleanup: dbStats.lastCleanup,
          needsCleanup: dbStats.needsCleanup,
        },
      },
      moderation: {
        cacheSize: moderationStats.size,
        cacheEntries: moderationStats.entries,
        memoryUsage: moderationStats.memoryUsage,
      },
      services: {
        openai: {
          configured: !!process.env.OPENAI_API_KEY,
          status: 'unknown', // Would need to ping OpenAI API to check
        },
        twitter: {
          configured: !!(process.env.TWITTER_CLIENT_ID && process.env.TWITTER_CLIENT_SECRET),
          status: 'unknown', // Would need to ping Twitter API to check
        },
      },
      uptime: process.uptime ? Math.floor(process.uptime()) : 0,
      ...(cleanupResults && { cleanup: cleanupResults }),
    }

    return NextResponse.json(
      {
        success: true,
        data: healthData,
      } as ApiResponse,
      { 
        status: isHealthy ? HTTP_STATUS.OK : HTTP_STATUS.SERVICE_UNAVAILABLE,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    )
  } catch (error) {
    console.error('Health check error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Health check failed',
        data: {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      } as ApiResponse,
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    )
  }
} 
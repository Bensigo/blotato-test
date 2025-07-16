import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { GET } from '../route'

// Mock all dependencies
vi.mock('../../../../lib/db', () => ({
  db: {
    getStats: vi.fn(),
    isAvailable: vi.fn(),
  },
}))

vi.mock('../../../../lib/openai', () => ({
  getModerationCacheStats: vi.fn(),
}))

vi.mock('../../../../utils/cleanup', () => ({
  getStorageHealth: vi.fn(),
}))

// Import after mocking
import { db } from '../../../../lib/db'
import { getModerationCacheStats } from '../../../../lib/openai'
import { getStorageHealth } from '../../../../utils/cleanup'

describe('/api/health', () => {
  const mockDb = vi.mocked(db)
  const mockGetModerationCacheStats = vi.mocked(getModerationCacheStats)
  const mockGetStorageHealth = vi.mocked(getStorageHealth)

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Set up default mocks
    const mockStats = {
      posts: 5,
      drafts: 2,
      totalSize: 1024,
      lastCleanup: new Date(),
      needsCleanup: false,
    }
    
    mockDb.getStats.mockReturnValue(mockStats)
    mockDb.isAvailable.mockReturnValue(true)
    
    mockGetModerationCacheStats.mockReturnValue({
      size: 10,
      entries: 10,
      memoryUsage: '1KB',
    })
    
    mockGetStorageHealth.mockReturnValue({
      status: 'healthy',
      issues: [],
      recommendations: [],
      stats: mockStats,
    })
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('GET /api/health', () => {
    it('should return healthy status when all systems are operational', async () => {
      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.status).toBe('healthy')
      expect(data.data).toHaveProperty('timestamp')
      expect(data.data).toHaveProperty('application')
      expect(data.data).toHaveProperty('storage')
      expect(data.data).toHaveProperty('moderation')
      expect(data.data).toHaveProperty('services')
      expect(data.data).toHaveProperty('uptime')
    })

    it('should return application information', async () => {
      const response = await GET()
      const data = await response.json()

      expect(data.data.application).toEqual({
        name: 'Blotato',
        version: '1.0.0',
        environment: 'test',
      })
    })

    it('should return storage health information', async () => {
      const response = await GET()
      const data = await response.json()

      expect(data.data.storage).toEqual({
        available: true,
        health: 'healthy', // Changed from 'good' to 'healthy'
        issues: [],
        recommendations: [],
        stats: {
          posts: 5,
          drafts: 2,
          totalSize: 1024,
          lastCleanup: expect.any(String),
          needsCleanup: false,
        },
      })
    })

    it('should return moderation cache information', async () => {
      const response = await GET()
      const data = await response.json()

      expect(data.data.moderation).toEqual({
        cacheSize: 10,
        cacheEntries: 10,
        memoryUsage: '1KB',
      })
    })

    it('should return services configuration status', async () => {
      const response = await GET()
      const data = await response.json()

      expect(data.data.services).toEqual({
        openai: {
          configured: false, // Environment variables not available in test
          status: 'unknown',
        },
        twitter: {
          configured: false, // Environment variables not available in test  
          status: 'unknown',
        },
      })
    })

    it('should return unhealthy status when storage is critical', async () => {
      const criticalStats = {
        posts: 100,
        drafts: 50,
        totalSize: 5000000,
        lastCleanup: new Date(),
        needsCleanup: true,
      }
      
      mockGetStorageHealth.mockReturnValue({
        status: 'critical',
        issues: ['Storage full'],
        recommendations: ['Clear old data'],
        stats: criticalStats,
      })

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(503)
      expect(data.data.status).toBe('unhealthy')
      expect(data.data.storage.health).toBe('critical')
      expect(data.data.storage.issues).toEqual(['Storage full'])
      expect(data.data.storage.recommendations).toEqual(['Clear old data'])
    })

    it('should return unhealthy status when storage is unavailable', async () => {
      mockDb.isAvailable.mockReturnValue(false)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(503)
      expect(data.data.status).toBe('unhealthy')
      expect(data.data.storage.available).toBe(false)
    })

    it('should handle errors gracefully', async () => {
      mockDb.getStats.mockImplementation(() => {
        throw new Error('Database connection failed')
      })

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Health check failed')
      expect(data.data.status).toBe('unhealthy')
      expect(data.data.error).toBe('Database connection failed')
      expect(data.data).toHaveProperty('timestamp')
    })

    it('should include proper cache control headers', async () => {
      const response = await GET()

      expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate')
      expect(response.headers.get('Pragma')).toBe('no-cache')
      expect(response.headers.get('Expires')).toBe('0')
    })

    it('should handle storage warnings', async () => {
      const warningStats = {
        posts: 50,
        drafts: 25,
        totalSize: 3500000,
        lastCleanup: new Date(),
        needsCleanup: false,
      }
      
      mockGetStorageHealth.mockReturnValue({
        status: 'warning',
        issues: ['High storage usage'],
        recommendations: ['Consider cleanup'],
        stats: warningStats,
      })

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200) // Still healthy, just a warning
      expect(data.data.status).toBe('healthy')
      expect(data.data.storage.health).toBe('warning')
      expect(data.data.storage.issues).toEqual(['High storage usage'])
    })

    it('should return uptime information', async () => {
      // Mock process.uptime
      const originalUptime = process.uptime
      process.uptime = vi.fn().mockReturnValue(3600) // 1 hour

      const response = await GET()
      const data = await response.json()

      expect(data.data.uptime).toBe(3600)

      // Restore original
      process.uptime = originalUptime
    })

    it('should handle missing uptime gracefully', async () => {
      // Mock missing process.uptime
      const originalUptime = process.uptime
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (process as any).uptime

      const response = await GET()
      const data = await response.json()

      expect(data.data.uptime).toBe(0)

      // Restore original
      process.uptime = originalUptime
    })

    it('should call all health check functions', async () => {
      await GET()

      expect(mockGetStorageHealth).toHaveBeenCalledOnce()
      expect(mockDb.getStats).toHaveBeenCalledOnce()
      expect(mockGetModerationCacheStats).toHaveBeenCalledOnce()
      expect(mockDb.isAvailable).toHaveBeenCalledOnce()
    })
  })
}) 
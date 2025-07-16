import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getCategoryDisplayName, formatModerationFeedback, getModerationCacheStats, cleanupModerationCache } from '../openai'

// Mock OpenAI to avoid actual API calls
vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    moderations: {
      create: vi.fn(),
    },
  })),
}))

describe('OpenAI Utility Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getCategoryDisplayName', () => {
    it('should return human-readable names for moderation categories', () => {
      expect(getCategoryDisplayName('hate')).toBe('Hate Speech')
      expect(getCategoryDisplayName('hate/threatening')).toBe('Threatening Hate Speech')
      expect(getCategoryDisplayName('harassment')).toBe('Harassment')
      expect(getCategoryDisplayName('harassment/threatening')).toBe('Threatening Harassment')
      expect(getCategoryDisplayName('self-harm')).toBe('Self-Harm')
      expect(getCategoryDisplayName('self-harm/intent')).toBe('Self-Harm Intent')
      expect(getCategoryDisplayName('self-harm/instructions')).toBe('Self-Harm Instructions')
      expect(getCategoryDisplayName('sexual')).toBe('Sexual Content')
      expect(getCategoryDisplayName('sexual/minors')).toBe('Sexual Content Involving Minors')
      expect(getCategoryDisplayName('violence')).toBe('Violence')
      expect(getCategoryDisplayName('violence/graphic')).toBe('Graphic Violence')
    })

    it('should return the original category for unknown categories', () => {
      expect(getCategoryDisplayName('unknown-category')).toBe('unknown-category')
      expect(getCategoryDisplayName('')).toBe('')
    })

    it('should handle undefined and null gracefully', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(getCategoryDisplayName(undefined as any)).toBe(undefined)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(getCategoryDisplayName(null as any)).toBe(null)
    })
  })

  describe('formatModerationFeedback', () => {
    it('should return success message for allowed content', () => {
      const feedback = formatModerationFeedback([], true)
      expect(feedback).toBe('Content passed moderation checks.')
    })

    it('should return generic message for flagged content without categories', () => {
      const feedback = formatModerationFeedback([], false)
      expect(feedback).toBe('Content flagged by moderation system.')
    })

    it('should return specific feedback for single flagged category', () => {
      const feedback = formatModerationFeedback(['hate'], false)
      expect(feedback).toBe('Content flagged for: Hate Speech. Please revise your post.')
    })

    it('should return feedback for multiple flagged categories', () => {
      const feedback = formatModerationFeedback(['hate', 'harassment'], false)
      expect(feedback).toBe('Content flagged for: Hate Speech, Harassment. Please revise your post.')
    })

    it('should handle complex category combinations', () => {
      const categories = ['hate/threatening', 'violence/graphic', 'sexual']
      const feedback = formatModerationFeedback(categories, false)
      expect(feedback).toBe('Content flagged for: Threatening Hate Speech, Graphic Violence, Sexual Content. Please revise your post.')
    })

    it('should handle unknown categories in feedback', () => {
      const feedback = formatModerationFeedback(['unknown-category'], false)
      expect(feedback).toBe('Content flagged for: unknown-category. Please revise your post.')
    })

    it('should handle empty string categories', () => {
      const feedback = formatModerationFeedback([''], false)
      expect(feedback).toBe('Content flagged for: . Please revise your post.')
    })
  })

  describe('getModerationCacheStats', () => {
    it('should return cache statistics', () => {
      const stats = getModerationCacheStats()
      
      expect(stats).toHaveProperty('size')
      expect(stats).toHaveProperty('entries')
      expect(stats).toHaveProperty('memoryUsage')
      
      expect(typeof stats.size).toBe('number')
      expect(typeof stats.entries).toBe('number')
      expect(typeof stats.memoryUsage).toBe('string')
      
      expect(stats.size).toBeGreaterThanOrEqual(0)
      expect(stats.entries).toBeGreaterThanOrEqual(0)
      expect(stats.memoryUsage).toMatch(/\d+KB/)
    })

    it('should return consistent size and entries', () => {
      const stats = getModerationCacheStats()
      expect(stats.size).toBe(stats.entries)
    })
  })

  describe('cleanupModerationCache', () => {
    it('should execute without throwing errors', () => {
      expect(() => cleanupModerationCache()).not.toThrow()
    })

    it('should be callable multiple times', () => {
      expect(() => {
        cleanupModerationCache()
        cleanupModerationCache()
        cleanupModerationCache()
      }).not.toThrow()
    })
  })

  describe('Function Integration', () => {
    it('should work together for complete moderation workflow', () => {
      // Test the utility functions work together
      const categories = ['hate', 'harassment']
      const displayNames = categories.map(getCategoryDisplayName)
      const feedback = formatModerationFeedback(categories, false)
      
      expect(displayNames).toEqual(['Hate Speech', 'Harassment'])
      expect(feedback).toContain('Hate Speech')
      expect(feedback).toContain('Harassment')
    })

    it('should handle edge cases gracefully', () => {
      // Test with edge case inputs
      const feedback1 = formatModerationFeedback([], true)
      const feedback2 = formatModerationFeedback(['unknown'], false)
      const stats = getModerationCacheStats()
      
      expect(feedback1).toBeTruthy()
      expect(feedback2).toBeTruthy()
      expect(stats).toBeTruthy()
    })
  })
}) 
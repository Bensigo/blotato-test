import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '../moderate/route'

// Mock the entire OpenAI module first
vi.mock('../../../lib/openai', () => ({
  moderateContent: vi.fn(),
}))

// Import after mocking
import { moderateContent } from '../../../lib/openai'

describe('/api/moderate', () => {
  const mockModerateContent = vi.mocked(moderateContent)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  const createMockRequest = (body: Record<string, unknown>) => {
    return new NextRequest('http://localhost:3000/api/moderate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
  }

  describe('Clean Content', () => {
    it('should allow clean content', async () => {
      const cleanContent = 'I love coding and building amazing applications!'
      
      mockModerateContent.mockResolvedValue({
        isAllowed: true,
        moderationResult: {
          id: 'modr-test-clean',
          model: 'omni-moderation-latest',
          results: [{
            flagged: false,
            categories: {
              hate: false,
              'hate/threatening': false,
              harassment: false,
              'harassment/threatening': false,
              'self-harm': false,
              'self-harm/intent': false,
              'self-harm/instructions': false,
              sexual: false,
              'sexual/minors': false,
              violence: false,
              'violence/graphic': false,
            },
            category_scores: {
              hate: 0.001,
              'hate/threatening': 0.0001,
              harassment: 0.002,
              'harassment/threatening': 0.0001,
              'self-harm': 0.001,
              'self-harm/intent': 0.0005,
              'self-harm/instructions': 0.0001,
              sexual: 0.001,
              'sexual/minors': 0.0001,
              violence: 0.002,
              'violence/graphic': 0.0001,
            },
          }],
        },
        flaggedCategories: [],
        confidenceScore: 0.002,
      })

      const request = createMockRequest({ content: cleanContent })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.isAllowed).toBe(true)
      expect(data.data.flaggedCategories).toEqual([])
      expect(mockModerateContent).toHaveBeenCalledWith(cleanContent)
    })
  })

  describe('Hate Speech Detection', () => {
    it('should block obvious hate speech with high confidence', async () => {
      const hateContent = 'I hate all people from that group'
      
      mockModerateContent.mockResolvedValue({
        isAllowed: false,
        moderationResult: {
          id: 'modr-test-hate',
          model: 'omni-moderation-latest',
          results: [{
            flagged: true,
            categories: {
              hate: true,
              'hate/threatening': false,
              harassment: false,
              'harassment/threatening': false,
              'self-harm': false,
              'self-harm/intent': false,
              'self-harm/instructions': false,
              sexual: false,
              'sexual/minors': false,
              violence: false,
              'violence/graphic': false,
            },
            category_scores: {
              hate: 0.85,
              'hate/threatening': 0.02,
              harassment: 0.15,
              'harassment/threatening': 0.01,
              'self-harm': 0.01,
              'self-harm/intent': 0.005,
              'self-harm/instructions': 0.001,
              sexual: 0.01,
              'sexual/minors': 0.001,
              violence: 0.05,
              'violence/graphic': 0.01,
            },
          }],
        },
        flaggedCategories: ['hate'],
        confidenceScore: 0.85,
      })

      const request = createMockRequest({ content: hateContent })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.isAllowed).toBe(false)
      expect(data.data.flaggedCategories).toContain('hate')
      expect(data.data.confidenceScore).toBeGreaterThan(0.05)
    })

    it('should block subtle hate speech with new sensitive threshold', async () => {
      const subtleHateContent = 'I hate everyone'
      
      mockModerateContent.mockResolvedValue({
        isAllowed: false,
        moderationResult: {
          id: 'modr-test-subtle',
          model: 'omni-moderation-latest',
          results: [{
            flagged: false,
            categories: {
              hate: false,
              'hate/threatening': false,
              harassment: false,
              'harassment/threatening': false,
              'self-harm': false,
              'self-harm/intent': false,
              'self-harm/instructions': false,
              sexual: false,
              'sexual/minors': false,
              violence: false,
              'violence/graphic': false,
            },
            category_scores: {
              hate: 0.001,
              'hate/threatening': 0.0001,
              harassment: 0.14, // Above high sensitivity threshold (0.05)
              'harassment/threatening': 0.001,
              'self-harm': 0.001,
              'self-harm/intent': 0.0005,
              'self-harm/instructions': 0.0001,
              sexual: 0.001,
              'sexual/minors': 0.0001,
              violence: 0.002,
              'violence/graphic': 0.0001,
            },
          }],
        },
        flaggedCategories: ['harassment'],
        confidenceScore: 0.14,
      })

      const request = createMockRequest({ content: subtleHateContent })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.isAllowed).toBe(false)
      expect(data.data.flaggedCategories).toContain('harassment')
      expect(data.data.confidenceScore).toBeGreaterThan(0.05)
    })
  })

  describe('Harassment Detection', () => {
    it('should block direct harassment', async () => {
      const harassmentContent = 'You are stupid and worthless'
      
      mockModerateContent.mockResolvedValue({
        isAllowed: false,
        moderationResult: {
          id: 'modr-test-harassment',
          model: 'omni-moderation-latest',
          results: [{
            flagged: false,
            categories: {
              hate: false,
              'hate/threatening': false,
              harassment: false,
              'harassment/threatening': false,
              'self-harm': false,
              'self-harm/intent': false,
              'self-harm/instructions': false,
              sexual: false,
              'sexual/minors': false,
              violence: false,
              'violence/graphic': false,
            },
            category_scores: {
              hate: 0.05,
              'hate/threatening': 0.001,
              harassment: 0.75,
              'harassment/threatening': 0.1,
              'self-harm': 0.01,
              'self-harm/intent': 0.005,
              'self-harm/instructions': 0.001,
              sexual: 0.01,
              'sexual/minors': 0.001,
              violence: 0.05,
              'violence/graphic': 0.01,
            },
          }],
        },
        flaggedCategories: ['harassment'],
        confidenceScore: 0.75,
      })

      const request = createMockRequest({ content: harassmentContent })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.isAllowed).toBe(false)
      expect(data.data.flaggedCategories).toContain('harassment')
    })
  })

  describe('Violence and Self-Harm Detection', () => {
    it('should block violent content with standard threshold', async () => {
      const violentContent = 'I want to hurt someone badly'
      
      mockModerateContent.mockResolvedValue({
        isAllowed: false,
        moderationResult: {
          id: 'modr-test-violence',
          model: 'omni-moderation-latest',
          results: [{
            flagged: false,
            categories: {
              hate: false,
              'hate/threatening': false,
              harassment: false,
              'harassment/threatening': false,
              'self-harm': false,
              'self-harm/intent': false,
              'self-harm/instructions': false,
              sexual: false,
              'sexual/minors': false,
              violence: false,
              'violence/graphic': false,
            },
            category_scores: {
              hate: 0.01,
              'hate/threatening': 0.001,
              harassment: 0.05,
              'harassment/threatening': 0.01,
              'self-harm': 0.02,
              'self-harm/intent': 0.01,
              'self-harm/instructions': 0.001,
              sexual: 0.01,
              'sexual/minors': 0.001,
              violence: 0.65, // Above standard threshold (0.1)
              'violence/graphic': 0.15,
            },
          }],
        },
        flaggedCategories: ['violence', 'violence/graphic'],
        confidenceScore: 0.65,
      })

      const request = createMockRequest({ content: violentContent })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.isAllowed).toBe(false)
      expect(data.data.flaggedCategories).toContain('violence')
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty content', async () => {
      const request = createMockRequest({ content: '' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('String must contain at least 1 character(s)')
    })

    it('should handle missing content field', async () => {
      const request = createMockRequest({})
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Required')
    })

    it('should handle OpenAI API errors gracefully', async () => {
      // Mock the function to reject with a specific error message that gets logged but handled
      mockModerateContent.mockRejectedValue(new Error('OpenAI API connection failed'))

      const request = createMockRequest({ content: 'Test content' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBeDefined()
      expect(data.error).toContain('OpenAI API error')
    })
  })

  describe('Model and Response Format', () => {
    it('should use omni-moderation-latest model', async () => {
      mockModerateContent.mockResolvedValue({
        isAllowed: true,
        moderationResult: {
          id: 'modr-test',
          model: 'omni-moderation-latest',
          results: [],
        },
        flaggedCategories: [],
        confidenceScore: 0.01,
      })

      const request = createMockRequest({ content: 'Test content' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.moderationResult.model).toBe('omni-moderation-latest')
    })

    it('should return proper response structure', async () => {
      mockModerateContent.mockResolvedValue({
        isAllowed: true,
        moderationResult: {
          id: 'modr-test',
          model: 'omni-moderation-latest',
          results: [],
        },
        flaggedCategories: [],
        confidenceScore: 0.01,
      })

      const request = createMockRequest({ content: 'Test content' })
      const response = await POST(request)
      const data = await response.json()

      expect(data).toHaveProperty('success')
      expect(data).toHaveProperty('data')
      expect(data.data).toHaveProperty('isAllowed')
      expect(data.data).toHaveProperty('flaggedCategories')
      expect(data.data).toHaveProperty('confidenceScore')
      expect(data.data).toHaveProperty('moderationResult')
      expect(data.data.moderationResult).toHaveProperty('id')
      expect(data.data.moderationResult).toHaveProperty('model')
      expect(data.data.moderationResult).toHaveProperty('results')
    })
  })
}) 
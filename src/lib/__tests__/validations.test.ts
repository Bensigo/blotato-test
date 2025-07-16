import { describe, it, expect } from 'vitest'
import {
  createPostSchema,
  postSchema,
  moderatePostRequestSchema,
  twitterUserSchema,
  userSchema,
  apiResponseSchema,
  draftSchema,
  MAX_POST_LENGTH,
  MIN_POST_LENGTH,
  MODERATION_CONFIDENCE_THRESHOLD,
} from '../validations'

describe('Validations', () => {
  describe('Constants', () => {
    it('should export correct validation constants', () => {
      expect(MAX_POST_LENGTH).toBe(280)
      expect(MIN_POST_LENGTH).toBe(1)
      expect(MODERATION_CONFIDENCE_THRESHOLD).toBe(0.1)
    })
  })

  describe('createPostSchema', () => {
    it('should validate valid post content', () => {
      const validPost = { content: 'This is a valid post' }
      const result = createPostSchema.safeParse(validPost)
      
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validPost)
      }
    })

    it('should trim whitespace from content', () => {
      const postWithWhitespace = { content: '  This has spaces  ' }
      const result = createPostSchema.safeParse(postWithWhitespace)
      
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.content).toBe('This has spaces')
      }
    })

    it('should reject empty content', () => {
      const emptyPost = { content: '' }
      const result = createPostSchema.safeParse(emptyPost)
      
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Post cannot be empty')
      }
    })

    it('should reject content that is too long', () => {
      const longContent = 'a'.repeat(MAX_POST_LENGTH + 1)
      const longPost = { content: longContent }
      const result = createPostSchema.safeParse(longPost)
      
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toBe(`Post cannot exceed ${MAX_POST_LENGTH} characters`)
      }
    })

    it('should accept content at maximum length', () => {
      const maxContent = 'a'.repeat(MAX_POST_LENGTH)
      const maxPost = { content: maxContent }
      const result = createPostSchema.safeParse(maxPost)
      
      expect(result.success).toBe(true)
    })

    it('should reject missing content field', () => {
      const invalidPost = {}
      const result = createPostSchema.safeParse(invalidPost)
      
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].code).toBe('invalid_type')
      }
    })

    it('should reject non-string content', () => {
      const invalidPost = { content: 123 }
      const result = createPostSchema.safeParse(invalidPost)
      
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].code).toBe('invalid_type')
      }
    })
  })

  describe('moderatePostRequestSchema', () => {
    it('should validate valid moderation request', () => {
      const validRequest = { content: 'Test content for moderation' }
      const result = moderatePostRequestSchema.safeParse(validRequest)
      
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validRequest)
      }
    })

    it('should reject empty content for moderation', () => {
      const emptyRequest = { content: '' }
      const result = moderatePostRequestSchema.safeParse(emptyRequest)
      
      expect(result.success).toBe(false)
    })

    it('should reject missing content for moderation', () => {
      const invalidRequest = {}
      const result = moderatePostRequestSchema.safeParse(invalidRequest)
      
      expect(result.success).toBe(false)
    })
  })

  describe('twitterUserSchema', () => {
    it('should validate valid Twitter user', () => {
      const validUser = {
        id: '123456789',
        username: 'testuser',
        name: 'Test User',
        profile_image_url: 'https://example.com/avatar.jpg'
      }
      const result = twitterUserSchema.safeParse(validUser)
      
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validUser)
      }
    })

    it('should accept optional profile_image_url', () => {
      const userWithoutAvatar = {
        id: '123456789',
        username: 'testuser',
        name: 'Test User'
      }
      const result = twitterUserSchema.safeParse(userWithoutAvatar)
      
      expect(result.success).toBe(true)
    })

    it('should reject missing required fields', () => {
      const incompleteUser = {
        id: '123456789'
        // Missing username and name
      }
      const result = twitterUserSchema.safeParse(incompleteUser)
      
      expect(result.success).toBe(false)
    })

    it('should validate URL format for profile image', () => {
      const userWithInvalidUrl = {
        id: '123456789',
        username: 'testuser',
        name: 'Test User',
        profile_image_url: 'not-a-url'
      }
      const result = twitterUserSchema.safeParse(userWithInvalidUrl)
      
      expect(result.success).toBe(false)
    })
  })

  describe('userSchema', () => {
    it('should validate basic user data', () => {
      const validUser = {
        id: 'user123',
        email: 'test@example.com',
        name: 'Test User'
      }
      const result = userSchema.safeParse(validUser)
      
      expect(result.success).toBe(true)
    })

    it('should reject invalid email format', () => {
      const userWithBadEmail = {
        id: 'user123',
        email: 'not-an-email',
        name: 'Test User'
      }
      const result = userSchema.safeParse(userWithBadEmail)
      
      expect(result.success).toBe(false)
    })
  })

  describe('apiResponseSchema', () => {
    it('should validate successful API response', () => {
      const successResponse = {
        success: true,
        data: { message: 'Success' }
      }
      const result = apiResponseSchema.safeParse(successResponse)
      
      expect(result.success).toBe(true)
    })

    it('should validate error API response', () => {
      const errorResponse = {
        success: false,
        error: 'Something went wrong'
      }
      const result = apiResponseSchema.safeParse(errorResponse)
      
      expect(result.success).toBe(true)
    })
  })

  describe('draftSchema', () => {
    it('should validate draft with all fields', () => {
      const validDraft = {
        id: '550e8400-e29b-41d4-a716-446655440000', // Valid UUID
        content: 'Draft content',
        createdAt: new Date(),
        updatedAt: new Date()
      }
      const result = draftSchema.safeParse(validDraft)
      
      expect(result.success).toBe(true)
    })

    it('should reject draft with invalid dates', () => {
      const draftWithBadDates = {
        id: 'draft123',
        content: 'Draft content',
        createdAt: 'not-a-date',
        updatedAt: 'not-a-date'
      }
      const result = draftSchema.safeParse(draftWithBadDates)
      
      expect(result.success).toBe(false)
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle null and undefined values', () => {
      expect(createPostSchema.safeParse(null).success).toBe(false)
      expect(createPostSchema.safeParse(undefined).success).toBe(false)
    })

    it('should handle array instead of object', () => {
      expect(createPostSchema.safeParse([]).success).toBe(false)
      expect(twitterUserSchema.safeParse([]).success).toBe(false)
    })

    it('should handle string instead of object', () => {
      expect(userSchema.safeParse('not-an-object').success).toBe(false)
      expect(draftSchema.safeParse('not-an-object').success).toBe(false)
    })

    it('should handle deeply nested validation errors', () => {
      const postWithBadNestedData = {
        id: 'not-a-uuid', // Invalid UUID
        content: 'Test post content',
        userId: 'user123',
        createdAt: new Date(),
        updatedAt: new Date(),
        moderationResult: {
          id: 'mod-123',
          model: 'omni-moderation-latest',
          results: [{
            flagged: 'not-a-boolean', // Invalid type
            categories: {
              hate: false,
              // Missing other required categories will cause errors
            },
            category_scores: {
              hate: 'not-a-number', // Invalid type
              // Missing other required scores will cause errors
            },
          }],
        },
      }
      const result = postSchema.safeParse(postWithBadNestedData)
      
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors.length).toBeGreaterThan(0)
      }
    })
  })

  describe('Schema Composition', () => {
    it('should use createPostSchema within other schemas', () => {
      // Test that createPostSchema is properly composed
      const validContent = 'Valid post content'
      const createResult = createPostSchema.safeParse({ content: validContent })
      
      expect(createResult.success).toBe(true)
      
      // Verify it's consistent with validation rules
      if (createResult.success) {
        expect(createResult.data.content.length).toBeLessThanOrEqual(MAX_POST_LENGTH)
        expect(createResult.data.content.length).toBeGreaterThanOrEqual(MIN_POST_LENGTH)
      }
    })

    it('should consistently validate Twitter user across schemas', () => {
      const twitterUser = {
        id: '123456789',
        username: 'testuser',
        name: 'Test User',
        profile_image_url: 'https://example.com/avatar.jpg'
      }
      
      // Should be valid for twitterUserSchema
      const userResult = twitterUserSchema.safeParse(twitterUser)
      expect(userResult.success).toBe(true)
    })

    it('should validate moderation request consistency', () => {
      const content = 'Test content for moderation'
      
      // Should be valid for both createPostSchema and moderatePostRequestSchema
      const createResult = createPostSchema.safeParse({ content })
      const moderateResult = moderatePostRequestSchema.safeParse({ content })
      
      expect(createResult.success).toBe(true)
      expect(moderateResult.success).toBe(true)
    })
  })
}) 
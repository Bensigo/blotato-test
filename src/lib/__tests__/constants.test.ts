import { describe, it, expect } from 'vitest'
import {
  HTTP_STATUS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  LOADING_MESSAGES,
  POST_LIMITS,
  MODERATION,
  API,
  UI,
  STORAGE,
  STORAGE_KEYS,
  TWITTER,
  AUTH,
  PATTERNS,
} from '../constants'

describe('Constants', () => {
  describe('HTTP_STATUS', () => {
    it('should have correct HTTP status codes', () => {
      expect(HTTP_STATUS.OK).toBe(200)
      expect(HTTP_STATUS.CREATED).toBe(201)
      expect(HTTP_STATUS.BAD_REQUEST).toBe(400)
      expect(HTTP_STATUS.UNAUTHORIZED).toBe(401)
      expect(HTTP_STATUS.FORBIDDEN).toBe(403)
      expect(HTTP_STATUS.NOT_FOUND).toBe(404)
      expect(HTTP_STATUS.METHOD_NOT_ALLOWED).toBe(405)
      expect(HTTP_STATUS.CONFLICT).toBe(409)
      expect(HTTP_STATUS.TOO_MANY_REQUESTS).toBe(429)
      expect(HTTP_STATUS.INTERNAL_SERVER_ERROR).toBe(500)
      expect(HTTP_STATUS.SERVICE_UNAVAILABLE).toBe(503)
    })
  })

  describe('ERROR_MESSAGES', () => {
    it('should have all required error messages', () => {
      expect(ERROR_MESSAGES.NETWORK_ERROR).toBe('Network error occurred. Please check your connection and try again.')
      expect(ERROR_MESSAGES.RATE_LIMIT_EXCEEDED).toBe('Rate limit exceeded. Please wait before making another request.')
      expect(ERROR_MESSAGES.INVALID_CREDENTIALS).toBe('Invalid credentials. Please log in again.')
      expect(ERROR_MESSAGES.POST_TOO_LONG).toContain('280 characters')
      expect(ERROR_MESSAGES.POST_EMPTY).toBe('Post cannot be empty.')
      expect(ERROR_MESSAGES.MODERATION_FAILED).toBe('Content moderation failed. Please try again.')
      expect(ERROR_MESSAGES.TWITTER_API_ERROR).toBe('Twitter API error. Please try again later.')
      expect(ERROR_MESSAGES.OPENAI_API_ERROR).toBe('OpenAI API error. Please try again later.')
      expect(ERROR_MESSAGES.GENERIC_ERROR).toBe('An unexpected error occurred. Please try again.')
      expect(ERROR_MESSAGES.TOKEN_EXPIRED).toBe('Your session has expired. Please log in again.')
      expect(ERROR_MESSAGES.STORAGE_FULL).toBe('Storage is full. Please clear some data and try again.')
    })

    it('should have meaningful error messages', () => {
      Object.values(ERROR_MESSAGES).forEach(message => {
        expect(typeof message).toBe('string')
        expect(message.length).toBeGreaterThan(0)
        expect(message.trim()).toBe(message) // No leading/trailing whitespace
      })
    })
  })

  describe('SUCCESS_MESSAGES', () => {
    it('should have all success messages', () => {
      expect(SUCCESS_MESSAGES.POST_CREATED).toBe('Post created successfully!')
      expect(SUCCESS_MESSAGES.POST_POSTED).toBe('Post published to Twitter successfully!')
      expect(SUCCESS_MESSAGES.DRAFT_SAVED).toBe('Draft saved successfully!')
      expect(SUCCESS_MESSAGES.LOGIN_SUCCESS).toBe('Logged in successfully!')
      expect(SUCCESS_MESSAGES.LOGOUT_SUCCESS).toBe('Logged out successfully!')
    })
  })

  describe('LOADING_MESSAGES', () => {
    it('should have all loading messages', () => {
      expect(LOADING_MESSAGES.AUTHENTICATING).toBe('Authenticating...')
      expect(LOADING_MESSAGES.POSTING).toBe('Publishing post...')
      expect(LOADING_MESSAGES.MODERATING).toBe('Checking content...')
      expect(LOADING_MESSAGES.SAVING).toBe('Saving draft...')
      expect(LOADING_MESSAGES.LOADING).toBe('Loading...')
    })
  })

  describe('POST_LIMITS', () => {
    it('should have correct post limits', () => {
      expect(POST_LIMITS.MAX_LENGTH).toBe(280)
      expect(POST_LIMITS.MIN_LENGTH).toBe(1)
      expect(POST_LIMITS.WARNING_THRESHOLD).toBe(70)
      expect(POST_LIMITS.DANGER_THRESHOLD).toBe(90)
    })

    it('should have valid percentage thresholds', () => {
      expect(POST_LIMITS.WARNING_THRESHOLD).toBeLessThan(100)
      expect(POST_LIMITS.DANGER_THRESHOLD).toBeLessThan(100)
      expect(POST_LIMITS.DANGER_THRESHOLD).toBeGreaterThan(POST_LIMITS.WARNING_THRESHOLD)
    })
  })

  describe('TWITTER', () => {
    it('should have correct Twitter configuration', () => {
      expect(Array.isArray(TWITTER.SCOPES)).toBe(true)
      expect(TWITTER.SCOPES).toContain('tweet.read')
      expect(TWITTER.SCOPES).toContain('tweet.write')
      expect(TWITTER.SCOPES).toContain('users.read')
      expect(TWITTER.SCOPES).toContain('offline.access')
      expect(TWITTER.SCOPES.length).toBe(4)
      expect(TWITTER.API_VERSION).toBe('2')
      expect(TWITTER.BASE_URL).toBe('https://api.twitter.com')
    })
  })

  describe('MODERATION', () => {
    it('should have correct moderation configuration', () => {
      expect(MODERATION.MODEL).toBe('omni-moderation-latest')
      expect(MODERATION.CONFIDENCE_THRESHOLD).toBe(0.1)
      expect(MODERATION.HIGH_SENSITIVITY_THRESHOLD).toBe(0.05)
      expect(MODERATION.CACHE_TTL_HOURS).toBe(1)
    })

    it('should have valid confidence thresholds', () => {
      expect(MODERATION.CONFIDENCE_THRESHOLD).toBeGreaterThan(0)
      expect(MODERATION.CONFIDENCE_THRESHOLD).toBeLessThan(1)
      expect(MODERATION.HIGH_SENSITIVITY_THRESHOLD).toBeGreaterThan(0)
      expect(MODERATION.HIGH_SENSITIVITY_THRESHOLD).toBeLessThan(MODERATION.CONFIDENCE_THRESHOLD)
    })

    it('should have high sensitivity categories', () => {
      expect(Array.isArray(MODERATION.HIGH_SENSITIVITY_CATEGORIES)).toBe(true)
      expect(MODERATION.HIGH_SENSITIVITY_CATEGORIES).toContain('hate')
      expect(MODERATION.HIGH_SENSITIVITY_CATEGORIES).toContain('hate/threatening')
      expect(MODERATION.HIGH_SENSITIVITY_CATEGORIES).toContain('harassment')
      expect(MODERATION.HIGH_SENSITIVITY_CATEGORIES).toContain('harassment/threatening')
    })

    it('should have all moderation categories', () => {
      const expectedCategories = [
        'hate',
        'hate/threatening', 
        'harassment',
        'harassment/threatening',
        'self-harm',
        'self-harm/intent',
        'self-harm/instructions',
        'sexual',
        'sexual/minors',
        'violence',
        'violence/graphic',
      ]
      expect(MODERATION.CATEGORIES).toEqual(expectedCategories)
    })
  })

  describe('API', () => {
    it('should have valid API configuration', () => {
      expect(typeof API.TIMEOUT_MS).toBe('number')
      expect(API.TIMEOUT_MS).toBeGreaterThan(0)
      expect(typeof API.OPENAI_TIMEOUT_MS).toBe('number')
      expect(API.OPENAI_TIMEOUT_MS).toBeGreaterThan(0)
      expect(typeof API.TWITTER_TIMEOUT_MS).toBe('number')
      expect(API.TWITTER_TIMEOUT_MS).toBeGreaterThan(0)
      expect(typeof API.RETRY_ATTEMPTS).toBe('number')
      expect(API.RETRY_ATTEMPTS).toBeGreaterThan(0)
      expect(typeof API.RETRY_DELAY_MS).toBe('number')
      expect(API.RETRY_DELAY_MS).toBeGreaterThan(0)
    })

    it('should have reasonable timeout values', () => {
      expect(API.TIMEOUT_MS).toBeLessThan(60000) // Less than 1 minute
      expect(API.OPENAI_TIMEOUT_MS).toBeLessThan(60000)
      expect(API.TWITTER_TIMEOUT_MS).toBeLessThan(60000)
    })
  })

  describe('UI', () => {
    it('should have valid UI configuration', () => {
      expect(typeof UI.DEBOUNCE_MS).toBe('number')
      expect(UI.DEBOUNCE_MS).toBeGreaterThan(0)
      expect(typeof UI.TOAST_DURATION_MS).toBe('number')
      expect(UI.TOAST_DURATION_MS).toBeGreaterThan(0)
      expect(typeof UI.ANIMATION_DURATION_MS).toBe('number')
      expect(UI.ANIMATION_DURATION_MS).toBeGreaterThan(0)
    })

    it('should have reasonable UI timing values', () => {
      expect(UI.DEBOUNCE_MS).toBeLessThan(5000) // Less than 5 seconds
      expect(UI.TOAST_DURATION_MS).toBeLessThan(10000) // Less than 10 seconds
      expect(UI.ANIMATION_DURATION_MS).toBeLessThan(2000) // Less than 2 seconds
    })

    it('should have valid breakpoints', () => {
      expect(UI.BREAKPOINTS.MOBILE).toBeLessThan(UI.BREAKPOINTS.TABLET)
      expect(UI.BREAKPOINTS.TABLET).toBeLessThan(UI.BREAKPOINTS.DESKTOP)
      expect(UI.BREAKPOINTS.DESKTOP).toBeLessThan(UI.BREAKPOINTS.WIDE)
    })
  })

  describe('STORAGE', () => {
    it('should have valid storage configuration', () => {
      expect(typeof STORAGE.CLEANUP_INTERVAL_MINUTES).toBe('number')
      expect(STORAGE.CLEANUP_INTERVAL_MINUTES).toBeGreaterThan(0)
      expect(typeof STORAGE.MAX_DRAFTS).toBe('number')
      expect(STORAGE.MAX_DRAFTS).toBeGreaterThan(0)
      expect(typeof STORAGE.MAX_POSTS_HISTORY).toBe('number')
      expect(STORAGE.MAX_POSTS_HISTORY).toBeGreaterThan(0)
      expect(typeof STORAGE.EXPIRY_HOURS).toBe('number')
      expect(STORAGE.EXPIRY_HOURS).toBeGreaterThan(0)
    })
  })

  describe('STORAGE_KEYS', () => {
    it('should have all required storage keys', () => {
      expect(STORAGE_KEYS.POSTS).toBeDefined()
      expect(STORAGE_KEYS.DRAFTS).toBeDefined()
      expect(STORAGE_KEYS.USER_PREFERENCES).toBeDefined()
      expect(STORAGE_KEYS.SESSION_STATE).toBeDefined()
      expect(STORAGE_KEYS.MODERATION_CACHE).toBeDefined()
      expect(STORAGE_KEYS.RATE_LIMIT).toBeDefined()
      expect(STORAGE_KEYS.LAST_CLEANUP).toBeDefined()
    })

    it('should have consistent naming pattern', () => {
      Object.values(STORAGE_KEYS).forEach(key => {
        expect(key).toMatch(/^blotato_/)
      })
    })

    it('should have unique storage keys', () => {
      const keys = Object.values(STORAGE_KEYS)
      const uniqueKeys = new Set(keys)
      expect(uniqueKeys.size).toBe(keys.length)
    })
  })

  describe('AUTH', () => {
    it('should have valid auth configuration', () => {
      expect(typeof AUTH.TOKEN_EXPIRY_MINUTES).toBe('number')
      expect(AUTH.TOKEN_EXPIRY_MINUTES).toBeGreaterThan(0)
      expect(typeof AUTH.COOKIE_MAX_AGE).toBe('number')
      expect(AUTH.COOKIE_MAX_AGE).toBeGreaterThan(0)
      expect(typeof AUTH.SESSION_TIMEOUT_MINUTES).toBe('number')
      expect(AUTH.SESSION_TIMEOUT_MINUTES).toBeGreaterThan(0)
    })
  })

  describe('PATTERNS', () => {
    it('should have valid regex patterns', () => {
      expect(PATTERNS.TWITTER_HANDLE).toBeInstanceOf(RegExp)
      expect(PATTERNS.URL).toBeInstanceOf(RegExp)
      expect(PATTERNS.EMAIL).toBeInstanceOf(RegExp)
      expect(PATTERNS.UUID).toBeInstanceOf(RegExp)
    })

    it('should validate Twitter handles correctly', () => {
      expect(PATTERNS.TWITTER_HANDLE.test('@validhandle')).toBe(true)
      expect(PATTERNS.TWITTER_HANDLE.test('validhandle')).toBe(true)
      expect(PATTERNS.TWITTER_HANDLE.test('valid_handle123')).toBe(true)
      expect(PATTERNS.TWITTER_HANDLE.test('@toolong_handle_name')).toBe(false)
      expect(PATTERNS.TWITTER_HANDLE.test('@invalid-handle')).toBe(false)
    })

    it('should validate URLs correctly', () => {
      expect(PATTERNS.URL.test('https://example.com')).toBe(true)
      expect(PATTERNS.URL.test('http://example.com')).toBe(true)
      expect(PATTERNS.URL.test('https://www.example.com')).toBe(true)
      expect(PATTERNS.URL.test('ftp://example.com')).toBe(false)
      expect(PATTERNS.URL.test('not-a-url')).toBe(false)
    })

    it('should validate emails correctly', () => {
      expect(PATTERNS.EMAIL.test('test@example.com')).toBe(true)
      expect(PATTERNS.EMAIL.test('user.name@domain.co.uk')).toBe(true)
      expect(PATTERNS.EMAIL.test('invalid-email')).toBe(false)
      expect(PATTERNS.EMAIL.test('@domain.com')).toBe(false)
    })
  })

  describe('Configuration Relationships', () => {
    it('should have consistent threshold relationships', () => {
      expect(MODERATION.HIGH_SENSITIVITY_THRESHOLD).toBeLessThan(MODERATION.CONFIDENCE_THRESHOLD)
    })

    it('should have reasonable storage and cleanup configuration', () => {
      expect(STORAGE.MAX_DRAFTS).toBeGreaterThan(0)
      expect(STORAGE.MAX_POSTS_HISTORY).toBeGreaterThan(0)
      expect(STORAGE.EXPIRY_HOURS).toBeGreaterThan(0)
    })

    it('should have API timeouts that make sense', () => {
      expect(API.OPENAI_TIMEOUT_MS).toBeGreaterThanOrEqual(API.TIMEOUT_MS)
      expect(API.TWITTER_TIMEOUT_MS).toBeGreaterThanOrEqual(0)
    })

    it('should have reasonable post thresholds', () => {
      expect(POST_LIMITS.MIN_LENGTH).toBeLessThan(POST_LIMITS.MAX_LENGTH)
      expect(POST_LIMITS.WARNING_THRESHOLD).toBeLessThan(POST_LIMITS.DANGER_THRESHOLD)
    })
  })
}) 
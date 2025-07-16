// Application Configuration
export const APP_NAME = 'Blotato'
export const APP_DESCRIPTION = 'AI-powered Twitter post moderator with intelligent spam and abuse detection'
export const APP_VERSION = '1.0.0'

// Post Configuration
export const POST_LIMITS = {
  MAX_LENGTH: 280,
  MIN_LENGTH: 1,
  WARNING_THRESHOLD: 70, // Percentage at which to show warning
  DANGER_THRESHOLD: 90,  // Percentage at which to show danger
} as const

// Authentication Configuration
export const AUTH = {
  TOKEN_EXPIRY_MINUTES: 3,
  COOKIE_MAX_AGE: 60 * 60 * 24 * 7, // 7 days
  SESSION_TIMEOUT_MINUTES: 30,
} as const

// API Configuration
export const API = {
  TIMEOUT_MS: 5000,
  TWITTER_TIMEOUT_MS: 3000,
  OPENAI_TIMEOUT_MS: 5000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MS: 1000,
} as const

// Rate Limiting Configuration
export const RATE_LIMITS = {
  PER_USER: {
    MAX_REQUESTS: 100,
    WINDOW_HOURS: 1,
  },
  GLOBAL: {
    MAX_REQUESTS: 1000,
    WINDOW_HOURS: 1,
  },
} as const

// OpenAI Moderation Configuration
export const MODERATION = {
  MODEL: 'omni-moderation-latest',
  CONFIDENCE_THRESHOLD: 0.1, // More sensitive threshold for better detection
  HIGH_SENSITIVITY_THRESHOLD: 0.05, // Extra sensitive for hate/harassment
  CACHE_TTL_HOURS: 1,
  CATEGORIES: [
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
  ] as const,
  HIGH_SENSITIVITY_CATEGORIES: [
    'hate',
    'hate/threatening',
    'harassment',
    'harassment/threatening',
  ] as const,
} as const

// Storage Configuration
export const STORAGE = {
  CLEANUP_INTERVAL_MINUTES: 10,
  MAX_DRAFTS: 50,
  MAX_POSTS_HISTORY: 100,
  EXPIRY_HOURS: 24,
} as const

// UI Configuration
export const UI = {
  TOAST_DURATION_MS: 3000,
  DEBOUNCE_MS: 300,
  ANIMATION_DURATION_MS: 200,
  BREAKPOINTS: {
    MOBILE: 320,
    TABLET: 768,
    DESKTOP: 1024,
    WIDE: 1440,
  },
} as const

// Twitter OAuth Configuration
export const TWITTER = {
  SCOPES: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
  API_VERSION: '2',
  BASE_URL: 'https://api.twitter.com',
} as const

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error occurred. Please check your connection and try again.',
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded. Please wait before making another request.',
  INVALID_CREDENTIALS: 'Invalid credentials. Please log in again.',
  POST_TOO_LONG: `Post cannot exceed ${POST_LIMITS.MAX_LENGTH} characters.`,
  POST_EMPTY: 'Post cannot be empty.',
  MODERATION_FAILED: 'Content moderation failed. Please try again.',
  TWITTER_API_ERROR: 'Twitter API error. Please try again later.',
  OPENAI_API_ERROR: 'OpenAI API error. Please try again later.',
  GENERIC_ERROR: 'An unexpected error occurred. Please try again.',
  TOKEN_EXPIRED: 'Your session has expired. Please log in again.',
  STORAGE_FULL: 'Storage is full. Please clear some data and try again.',
} as const

// Success Messages
export const SUCCESS_MESSAGES = {
  POST_CREATED: 'Post created successfully!',
  POST_POSTED: 'Post published to Twitter successfully!',
  DRAFT_SAVED: 'Draft saved successfully!',
  LOGIN_SUCCESS: 'Logged in successfully!',
  LOGOUT_SUCCESS: 'Logged out successfully!',
} as const

// Loading Messages
export const LOADING_MESSAGES = {
  AUTHENTICATING: 'Authenticating...',
  POSTING: 'Publishing post...',
  MODERATING: 'Checking content...',
  SAVING: 'Saving draft...',
  LOADING: 'Loading...',
} as const

// Regex Patterns
export const PATTERNS = {
  TWITTER_HANDLE: /^@?[a-zA-Z0-9_]{1,15}$/,
  URL: /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
} as const

// Local Storage Keys
export const STORAGE_KEYS = {
  POSTS: 'blotato_posts',
  DRAFTS: 'blotato_drafts',
  USER_PREFERENCES: 'blotato_preferences',
  SESSION_STATE: 'blotato_session',
  MODERATION_CACHE: 'blotato_moderation_cache',
  RATE_LIMIT: 'blotato_rate_limit',
  LAST_CLEANUP: 'blotato_last_cleanup',
} as const

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const

// Environment Types
export const ENV_TYPES = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
  TEST: 'test',
} as const

// Content Types
export const CONTENT_TYPES = {
  JSON: 'application/json',
  FORM_DATA: 'multipart/form-data',
  URL_ENCODED: 'application/x-www-form-urlencoded',
  TEXT: 'text/plain',
} as const

// Cache Keys
export const CACHE_KEYS = {
  MODERATION_PREFIX: 'mod_',
  USER_PREFIX: 'user_',
  RATE_LIMIT_PREFIX: 'rl_',
} as const 
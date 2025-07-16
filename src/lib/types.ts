// User and Authentication Types
export interface User {
  id: string
  name?: string | null
  username?: string | null
  email?: string | null
  image?: string | null
  accessToken?: string
  refreshToken?: string
}

export interface Session {
  user: User
  expires: string
  accessToken?: string
}

// Post Types
export interface Post {
  id: string
  content: string
  userId: string
  createdAt: Date
  updatedAt: Date
  moderationResult?: ModerationResult
  status: PostStatus
  twitterPostId?: string
}

export type PostStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'posted' | 'failed'

// OpenAI Moderation Types
export interface ModerationResult {
  id: string
  model: string
  results: ModerationCategory[]
}

export interface ModerationCategory {
  flagged: boolean
  categories: {
    hate: boolean
    'hate/threatening': boolean
    harassment: boolean
    'harassment/threatening': boolean
    'self-harm': boolean
    'self-harm/intent': boolean
    'self-harm/instructions': boolean
    sexual: boolean
    'sexual/minors': boolean
    violence: boolean
    'violence/graphic': boolean
  }
  category_scores: {
    hate: number
    'hate/threatening': number
    harassment: number
    'harassment/threatening': number
    'self-harm': number
    'self-harm/intent': number
    'self-harm/instructions': number
    sexual: number
    'sexual/minors': number
    violence: number
    'violence/graphic': number
  }
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface ApiError {
  message: string
  code?: string
  status?: number
}

// Form Types
export interface CreatePostForm {
  content: string
}

export interface PostValidationResult {
  isValid: boolean
  errors: string[]
  characterCount: number
  moderationResult?: ModerationResult
}

// Storage Types
export interface StorageData {
  posts: Post[]
  drafts: Draft[]
  userPreferences: UserPreferences
  sessionState: SessionState
  lastCleanup: number
}

export interface Draft {
  id: string
  content: string
  createdAt: Date
  updatedAt: Date
}

export interface UserPreferences {
  theme?: 'light' | 'dark' | 'system'
  notifications?: boolean
  autoSave?: boolean
}

export interface SessionState {
  isAuthenticated: boolean
  lastActivity: number
  tokenExpiry?: number
}

// Rate Limiting Types
export interface RateLimit {
  requests: number
  windowStart: number
  remaining: number
  resetTime: number
}

export interface RateLimitConfig {
  maxRequests: number
  windowMs: number
}

// Error Types
export interface AppError extends Error {
  code?: string
  status?: number
  context?: Record<string, unknown>
}

// Toast Types
export interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  description?: string
  duration?: number
}

// Character Counter Types
export interface CharacterCount {
  current: number
  max: number
  remaining: number
  percentage: number
  status: 'safe' | 'warning' | 'danger'
}

// Loading States
export type LoadingState = 'idle' | 'loading' | 'success' | 'error'

// Component Props Types
export interface BaseComponentProps {
  className?: string
  children?: React.ReactNode
}

// Twitter API Types
export interface TwitterTokenResponse {
  access_token: string
  refresh_token?: string
  expires_in: number
  token_type: string
  scope: string
}

export interface TwitterUser {
  id: string
  name: string
  username: string
  profile_image_url?: string
  verified?: boolean
}

export interface TwitterPost {
  id: string
  text: string
  created_at: string
  author_id: string
  public_metrics?: {
    retweet_count: number
    like_count: number
    reply_count: number
    quote_count: number
  }
} 
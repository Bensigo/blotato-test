import { z } from 'zod'

// Constants for validation
export const MAX_POST_LENGTH = 280
export const MIN_POST_LENGTH = 1
export const MODERATION_CONFIDENCE_THRESHOLD = 0.1

// Post validation schemas
export const createPostSchema = z.object({
  content: z
    .string()
    .min(MIN_POST_LENGTH, 'Post cannot be empty')
    .max(MAX_POST_LENGTH, `Post cannot exceed ${MAX_POST_LENGTH} characters`)
    .trim(),
})

export const postSchema = z.object({
  id: z.string().uuid(),
  content: z.string().min(1).max(MAX_POST_LENGTH),
  userId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  moderationResult: z
    .object({
      id: z.string(),
      model: z.string(),
      results: z.array(
        z.object({
          flagged: z.boolean(),
          categories: z.object({
            hate: z.boolean(),
            'hate/threatening': z.boolean(),
            harassment: z.boolean(),
            'harassment/threatening': z.boolean(),
            'self-harm': z.boolean(),
            'self-harm/intent': z.boolean(),
            'self-harm/instructions': z.boolean(),
            sexual: z.boolean(),
            'sexual/minors': z.boolean(),
            violence: z.boolean(),
            'violence/graphic': z.boolean(),
          }),
          category_scores: z.object({
            hate: z.number().min(0).max(1),
            'hate/threatening': z.number().min(0).max(1),
            harassment: z.number().min(0).max(1),
            'harassment/threatening': z.number().min(0).max(1),
            'self-harm': z.number().min(0).max(1),
            'self-harm/intent': z.number().min(0).max(1),
            'self-harm/instructions': z.number().min(0).max(1),
            sexual: z.number().min(0).max(1),
            'sexual/minors': z.number().min(0).max(1),
            violence: z.number().min(0).max(1),
            'violence/graphic': z.number().min(0).max(1),
          }),
        })
      ),
    })
    .optional(),
  status: z.enum(['draft', 'pending', 'approved', 'rejected', 'posted', 'failed']),
  twitterPostId: z.string().optional(),
})

// User validation schemas
export const userSchema = z.object({
  id: z.string(),
  name: z.string().nullable().optional(),
  username: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  image: z.string().url().nullable().optional(),
  accessToken: z.string().optional(),
  refreshToken: z.string().optional(),
})

// API request/response schemas
export const apiResponseSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  error: z.string().optional(),
  message: z.string().optional(),
})

export const moderatePostRequestSchema = z.object({
  content: z.string().min(1).max(MAX_POST_LENGTH),
})

export const moderatePostResponseSchema = z.object({
  isAllowed: z.boolean(),
  moderationResult: z.object({
    id: z.string(),
    model: z.string(),
    results: z.array(z.unknown()),
  }),
  flaggedCategories: z.array(z.string()),
  confidenceScore: z.number().min(0).max(1),
})

// Draft validation schemas
export const draftSchema = z.object({
  id: z.string().uuid(),
  content: z.string().max(MAX_POST_LENGTH),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const createDraftSchema = z.object({
  content: z.string().max(MAX_POST_LENGTH),
})

// User preferences validation
export const userPreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  notifications: z.boolean().optional(),
  autoSave: z.boolean().optional(),
})

// Storage validation schemas
export const storageDataSchema = z.object({
  posts: z.array(postSchema),
  drafts: z.array(draftSchema),
  userPreferences: userPreferencesSchema,
  sessionState: z.object({
    isAuthenticated: z.boolean(),
    lastActivity: z.number(),
    tokenExpiry: z.number().optional(),
  }),
  lastCleanup: z.number(),
})

// Character count validation
export const characterCountSchema = z.object({
  current: z.number().min(0),
  max: z.number().positive(),
  remaining: z.number(),
  percentage: z.number().min(0).max(100),
  status: z.enum(['safe', 'warning', 'danger']),
})

// Rate limiting validation
export const rateLimitSchema = z.object({
  requests: z.number().min(0),
  windowStart: z.number(),
  remaining: z.number().min(0),
  resetTime: z.number(),
})

export const rateLimitConfigSchema = z.object({
  maxRequests: z.number().positive(),
  windowMs: z.number().positive(),
})

// Toast validation
export const toastSchema = z.object({
  id: z.string(),
  type: z.enum(['success', 'error', 'warning', 'info']),
  title: z.string(),
  description: z.string().optional(),
  duration: z.number().positive().optional(),
})

// Twitter API validation schemas
export const twitterTokenResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string().optional(),
  expires_in: z.number(),
  token_type: z.string(),
  scope: z.string(),
})

export const twitterUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  username: z.string(),
  profile_image_url: z.string().url().optional(),
  verified: z.boolean().optional(),
})

export const twitterPostSchema = z.object({
  id: z.string(),
  text: z.string(),
  created_at: z.string(),
  author_id: z.string(),
  public_metrics: z
    .object({
      retweet_count: z.number(),
      like_count: z.number(),
      reply_count: z.number(),
      quote_count: z.number(),
    })
    .optional(),
})

// Type inference helpers
export type CreatePostInput = z.infer<typeof createPostSchema>
export type ModeratePostRequest = z.infer<typeof moderatePostRequestSchema>
export type ModeratePostResponse = z.infer<typeof moderatePostResponseSchema>
export type CreateDraftInput = z.infer<typeof createDraftSchema>
export type UserPreferencesInput = z.infer<typeof userPreferencesSchema>
export type RateLimitConfigInput = z.infer<typeof rateLimitConfigSchema>
export type ToastInput = z.infer<typeof toastSchema>

// Validation helper functions
export function validatePost(data: unknown) {
  return createPostSchema.safeParse(data)
}

export function validateModerateRequest(data: unknown) {
  return moderatePostRequestSchema.safeParse(data)
}

export function validateStorageData(data: unknown) {
  return storageDataSchema.safeParse(data)
}

export function validateCharacterCount(data: unknown) {
  return characterCountSchema.safeParse(data)
}

export function isValidPostLength(content: string): boolean {
  return content.length >= MIN_POST_LENGTH && content.length <= MAX_POST_LENGTH
}

export function getCharacterCount(content: string) {
  const current = content.length
  const remaining = MAX_POST_LENGTH - current
  const percentage = (current / MAX_POST_LENGTH) * 100
  
  let status: 'safe' | 'warning' | 'danger' = 'safe'
  if (percentage >= 90) {
    status = 'danger'
  } else if (percentage >= 70) {
    status = 'warning'
  }
  
  return {
    current,
    max: MAX_POST_LENGTH,
    remaining,
    percentage,
    status,
  }
}

export function shouldFlagForModeration(moderationResult: unknown): boolean {
  const parsed = moderatePostResponseSchema.safeParse(moderationResult)
  if (!parsed.success) return true // Err on the side of caution
  
  return (
    !parsed.data.isAllowed ||
    parsed.data.confidenceScore >= MODERATION_CONFIDENCE_THRESHOLD
  )
} 
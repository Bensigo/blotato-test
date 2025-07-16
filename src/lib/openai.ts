import OpenAI from 'openai'
import { OPENAI_API_KEY } from './env'
import { MODERATION, API } from './constants'
import type { ModerationResult } from './types'

// Initialize OpenAI client
export const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
  timeout: API.OPENAI_TIMEOUT_MS,
})

// Cache for moderation results
const moderationCache = new Map<string, { result: ModerationResult; timestamp: number }>()

// Moderation cache key generator
function getModerationCacheKey(content: string): string {
  // Simple hash function for caching
  let hash = 0
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return `moderation_${hash.toString(36)}`
}

// Check if cache entry is valid
function isCacheValid(timestamp: number): boolean {
  const now = Date.now()
  const cacheAgeMs = now - timestamp
  const maxAgeMs = MODERATION.CACHE_TTL_HOURS * 60 * 60 * 1000
  return cacheAgeMs < maxAgeMs
}

// Get moderation result from cache
function getCachedModeration(content: string): ModerationResult | null {
  const cacheKey = getModerationCacheKey(content)
  const cached = moderationCache.get(cacheKey)
  
  if (cached && isCacheValid(cached.timestamp)) {
    return cached.result
  }
  
  // Remove expired cache entry
  if (cached) {
    moderationCache.delete(cacheKey)
  }
  
  return null
}

// Store moderation result in cache
function cacheModeration(content: string, result: ModerationResult): void {
  const cacheKey = getModerationCacheKey(content)
  moderationCache.set(cacheKey, {
    result,
    timestamp: Date.now(),
  })
}

// Main moderation function
export async function moderateContent(content: string): Promise<{
  isAllowed: boolean
  moderationResult: ModerationResult
  flaggedCategories: string[]
  confidenceScore: number
}> {
  try {
    // Check cache first
    const cached = getCachedModeration(content)
    if (cached) {
      return analyzeModeration(cached)
    }

    // Call OpenAI moderation API
    const response = await openai.moderations.create({
      input: content,
      model: MODERATION.MODEL,
    })

    const moderationResult: ModerationResult = {
      id: response.id,
      model: response.model,
      results: response.results.map(result => ({
        flagged: result.flagged,
        categories: {
          hate: result.categories.hate,
          'hate/threatening': result.categories['hate/threatening'],
          harassment: result.categories.harassment,
          'harassment/threatening': result.categories['harassment/threatening'],
          'self-harm': result.categories['self-harm'],
          'self-harm/intent': result.categories['self-harm/intent'],
          'self-harm/instructions': result.categories['self-harm/instructions'],
          sexual: result.categories.sexual,
          'sexual/minors': result.categories['sexual/minors'],
          violence: result.categories.violence,
          'violence/graphic': result.categories['violence/graphic'],
        },
        category_scores: {
          hate: result.category_scores.hate,
          'hate/threatening': result.category_scores['hate/threatening'],
          harassment: result.category_scores.harassment,
          'harassment/threatening': result.category_scores['harassment/threatening'],
          'self-harm': result.category_scores['self-harm'],
          'self-harm/intent': result.category_scores['self-harm/intent'],
          'self-harm/instructions': result.category_scores['self-harm/instructions'],
          sexual: result.category_scores.sexual,
          'sexual/minors': result.category_scores['sexual/minors'],
          violence: result.category_scores.violence,
          'violence/graphic': result.category_scores['violence/graphic'],
        },
      })),
    }

    // Cache the result
    cacheModeration(content, moderationResult)

    const analysis = analyzeModeration(moderationResult)
    
    // Debug logging for development
    if (process.env.NODE_ENV === 'development') {
      console.log('Moderation analysis:', {
        content: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
        isAllowed: analysis.isAllowed,
        flaggedCategories: analysis.flaggedCategories,
        confidenceScore: analysis.confidenceScore,
        model: moderationResult.model
      })
    }
    
    return analysis
  } catch (error) {
    console.error('OpenAI moderation error:', error)
    
    // Return conservative result on error
    return {
      isAllowed: false,
      moderationResult: {
        id: 'error',
        model: MODERATION.MODEL,
        results: [],
      },
      flaggedCategories: ['error'],
      confidenceScore: 1.0,
    }
  }
}

// Analyze moderation result and determine if content should be allowed
function analyzeModeration(moderationResult: ModerationResult): {
  isAllowed: boolean
  moderationResult: ModerationResult
  flaggedCategories: string[]
  confidenceScore: number
} {
  const flaggedCategories: string[] = []
  let maxConfidence = 0
  let hasViolation = false

  // Check each result (usually there's only one)
  for (const result of moderationResult.results) {
    if (result.flagged) {
      hasViolation = true
    }

    // Check each category
    const categories = Object.entries(result.categories)
    const scores = result.category_scores

    for (const [category, flagged] of categories) {
      const score = scores[category as keyof typeof scores]
      
      // Track maximum confidence score
      if (score > maxConfidence) {
        maxConfidence = score
      }
      
      // Determine appropriate threshold for this category
      const isHighSensitivityCategory = (MODERATION.HIGH_SENSITIVITY_CATEGORIES as readonly string[]).includes(category)
      const threshold = isHighSensitivityCategory 
        ? MODERATION.HIGH_SENSITIVITY_THRESHOLD 
        : MODERATION.CONFIDENCE_THRESHOLD
      
      // If flagged or score exceeds threshold, add to flagged categories
      if (flagged || score >= threshold) {
        if (!flaggedCategories.includes(category)) {
          flaggedCategories.push(category)
        }
        hasViolation = true
      }
    }
  }

  return {
    isAllowed: !hasViolation,
    moderationResult,
    flaggedCategories,
    confidenceScore: maxConfidence,
  }
}

// Get human-readable category names
export function getCategoryDisplayName(category: string): string {
  const displayNames: Record<string, string> = {
    hate: 'Hate Speech',
    'hate/threatening': 'Threatening Hate Speech',
    harassment: 'Harassment',
    'harassment/threatening': 'Threatening Harassment',
    'self-harm': 'Self-Harm',
    'self-harm/intent': 'Self-Harm Intent',
    'self-harm/instructions': 'Self-Harm Instructions',
    sexual: 'Sexual Content',
    'sexual/minors': 'Sexual Content Involving Minors',
    violence: 'Violence',
    'violence/graphic': 'Graphic Violence',
  }
  
  return displayNames[category] || category
}

// Format moderation feedback for users
export function formatModerationFeedback(
  flaggedCategories: string[],
  isAllowed: boolean
): string {
  if (isAllowed) {
    return 'Content passed moderation checks.'
  }

  if (flaggedCategories.length === 0) {
    return 'Content flagged by moderation system.'
  }

  const categoryNames = flaggedCategories
    .map(getCategoryDisplayName)
    .join(', ')

  return `Content flagged for: ${categoryNames}. Please revise your post.`
}

// Clear expired cache entries
export function cleanupModerationCache(): void {
  const now = Date.now()
  const maxAgeMs = MODERATION.CACHE_TTL_HOURS * 60 * 60 * 1000

  for (const [key, value] of Array.from(moderationCache.entries())) {
    if (now - value.timestamp >= maxAgeMs) {
      moderationCache.delete(key)
    }
  }
}

// Get cache statistics
export function getModerationCacheStats(): {
  size: number
  entries: number
  memoryUsage: string
} {
  return {
    size: moderationCache.size,
    entries: moderationCache.size,
    memoryUsage: `${Math.round(moderationCache.size * 0.1)}KB`, // Rough estimate
  }
} 
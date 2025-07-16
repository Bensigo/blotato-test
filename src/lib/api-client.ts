// Client-side API functions for use in client components
// This module replaces direct imports of server-side functions

import type { ApiResponse, ModerationCategory } from './types'

export interface ModerationResponse {
  isAllowed: boolean
  flaggedCategories: string[]
  confidenceScore: number
  moderationResult: {
    id: string
    model: string
    results: ModerationCategory[]
  }
}

/**
 * Moderate content using the API route
 * This replaces the direct moderateContent import for client components
 */
export async function moderateContentAPI(content: string): Promise<ModerationResponse> {
  const response = await fetch('/api/moderate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content }),
  })

  if (!response.ok) {
    const errorData = await response.json() as ApiResponse
    throw new Error(errorData.error || 'Moderation failed')
  }

  const data = await response.json() as ApiResponse<ModerationResponse>
  
  if (!data.success || !data.data) {
    throw new Error(data.error || 'Moderation failed')
  }

  return data.data
}

/**
 * Create a post using the API route
 */
export async function createPostAPI(content: string) {
  const response = await fetch('/api/post', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content }),
  })

  if (!response.ok) {
    const errorData = await response.json() as ApiResponse
    throw new Error(errorData.error || 'Failed to create post')
  }

  const data = await response.json() as ApiResponse
  
  if (!data.success) {
    throw new Error(data.error || 'Failed to create post')
  }

  return data.data
}

/**
 * Publish a post to Twitter using the API route
 */
export async function publishToTwitterAPI(postId: string) {
  const response = await fetch('/api/twitter/publish', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ postId }),
  })

  if (!response.ok) {
    const errorData = await response.json() as ApiResponse
    throw new Error(errorData.error || 'Failed to publish to Twitter')
  }

  const data = await response.json() as ApiResponse
  
  if (!data.success) {
    throw new Error(data.error || 'Failed to publish to Twitter')
  }

  return data.data
} 
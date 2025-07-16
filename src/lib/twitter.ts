import { TWITTER_CLIENT_ID, TWITTER_CLIENT_SECRET } from './env'
import { API, TWITTER } from './constants'
import { handleTwitterError } from '../utils/error-handler'
import type { TwitterUser, TwitterPost, TwitterTokenResponse } from './types'

/**
 * Twitter API client for handling OAuth and API requests
 */
export class TwitterClient {
  private accessToken: string | null = null
  private refreshToken: string | null = null
  private tokenExpiry: number | null = null

  constructor(accessToken?: string, refreshToken?: string) {
    this.accessToken = accessToken || null
    this.refreshToken = refreshToken || null
  }

  /**
   * Set authentication tokens
   */
  setTokens(accessToken: string, refreshToken?: string, expiresIn?: number): void {
    this.accessToken = accessToken
    this.refreshToken = refreshToken || null
    this.tokenExpiry = expiresIn ? Date.now() + (expiresIn * 1000) : null
  }

  /**
   * Check if current token is valid
   */
  isTokenValid(): boolean {
    if (!this.accessToken) return false
    if (!this.tokenExpiry) return true // No expiry info, assume valid
    return Date.now() < this.tokenExpiry
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available')
    }

    try {
      const response = await fetch('https://api.twitter.com/2/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(
            `${TWITTER_CLIENT_ID}:${TWITTER_CLIENT_SECRET}`
          ).toString('base64')}`,
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.refreshToken,
          client_id: TWITTER_CLIENT_ID,
        }),
      })

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.status}`)
      }

      const tokenData: TwitterTokenResponse = await response.json()
      this.setTokens(
        tokenData.access_token,
        tokenData.refresh_token || this.refreshToken,
        tokenData.expires_in
      )

      return true
    } catch (error) {
      throw handleTwitterError(error)
    }
  }

  /**
   * Make authenticated API request to Twitter
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    if (!this.accessToken) {
      throw new Error('No access token available')
    }

    // Try to refresh token if it's expired
    if (!this.isTokenValid() && this.refreshToken) {
      await this.refreshAccessToken()
    }

    const url = `${TWITTER.BASE_URL}/${TWITTER.API_VERSION}/${endpoint}`
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
      signal: AbortSignal.timeout(API.TWITTER_TIMEOUT_MS),
    })

    if (!response.ok) {
      const errorData = await response.text()
      throw new Error(`Twitter API error: ${response.status} ${errorData}`)
    }

    return response.json()
  }

  /**
   * Get current user information
   */
  async getCurrentUser(): Promise<TwitterUser> {
    try {
      const response = await this.makeRequest<{ data: TwitterUser }>(
        'users/me?user.fields=id,name,username,profile_image_url,verified'
      )
      
      return response.data
    } catch (error) {
      throw handleTwitterError(error)
    }
  }

  /**
   * Post a tweet
   */
  async postTweet(text: string): Promise<TwitterPost> {
    try {
      const response = await this.makeRequest<{ data: TwitterPost }>('tweets', {
        method: 'POST',
        body: JSON.stringify({ text }),
      })
      
      return response.data
    } catch (error) {
      throw handleTwitterError(error)
    }
  }

  /**
   * Get user's recent tweets
   */
  async getUserTweets(userId?: string, maxResults: number = 10): Promise<TwitterPost[]> {
    try {
      const targetUserId = userId || (await this.getCurrentUser()).id
      
      const response = await this.makeRequest<{ data: TwitterPost[] }>(
        `users/${targetUserId}/tweets?max_results=${maxResults}&tweet.fields=created_at,public_metrics`
      )
      
      return response.data || []
    } catch (error) {
      throw handleTwitterError(error)
    }
  }

  /**
   * Delete a tweet
   */
  async deleteTweet(tweetId: string): Promise<boolean> {
    try {
      const response = await this.makeRequest<{ data: { deleted: boolean } }>(
        `tweets/${tweetId}`,
        { method: 'DELETE' }
      )
      
      return response.data.deleted
    } catch (error) {
      throw handleTwitterError(error)
    }
  }

  /**
   * Get rate limit status
   */
  async getRateLimitStatus(): Promise<Record<string, unknown>> {
    try {
      return await this.makeRequest('application/rate_limit_status')
    } catch (error) {
      throw handleTwitterError(error)
    }
  }
}

/**
 * Generate Twitter OAuth URL for authentication
 */
export function generateTwitterAuthUrl(redirectUri: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: TWITTER_CLIENT_ID,
    redirect_uri: redirectUri,
    scope: TWITTER.SCOPES.join(' '),
    state: generateRandomState(),
    code_challenge: generateCodeChallenge(),
    code_challenge_method: 'S256',
  })

  return `https://twitter.com/i/oauth2/authorize?${params.toString()}`
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(
  code: string,
  redirectUri: string,
  codeVerifier: string
): Promise<TwitterTokenResponse> {
  try {
    const response = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(
          `${TWITTER_CLIENT_ID}:${TWITTER_CLIENT_SECRET}`
        ).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
        client_id: TWITTER_CLIENT_ID,
      }),
    })

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    throw handleTwitterError(error)
  }
}

/**
 * Generate random state for OAuth security
 */
function generateRandomState(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15)
}

/**
 * Generate code challenge for PKCE
 */
function generateCodeChallenge(): string {
  // In a real implementation, this should be a proper SHA256 hash
  // For simplicity, using a random string here
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15)
}

/**
 * Validate tweet content according to Twitter rules
 */
export function validateTweetContent(content: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // Check length
  if (content.length === 0) {
    errors.push('Tweet cannot be empty')
  }

  if (content.length > 280) {
    errors.push('Tweet cannot exceed 280 characters')
  }

  // Check for potential issues
  if (content.trim() !== content) {
    errors.push('Tweet has leading or trailing whitespace')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Create a new Twitter client instance
 */
export function createTwitterClient(accessToken?: string, refreshToken?: string): TwitterClient {
  return new TwitterClient(accessToken, refreshToken)
} 
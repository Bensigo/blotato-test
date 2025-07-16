import { TWITTER_CLIENT_ID, TWITTER_CLIENT_SECRET } from './env'

// Twitter OAuth 2.0 configuration
const TWITTER_OAUTH_CONFIG = {
  authorizeUrl: 'https://twitter.com/i/oauth2/authorize',
  tokenUrl: 'https://api.twitter.com/2/oauth2/token',
  userInfoUrl: 'https://api.twitter.com/2/users/me',
  scope: 'tweet.read tweet.write users.read offline.access',
  redirectUri: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/twitter/callback`
}

export interface TwitterUser {
  id: string
  name: string
  username: string
  profile_image_url?: string
  verified?: boolean
}

export interface TwitterTokens {
  access_token: string
  refresh_token?: string
  expires_in: number
  token_type: string
}

export interface TwitterSession {
  user: TwitterUser
  tokens: TwitterTokens
  expiresAt: number
}

/**
 * Generate PKCE code verifier and challenge
 */
async function generatePKCE() {
  // Generate random code verifier
  const array = new Uint8Array(32)
  if (typeof window !== 'undefined') {
    crypto.getRandomValues(array)
  } else {
    // Node.js environment
    const nodeCrypto = await import('crypto')
    nodeCrypto.randomFillSync(array)
  }
  
  const codeVerifier = base64URLEncode(array)
  
  // Generate code challenge
  let challengeArray: Uint8Array
  if (typeof window !== 'undefined') {
    // Browser environment
    challengeArray = new Uint8Array(
      await crypto.subtle.digest('SHA-256', new TextEncoder().encode(codeVerifier))
    )
  } else {
    // Node.js environment
    const nodeCrypto = await import('crypto')
    const hash = nodeCrypto.createHash('sha256')
    hash.update(codeVerifier)
    challengeArray = new Uint8Array(hash.digest())
  }
  
  const codeChallenge = base64URLEncode(challengeArray)
  return { codeVerifier, codeChallenge }
}

function base64URLEncode(buffer: Uint8Array): string {
  return btoa(String.fromCharCode(...buffer))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

/**
 * Generate Twitter OAuth authorization URL
 */
export async function generateAuthUrl(): Promise<{ url: string; codeVerifier: string }> {
  const { codeVerifier, codeChallenge } = await generatePKCE()
  
  // Generate state for security
  let state: string
  if (typeof window !== 'undefined') {
    state = crypto.randomUUID()
  } else {
    const nodeCrypto = await import('crypto')
    state = nodeCrypto.randomUUID()
  }
  
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: TWITTER_CLIENT_ID,
    redirect_uri: TWITTER_OAUTH_CONFIG.redirectUri,
    scope: TWITTER_OAUTH_CONFIG.scope,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256'
  })

  const url = `${TWITTER_OAUTH_CONFIG.authorizeUrl}?${params.toString()}`
  
  return { url, codeVerifier }
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForTokens(
  code: string,
  codeVerifier: string
): Promise<TwitterTokens> {
  
  // Create Basic Auth header for client credentials
  const credentials = btoa(`${TWITTER_CLIENT_ID}:${TWITTER_CLIENT_SECRET}`)
  
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: TWITTER_OAUTH_CONFIG.redirectUri,
    code_verifier: codeVerifier
  })

  const response = await fetch(TWITTER_OAUTH_CONFIG.tokenUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    },
    body: params.toString()
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('Twitter token exchange failed:', error)
    throw new Error(`Token exchange failed: ${response.status} - ${error}`)
  }

  const tokens = await response.json()
  return tokens as TwitterTokens
}

/**
 * Get user information from Twitter API
 */
export async function getTwitterUser(accessToken: string): Promise<TwitterUser> {
  const response = await fetch(
    `${TWITTER_OAUTH_CONFIG.userInfoUrl}?user.fields=id,name,username,profile_image_url,verified`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    }
  )

  if (!response.ok) {
    const error = await response.text()
    console.error('Twitter user info failed:', error)
    throw new Error(`User info failed: ${response.status} - ${error}`)
  }

  const data = await response.json()
  return data.data as TwitterUser
}

/**
 * Post a tweet
 */
export async function postTweet(accessToken: string, text: string): Promise<{ data: { id: string; text: string } }> {
  const response = await fetch('https://api.twitter.com/2/tweets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ text })
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('Tweet posting failed:', error)
    throw new Error(`Tweet posting failed: ${response.status} - ${error}`)
  }

  return response.json()
}

/**
 * Session management
 */
export class TwitterSessionManager {
  private static SESSION_KEY = 'twitter_session'
  private static CODE_VERIFIER_KEY = 'twitter_code_verifier'

  static saveSession(session: TwitterSession): void {
    localStorage.setItem(this.SESSION_KEY, JSON.stringify(session))
  }

  static getSession(): TwitterSession | null {
    const sessionData = localStorage.getItem(this.SESSION_KEY)
    if (!sessionData) return null

    try {
      const session = JSON.parse(sessionData) as TwitterSession
      
      // Check if session is expired
      if (Date.now() > session.expiresAt) {
        this.clearSession()
        return null
      }

      return session
    } catch (error) {
      console.error('Error parsing session data:', error)
      this.clearSession()
      return null
    }
  }

  static clearSession(): void {
    localStorage.removeItem(this.SESSION_KEY)
    localStorage.removeItem(this.CODE_VERIFIER_KEY)
  }

  static saveCodeVerifier(codeVerifier: string): void {
    localStorage.setItem(this.CODE_VERIFIER_KEY, codeVerifier)
  }

  static getCodeVerifier(): string | null {
    return localStorage.getItem(this.CODE_VERIFIER_KEY)
  }

  static isAuthenticated(): boolean {
    const session = this.getSession()
    return !!session?.user?.id && !!session?.tokens?.access_token
  }
} 
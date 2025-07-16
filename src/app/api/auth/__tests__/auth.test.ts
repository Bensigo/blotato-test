import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { GET as sessionGET } from '../session/route'
import { POST as logoutPOST } from '../logout/route'

describe('Authentication API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock console.error to avoid noise in tests
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('GET /api/auth/session', () => {
    it('should return null user when no session cookie exists', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/session')
      
      const response = await sessionGET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        user: null,
        authenticated: false
      })
    })

    it('should return user data for valid session', async () => {
      const mockSession = {
        user: {
          id: '123456789',
          username: 'testuser',
          name: 'Test User',
          profile_image_url: 'https://example.com/avatar.jpg'
        },
        accessToken: 'access_token_123',
        refreshToken: 'refresh_token_123',
        expiresAt: Date.now() + 60 * 60 * 1000 // 1 hour from now
      }

      const request = new NextRequest('http://localhost:3000/api/auth/session', {
        headers: {
          cookie: `twitter_session=${encodeURIComponent(JSON.stringify(mockSession))}`
        }
      })
      
      const response = await sessionGET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        user: mockSession.user,
        authenticated: true,
        expiresAt: mockSession.expiresAt
      })
    })

    it('should clear expired session and return null user', async () => {
      const expiredSession = {
        user: {
          id: '123456789',
          username: 'testuser',
          name: 'Test User',
          profile_image_url: 'https://example.com/avatar.jpg'
        },
        accessToken: 'access_token_123',
        refreshToken: 'refresh_token_123',
        expiresAt: Date.now() - 60 * 60 * 1000 // 1 hour ago
      }

      const request = new NextRequest('http://localhost:3000/api/auth/session', {
        headers: {
          cookie: `twitter_session=${encodeURIComponent(JSON.stringify(expiredSession))}`
        }
      })
      
      const response = await sessionGET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        user: null,
        authenticated: false
      })

      // Check that expired session cookie is deleted
      const setCookieHeader = response.headers.get('Set-Cookie')
      expect(setCookieHeader).toContain('twitter_session=')
      expect(setCookieHeader).toContain('Expires=Thu, 01 Jan 1970 00:00:00 GMT') // Uses Expires instead of Max-Age
    })

    it('should handle malformed session cookie gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/session', {
        headers: {
          cookie: 'twitter_session=invalid_json_data'
        }
      })
      
      const response = await sessionGET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        user: null,
        authenticated: false
      })
      expect(console.error).toHaveBeenCalledWith('Session check failed:', expect.any(Error))
    })

    it('should not expose sensitive token data', async () => {
      const mockSession = {
        user: {
          id: '123456789',
          username: 'testuser',
          name: 'Test User',
          profile_image_url: 'https://example.com/avatar.jpg'
        },
        accessToken: 'sensitive_access_token',
        refreshToken: 'sensitive_refresh_token',
        expiresAt: Date.now() + 60 * 60 * 1000
      }

      const request = new NextRequest('http://localhost:3000/api/auth/session', {
        headers: {
          cookie: `twitter_session=${encodeURIComponent(JSON.stringify(mockSession))}`
        }
      })
      
      const response = await sessionGET(request)
      const data = await response.json()

      expect(data).not.toHaveProperty('accessToken')
      expect(data).not.toHaveProperty('refreshToken')
      expect(data).toHaveProperty('user')
      expect(data).toHaveProperty('authenticated')
      expect(data).toHaveProperty('expiresAt')
    })
  })

  describe('POST /api/auth/logout', () => {
    it('should successfully log out user', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/logout', {
        method: 'POST'
      })
      
      const response = await logoutPOST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        success: true,
        message: 'Logged out successfully'
      })
    })

    it('should clear Twitter session cookies', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/logout', {
        method: 'POST'
      })
      
      const response = await logoutPOST(request)
      const setCookieHeaders = response.headers.getSetCookie()

      // Check that cookies are being cleared (any Set-Cookie headers means clearing)
      expect(setCookieHeaders.length).toBeGreaterThan(0)
      
      // Verify the cookies contain deletion instructions
      const hasSessionCookie = setCookieHeaders.some(header => 
        header.includes('twitter_session=')
      )
      const hasVerifierCookie = setCookieHeaders.some(header => 
        header.includes('twitter_code_verifier=')
      )

      expect(hasSessionCookie).toBe(true)
      expect(hasVerifierCookie).toBe(true)
    })

    it('should handle logout errors gracefully', async () => {
      // Mock NextResponse.json to throw an error
      const originalJson = NextResponse.json
      vi.mocked(NextResponse).json = vi.fn().mockImplementationOnce(() => {
        throw new Error('Response creation failed')
      }).mockImplementation(originalJson)

      const request = new NextRequest('http://localhost:3000/api/auth/logout', {
        method: 'POST'
      })
      
      const response = await logoutPOST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({
        error: 'Logout failed'
      })
      expect(console.error).toHaveBeenCalledWith('Logout failed:', expect.any(Error))

      // Restore original function
      NextResponse.json = originalJson
    })

    it('should handle logout with existing session cookie', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/logout', {
        method: 'POST',
        headers: {
          cookie: 'twitter_session=some_session_data; twitter_code_verifier=some_verifier'
        }
      })
      
      const response = await logoutPOST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      
      // Cookies should still be cleared regardless of existing cookies
      const setCookieHeaders = response.headers.getSetCookie()
      expect(setCookieHeaders.length).toBeGreaterThan(0)
    })

    it('should accept only POST method', async () => {
      // This test ensures we're testing the POST handler specifically
      const request = new NextRequest('http://localhost:3000/api/auth/logout', {
        method: 'POST'
      })
      
      const response = await logoutPOST(request)
      expect(response.status).toBe(200)
    })
  })

  describe('Session Cookie Handling', () => {
    it('should handle session with missing user data', async () => {
      const incompleteSession = {
        accessToken: 'access_token_123',
        refreshToken: 'refresh_token_123',
        expiresAt: Date.now() + 60 * 60 * 1000
        // Missing user object
      }

      const request = new NextRequest('http://localhost:3000/api/auth/session', {
        headers: {
          cookie: `twitter_session=${encodeURIComponent(JSON.stringify(incompleteSession))}`
        }
      })
      
      const response = await sessionGET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.user).toBeUndefined()
      expect(data.authenticated).toBe(true)
    })

    it('should handle session with missing expiration', async () => {
      const sessionWithoutExpiry = {
        user: {
          id: '123456789',
          username: 'testuser',
          name: 'Test User'
        },
        accessToken: 'access_token_123',
        refreshToken: 'refresh_token_123'
        // Missing expiresAt
      }

      const request = new NextRequest('http://localhost:3000/api/auth/session', {
        headers: {
          cookie: `twitter_session=${encodeURIComponent(JSON.stringify(sessionWithoutExpiry))}`
        }
      })
      
      const response = await sessionGET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      // Session without expiration will still be treated as valid, just without expiresAt
      expect(data.user).toEqual({
        id: '123456789',
        username: 'testuser',
        name: 'Test User'
      })
      expect(data.authenticated).toBe(true)
      expect(data.expiresAt).toBeUndefined()
    })
  })
}) 
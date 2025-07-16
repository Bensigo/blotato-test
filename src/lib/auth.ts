import NextAuth from 'next-auth'
import type { NextAuthConfig } from 'next-auth'
import type { JWT } from 'next-auth/jwt'
import type { Session, User } from 'next-auth'
import { TWITTER_CLIENT_ID, TWITTER_CLIENT_SECRET, NEXTAUTH_SECRET } from './env'
import { AUTH } from './constants'

// Extend NextAuth types
declare module 'next-auth' {
  interface Session {
    accessToken?: string
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      username?: string | null
    }
  }

  interface User {
    username?: string | null
    accessToken?: string
    refreshToken?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string
    refreshToken?: string
    username?: string
    expiresAt?: number
  }
}

interface TwitterProfile {
  data?: {
    id: string
    name: string
    username: string
    profile_image_url?: string
  }
  id?: string
  name?: string
  username?: string
  profile_image_url?: string
}

export const authConfig: NextAuthConfig = {
  providers: [
    {
      id: 'twitter',
      name: 'Twitter',
      type: 'oauth',
      authorization: {
        url: 'https://twitter.com/i/oauth2/authorize',
        params: {
          scope: 'tweet.read tweet.write users.read offline.access',
          code_challenge_method: 'S256',
        },
      },
      token: 'https://api.twitter.com/2/oauth2/token',
      userinfo: 'https://api.twitter.com/2/users/me?user.fields=id,name,username,profile_image_url,verified',
      clientId: TWITTER_CLIENT_ID,
      clientSecret: TWITTER_CLIENT_SECRET,
      profile(profile: TwitterProfile) {
        return {
          id: profile.data?.id || profile.id || '',
          name: profile.data?.name || profile.name || null,
          username: profile.data?.username || profile.username || null,
          email: null,
          image: profile.data?.profile_image_url || profile.profile_image_url || null,
        }
      },
    }
  ],
  secret: NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
    maxAge: AUTH.TOKEN_EXPIRY_MINUTES * 60, // 3 minutes
  },
  jwt: {
    maxAge: AUTH.TOKEN_EXPIRY_MINUTES * 60, // 3 minutes
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  callbacks: {
    // @ts-expect-error - NextAuth v5 beta type compatibility issue
    async jwt({ token, account, user }) {
      // Initial sign in
      if (account && user) {
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          username: user.username,
          expiresAt: account.expires_at ? account.expires_at * 1000 : Date.now() + (AUTH.TOKEN_EXPIRY_MINUTES * 60 * 1000),
        }
      }

      // Return previous token if the access token has not expired yet
      if (token.expiresAt && Date.now() < token.expiresAt) {
        return token
      }

      // Access token has expired, try to update it
      return await refreshAccessToken(token)
    },
    async session({ session, token }) {
      if (token.error) {
        // Force sign out if there's a token error
        return { ...session, user: { ...session.user, id: '', name: null, email: null, image: null } }
      }

      return {
        ...session,
        accessToken: token.accessToken,
        user: {
          ...session.user,
          id: token.sub || '',
          username: token.username,
        },
      }
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith('/')) return `${baseUrl}${url}`
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    },
  },
  debug: process.env.NODE_ENV === 'development',
}

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)

/**
 * Refresh the access token using the refresh token
 */
async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    const url = 'https://api.twitter.com/2/oauth2/token'
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(
          `${TWITTER_CLIENT_ID}:${TWITTER_CLIENT_SECRET}`
        ).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: token.refreshToken || '',
        client_id: TWITTER_CLIENT_ID,
      }),
    })

    const refreshedTokens = await response.json()

    if (!response.ok) {
      throw new Error('Failed to refresh access token')
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
      expiresAt: Date.now() + refreshedTokens.expires_in * 1000,
    }
  } catch (error) {
    console.error('Error refreshing access token:', error)
    return {
      ...token,
      error: 'RefreshAccessTokenError',
    }
  }
}

/**
 * Get the current session on the server side
 */
export async function getServerSession() {
  return await auth()
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(session: Session | null): boolean {
  return !!session?.user?.id && !!session.accessToken
}

/**
 * Get user from session
 */
export function getSessionUser(session: Session | null): User | null {
  if (!session?.user) return null

  return {
    id: session.user.id,
    name: session.user.name,
    username: session.user.username,
    email: session.user.email,
    image: session.user.image,
    accessToken: session.accessToken,
  }
}

/**
 * Validate token expiry
 */
export function isTokenValid(session: Session | null): boolean {
  if (!session) return false
  
  // For JWT strategy, NextAuth handles token validation internally
  // This is an additional check for our application logic
  return !!session.user?.id && !!session.accessToken
}

/**
 * Force sign out and clear session
 */
export async function forceSignOut() {
  try {
    await signOut({ redirect: false })
  } catch (error) {
    console.error('Error during force sign out:', error)
  }
} 
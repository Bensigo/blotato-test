import { NextRequest, NextResponse } from 'next/server'
import { exchangeCodeForTokens, getTwitterUser, TwitterSession } from '../../../../../lib/twitter-auth'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const error = searchParams.get('error')
    // const state = searchParams.get('state') // Reserved for future CSRF protection
    
    // Handle OAuth errors
    if (error) {
      console.error('Twitter OAuth error:', error)
      return NextResponse.redirect(
        new URL(`/?error=twitter_auth_failed&details=${encodeURIComponent(error)}`, request.url)
      )
    }

    if (!code) {
      return NextResponse.redirect(
        new URL('/?error=twitter_auth_failed&details=no_code', request.url)
      )
    }

    // Get code verifier from cookie
    const codeVerifier = request.cookies.get('twitter_code_verifier')?.value
    if (!codeVerifier) {
      return NextResponse.redirect(
        new URL('/?error=twitter_auth_failed&details=no_code_verifier', request.url)
      )
    }

    // Exchange code for tokens
    console.log('Exchanging code for tokens...')
    const tokens = await exchangeCodeForTokens(code, codeVerifier)
    console.log('Tokens received:', { ...tokens, access_token: tokens.access_token.substring(0, 10) + '...' })

    // Get user information
    console.log('Getting user information...')
    const user = await getTwitterUser(tokens.access_token)
    console.log('User information received:', user)

    // Create session
    const session: TwitterSession = {
      user,
      tokens,
      expiresAt: Date.now() + (tokens.expires_in * 1000)
    }

    // Store session in a secure cookie
    const response = NextResponse.redirect(new URL('/?auth=success', request.url))
    
    response.cookies.set('twitter_session', JSON.stringify(session), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: tokens.expires_in,
      path: '/'
    })

    // Clear the code verifier cookie
    response.cookies.delete('twitter_code_verifier')

    return response
  } catch (error) {
    console.error('Twitter OAuth callback failed:', error)
    return NextResponse.redirect(
      new URL(`/?error=twitter_auth_failed&details=${encodeURIComponent(String(error))}`, request.url)
    )
  }
} 
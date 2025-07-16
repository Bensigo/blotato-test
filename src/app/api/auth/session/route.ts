import { NextRequest, NextResponse } from 'next/server'
import { TwitterSession } from '../../../../lib/twitter-auth'

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('twitter_session')?.value
    
    if (!sessionCookie) {
      return NextResponse.json({ user: null, authenticated: false })
    }

    const session: TwitterSession = JSON.parse(sessionCookie)
    
    // Check if session is expired
    if (Date.now() > session.expiresAt) {
      // Clear expired session
      const response = NextResponse.json({ user: null, authenticated: false })
      response.cookies.delete('twitter_session')
      return response
    }

    // Return user info (without sensitive tokens)
    return NextResponse.json({
      user: session.user,
      authenticated: true,
      expiresAt: session.expiresAt
    })
  } catch (error) {
    console.error('Session check failed:', error)
    return NextResponse.json({ user: null, authenticated: false })
  }
} 
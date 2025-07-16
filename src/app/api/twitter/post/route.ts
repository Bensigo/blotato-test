import { NextRequest, NextResponse } from 'next/server'
import { postTweet, TwitterSession } from '../../../../lib/twitter-auth'

export async function POST(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('twitter_session')?.value
    
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const session: TwitterSession = JSON.parse(sessionCookie)
    
    // Check if session is expired
    if (Date.now() > session.expiresAt) {
      return NextResponse.json(
        { error: 'Session expired' },
        { status: 401 }
      )
    }

    const { text } = await request.json()
    
    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Tweet text is required' },
        { status: 400 }
      )
    }

    if (text.length > 280) {
      return NextResponse.json(
        { error: 'Tweet text exceeds 280 characters' },
        { status: 400 }
      )
    }

    // Post the tweet
    const result = await postTweet(session.tokens.access_token, text)
    
    return NextResponse.json({
      success: true,
      tweet: result.data,
      message: 'Tweet posted successfully!'
    })
  } catch (error) {
    console.error('Tweet posting failed:', error)
    return NextResponse.json(
      { error: 'Failed to post tweet', details: String(error) },
      { status: 500 }
    )
  }
} 
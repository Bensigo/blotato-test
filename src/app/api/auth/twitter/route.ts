import { NextResponse } from 'next/server'
import { generateAuthUrl } from '../../../../lib/twitter-auth'

export async function GET() {
  try {
    const { url, codeVerifier } = await generateAuthUrl()
    
    // Store code verifier in a secure cookie
    const response = NextResponse.redirect(url)
    response.cookies.set('twitter_code_verifier', codeVerifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/'
    })

    return response
  } catch (error) {
    console.error('Twitter auth initiation failed:', error)
    return NextResponse.json(
      { error: 'Failed to initiate Twitter authentication' },
      { status: 500 }
    )
  }
} 
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const response = NextResponse.json({ success: true, message: 'Logged out successfully' })
    
    // Clear all Twitter-related cookies
    response.cookies.delete('twitter_session')
    response.cookies.delete('twitter_code_verifier')
    
    return response
  } catch (error) {
    console.error('Logout failed:', error)
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    )
  }
} 
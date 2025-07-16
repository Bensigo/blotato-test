import { NextRequest, NextResponse } from 'next/server'
import { createPostSchema } from '../../../../lib/validations'
import { HTTP_STATUS, SUCCESS_MESSAGES } from '../../../../lib/constants'
import { moderateContent } from '../../../../lib/openai'
import { createTwitterClient } from '../../../../lib/twitter'
import { db } from '../../../../lib/db'
import { handleValidationError, handleTwitterError, getErrorMessage } from '../../../../utils/error-handler'
import type { ApiResponse } from '../../../../lib/types'

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()
    const { content, accessToken, refreshToken } = body
    
    // Validate content
    const validation = createPostSchema.safeParse({ content })
    if (!validation.success) {
      const error = handleValidationError(validation.error)
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        } as ApiResponse,
        { status: HTTP_STATUS.BAD_REQUEST }
      )
    }

    // Check authentication tokens
    if (!accessToken) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required. Please log in with Twitter.',
        } as ApiResponse,
        { status: HTTP_STATUS.UNAUTHORIZED }
      )
    }

    // Moderate content first
    const moderationResult = await moderateContent(content)
    if (!moderationResult.isAllowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Content flagged for: ${moderationResult.flaggedCategories.join(', ')}`,
          data: {
            moderationResult,
          },
        } as ApiResponse,
        { status: HTTP_STATUS.BAD_REQUEST }
      )
    }

    // Create post in local storage first
    const post = db.addPost({
      content,
      userId: 'current-user', // In a real app, get from session
      status: 'pending',
      moderationResult: moderationResult.moderationResult,
    })

    if (!post) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create post',
        } as ApiResponse,
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      )
    }

    try {
      // Create Twitter client and post tweet
      const twitterClient = createTwitterClient(accessToken, refreshToken)
      const twitterPost = await twitterClient.postTweet(content)

      // Update post with Twitter ID
      db.updatePost(post.id, {
        status: 'posted',
        twitterPostId: twitterPost.id,
      })

      return NextResponse.json(
        {
          success: true,
          message: SUCCESS_MESSAGES.POST_POSTED,
          data: {
            postId: post.id,
            twitterPostId: twitterPost.id,
            post: {
              ...post,
              status: 'posted',
              twitterPostId: twitterPost.id,
            },
            twitterPost,
          },
        } as ApiResponse,
        { status: HTTP_STATUS.CREATED }
      )
    } catch (twitterError) {
      // Update post status to failed
      db.updatePost(post.id, {
        status: 'failed',
      })

      const error = handleTwitterError(twitterError)
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          data: {
            postId: post.id,
            post: {
              ...post,
              status: 'failed',
            },
          },
        } as ApiResponse,
        { status: error.status || HTTP_STATUS.INTERNAL_SERVER_ERROR }
      )
    }
  } catch (error) {
    console.error('Twitter publish API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error),
      } as ApiResponse,
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    )
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: 'Method not allowed',
    } as ApiResponse,
    { status: HTTP_STATUS.METHOD_NOT_ALLOWED }
  )
} 
import { NextRequest, NextResponse } from 'next/server'
import { createPostSchema } from '../../../lib/validations'
import { HTTP_STATUS, SUCCESS_MESSAGES } from '../../../lib/constants'
import { moderateContent } from '../../../lib/openai'
import { db } from '../../../lib/db'
import { handleValidationError, getErrorMessage } from '../../../utils/error-handler'
import type { ApiResponse } from '../../../lib/types'

// Create a new post (without publishing to Twitter)
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()
    
    // Validate request data
    const validation = createPostSchema.safeParse(body)
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

    const { content } = validation.data

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

    // Create post in local storage
    const post = db.addPost({
      content,
      userId: 'current-user', // In a real app, get from session
      status: 'approved',
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

    return NextResponse.json(
      {
        success: true,
        message: SUCCESS_MESSAGES.POST_CREATED,
        data: {
          postId: post.id,
          post,
        },
      } as ApiResponse,
      { status: HTTP_STATUS.CREATED }
    )
  } catch (error) {
    console.error('Create post API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error),
      } as ApiResponse,
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    )
  }
}

// Get all posts
export async function GET() {
  try {
    const posts = db.getPosts()
    
    return NextResponse.json(
      {
        success: true,
        data: {
          posts,
          count: posts.length,
        },
      } as ApiResponse,
      { status: HTTP_STATUS.OK }
    )
  } catch (error) {
    console.error('Get posts API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error),
      } as ApiResponse,
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    )
  }
}

// Update post
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { postId, updates } = body

    if (!postId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Post ID is required',
        } as ApiResponse,
        { status: HTTP_STATUS.BAD_REQUEST }
      )
    }

    const success = db.updatePost(postId, updates)
    
    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Post not found or update failed',
        } as ApiResponse,
        { status: HTTP_STATUS.NOT_FOUND }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Post updated successfully',
      } as ApiResponse,
      { status: HTTP_STATUS.OK }
    )
  } catch (error) {
    console.error('Update post API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error),
      } as ApiResponse,
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    )
  }
}

// Delete post
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const postId = url.searchParams.get('postId')

    if (!postId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Post ID is required',
        } as ApiResponse,
        { status: HTTP_STATUS.BAD_REQUEST }
      )
    }

    const success = db.removePost(postId)
    
    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Post not found',
        } as ApiResponse,
        { status: HTTP_STATUS.NOT_FOUND }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Post deleted successfully',
      } as ApiResponse,
      { status: HTTP_STATUS.OK }
    )
  } catch (error) {
    console.error('Delete post API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error),
      } as ApiResponse,
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    )
  }
} 
import { NextRequest, NextResponse } from 'next/server'
import { moderateContent } from '../../../lib/openai'
import { moderatePostRequestSchema } from '../../../lib/validations'
import { HTTP_STATUS, ERROR_MESSAGES } from '../../../lib/constants'
import { handleValidationError, handleOpenAIError } from '../../../utils/error-handler'
import type { ApiResponse } from '../../../lib/types'

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()
    
    // Validate request data
    const validation = moderatePostRequestSchema.safeParse(body)
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

    // Perform moderation
    const moderationResult = await moderateContent(content)

    // Return moderation result
    return NextResponse.json(
      {
        success: true,
        data: {
          isAllowed: moderationResult.isAllowed,
          flaggedCategories: moderationResult.flaggedCategories,
          confidenceScore: moderationResult.confidenceScore,
          moderationResult: {
            id: moderationResult.moderationResult.id,
            model: moderationResult.moderationResult.model,
            results: moderationResult.moderationResult.results,
          },
        },
      } as ApiResponse,
      { status: HTTP_STATUS.OK }
    )
  } catch (error) {
    console.error('Moderation API error:', error)

    // Handle specific OpenAI errors
    if (error instanceof Error && error.message.includes('OpenAI')) {
      const openAIError = handleOpenAIError(error)
      return NextResponse.json(
        {
          success: false,
          error: openAIError.message,
        } as ApiResponse,
        { status: openAIError.status || HTTP_STATUS.INTERNAL_SERVER_ERROR }
      )
    }

    // Handle generic errors
    return NextResponse.json(
      {
        success: false,
        error: ERROR_MESSAGES.MODERATION_FAILED,
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
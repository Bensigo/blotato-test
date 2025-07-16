import { ERROR_MESSAGES, HTTP_STATUS } from '../lib/constants'
import type { AppError, ApiError } from '../lib/types'

/**
 * Creates a standardized application error
 */
export function createAppError(
  message: string,
  code?: string,
  status?: number,
  context?: Record<string, unknown>
): AppError {
  const error = new Error(message) as AppError
  error.code = code
  error.status = status
  error.context = context
  return error
}

/**
 * Checks if an error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof Error && 'code' in error
}

/**
 * Extracts user-friendly error message from various error types
 */
export function getErrorMessage(error: unknown): string {
  if (typeof error === 'string') {
    return error
  }

  if (error instanceof Error) {
    // Check for specific error types
    if (isAppError(error)) {
      return error.message
    }

    // Handle fetch errors
    if (error.name === 'NetworkError' || error.message.includes('fetch')) {
      return ERROR_MESSAGES.NETWORK_ERROR
    }

    // Handle timeout errors
    if (error.message.includes('timeout')) {
      return 'Request timed out. Please try again.'
    }

    // Handle rate limiting
    if (error.message.includes('rate limit') || error.message.includes('429')) {
      return ERROR_MESSAGES.RATE_LIMIT_EXCEEDED
    }

    // Handle authentication errors
    if (error.message.includes('unauthorized') || error.message.includes('401')) {
      return ERROR_MESSAGES.INVALID_CREDENTIALS
    }

    // Handle validation errors
    if (error.message.includes('validation')) {
      return error.message
    }

    // Return the original message for other errors
    return error.message
  }

  return ERROR_MESSAGES.GENERIC_ERROR
}

/**
 * Maps HTTP status codes to user-friendly messages
 */
export function getHttpErrorMessage(status: number): string {
  switch (status) {
    case HTTP_STATUS.BAD_REQUEST:
      return 'Invalid request. Please check your input and try again.'
    case HTTP_STATUS.UNAUTHORIZED:
      return ERROR_MESSAGES.INVALID_CREDENTIALS
    case HTTP_STATUS.FORBIDDEN:
      return 'You do not have permission to perform this action.'
    case HTTP_STATUS.NOT_FOUND:
      return 'The requested resource was not found.'
    case HTTP_STATUS.METHOD_NOT_ALLOWED:
      return 'This action is not allowed.'
    case HTTP_STATUS.CONFLICT:
      return 'This action conflicts with the current state. Please refresh and try again.'
    case HTTP_STATUS.TOO_MANY_REQUESTS:
      return ERROR_MESSAGES.RATE_LIMIT_EXCEEDED
    case HTTP_STATUS.INTERNAL_SERVER_ERROR:
      return 'Server error occurred. Please try again later.'
    case HTTP_STATUS.BAD_GATEWAY:
      return 'Service temporarily unavailable. Please try again later.'
    case HTTP_STATUS.SERVICE_UNAVAILABLE:
      return 'Service is currently unavailable. Please try again later.'
    case HTTP_STATUS.GATEWAY_TIMEOUT:
      return 'Request timed out. Please try again.'
    default:
      return ERROR_MESSAGES.GENERIC_ERROR
  }
}

/**
 * Creates an API error response
 */
export function createApiError(
  message: string,
  status: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
  code?: string
): ApiError {
  return {
    message,
    status,
    code,
  }
}

/**
 * Handles OpenAI API errors
 */
export function handleOpenAIError(error: unknown): AppError {
  console.error('OpenAI API error:', error)

  if (error instanceof Error) {
    // Handle specific OpenAI errors
    if (error.message.includes('API key')) {
      return createAppError(
        'Invalid OpenAI API key configuration.',
        'OPENAI_AUTH_ERROR',
        HTTP_STATUS.UNAUTHORIZED
      )
    }

    if (error.message.includes('quota') || error.message.includes('billing')) {
      return createAppError(
        'OpenAI API quota exceeded. Please contact support.',
        'OPENAI_QUOTA_ERROR',
        HTTP_STATUS.TOO_MANY_REQUESTS
      )
    }

    if (error.message.includes('rate limit')) {
      return createAppError(
        'OpenAI API rate limit exceeded. Please try again later.',
        'OPENAI_RATE_LIMIT',
        HTTP_STATUS.TOO_MANY_REQUESTS
      )
    }

    if (error.message.includes('timeout')) {
      return createAppError(
        'OpenAI API request timed out. Please try again.',
        'OPENAI_TIMEOUT',
        HTTP_STATUS.GATEWAY_TIMEOUT
      )
    }
  }

  return createAppError(
    ERROR_MESSAGES.OPENAI_API_ERROR,
    'OPENAI_ERROR',
    HTTP_STATUS.INTERNAL_SERVER_ERROR,
    { originalError: error }
  )
}

/**
 * Handles Twitter API errors
 */
export function handleTwitterError(error: unknown): AppError {
  console.error('Twitter API error:', error)

  if (error instanceof Error) {
    // Handle specific Twitter API errors
    if (error.message.includes('unauthorized') || error.message.includes('401')) {
      return createAppError(
        ERROR_MESSAGES.INVALID_CREDENTIALS,
        'TWITTER_AUTH_ERROR',
        HTTP_STATUS.UNAUTHORIZED
      )
    }

    if (error.message.includes('forbidden') || error.message.includes('403')) {
      return createAppError(
        'Twitter API access forbidden. Please check your permissions.',
        'TWITTER_FORBIDDEN',
        HTTP_STATUS.FORBIDDEN
      )
    }

    if (error.message.includes('rate limit') || error.message.includes('429')) {
      return createAppError(
        'Twitter API rate limit exceeded. Please try again later.',
        'TWITTER_RATE_LIMIT',
        HTTP_STATUS.TOO_MANY_REQUESTS
      )
    }

    if (error.message.includes('duplicate')) {
      return createAppError(
        'This post has already been published.',
        'TWITTER_DUPLICATE',
        HTTP_STATUS.CONFLICT
      )
    }

    if (error.message.includes('timeout')) {
      return createAppError(
        'Twitter API request timed out. Please try again.',
        'TWITTER_TIMEOUT',
        HTTP_STATUS.GATEWAY_TIMEOUT
      )
    }
  }

  return createAppError(
    ERROR_MESSAGES.TWITTER_API_ERROR,
    'TWITTER_ERROR',
    HTTP_STATUS.INTERNAL_SERVER_ERROR,
    { originalError: error }
  )
}

/**
 * Handles validation errors
 */
export function handleValidationError(error: unknown): AppError {
  if (error instanceof Error) {
    // Handle Zod validation errors
    if (error.name === 'ZodError') {
      const zodError = error as { errors?: Array<{ message: string }> }
      const messages = zodError.errors?.map((err) => err.message) || []
      return createAppError(
        messages.length > 0 ? messages.join(', ') : 'Validation failed',
        'VALIDATION_ERROR',
        HTTP_STATUS.BAD_REQUEST,
        { validationErrors: zodError.errors }
      )
    }

    return createAppError(
      error.message,
      'VALIDATION_ERROR',
      HTTP_STATUS.BAD_REQUEST
    )
  }

  return createAppError(
    'Validation failed',
    'VALIDATION_ERROR',
    HTTP_STATUS.BAD_REQUEST
  )
}

/**
 * Handles storage errors
 */
export function handleStorageError(error: unknown): AppError {
  console.error('Storage error:', error)

  if (error instanceof Error) {
    if (error.name === 'QuotaExceededError') {
      return createAppError(
        ERROR_MESSAGES.STORAGE_FULL,
        'STORAGE_QUOTA_EXCEEDED',
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      )
    }

    if (error.message.includes('localStorage')) {
      return createAppError(
        'Browser storage is not available. Please enable localStorage.',
        'STORAGE_UNAVAILABLE',
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      )
    }
  }

  return createAppError(
    'Storage operation failed. Please try again.',
    'STORAGE_ERROR',
    HTTP_STATUS.INTERNAL_SERVER_ERROR,
    { originalError: error }
  )
}

/**
 * Logs errors with context for debugging
 */
export function logError(error: unknown, context?: Record<string, unknown>): void {
  const timestamp = new Date().toISOString()
  const errorInfo = {
    timestamp,
    error: {
      message: getErrorMessage(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : typeof error,
    },
    context,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    url: typeof window !== 'undefined' ? window.location.href : undefined,
  }

  console.error('Application Error:', errorInfo)

  // In production, you might want to send this to an error tracking service
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    // Example: Send to error tracking service
    // errorTrackingService.log(errorInfo)
  }
}

/**
 * Safe async function wrapper that handles errors
 */
export function withErrorHandler<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  errorHandler?: (error: unknown) => void
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args)
    } catch (error) {
      logError(error, { function: fn.name, args })
      if (errorHandler) {
        errorHandler(error)
      } else {
        throw error
      }
    }
  }) as T
}

/**
 * Retry function with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: unknown

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      
      if (attempt === maxAttempts) {
        break
      }

      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt - 1)
      const jitter = Math.random() * 1000
      await new Promise(resolve => setTimeout(resolve, delay + jitter))
      
      logError(error, { attempt, maxAttempts })
    }
  }

  throw lastError
} 
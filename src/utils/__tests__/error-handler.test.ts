import { describe, it, expect } from 'vitest'
import { createApiError } from '../error-handler'
import { HTTP_STATUS, ERROR_MESSAGES } from '../../lib/constants'

describe('Error Handler', () => {
  describe('createApiError', () => {
    it('should create API error with default values', () => {
      const error = createApiError('Test error')
      
      expect(error).toEqual({
        message: 'Test error',
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        code: undefined,
      })
    })

    it('should create API error with custom status', () => {
      const error = createApiError('Validation failed', HTTP_STATUS.BAD_REQUEST)
      
      expect(error).toEqual({
        message: 'Validation failed',
        status: HTTP_STATUS.BAD_REQUEST,
        code: undefined,
      })
    })

    it('should create API error with custom code', () => {
      const error = createApiError('Not found', HTTP_STATUS.NOT_FOUND, 'NOT_FOUND')
      
      expect(error).toEqual({
        message: 'Not found',
        status: HTTP_STATUS.NOT_FOUND,
        code: 'NOT_FOUND',
      })
    })

    it('should handle empty message', () => {
      const error = createApiError('')
      
      expect(error).toEqual({
        message: '',
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        code: undefined,
      })
    })

    it('should use constants for common errors', () => {
      const error = createApiError(ERROR_MESSAGES.MODERATION_FAILED, HTTP_STATUS.SERVICE_UNAVAILABLE)
      
      expect(error.message).toBe(ERROR_MESSAGES.MODERATION_FAILED)
      expect(error.status).toBe(HTTP_STATUS.SERVICE_UNAVAILABLE)
    })

    it('should handle different HTTP status codes', () => {
      const statuses = [
        HTTP_STATUS.BAD_REQUEST,
        HTTP_STATUS.UNAUTHORIZED,
        HTTP_STATUS.FORBIDDEN,
        HTTP_STATUS.NOT_FOUND,
        HTTP_STATUS.TOO_MANY_REQUESTS,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ]

      statuses.forEach(status => {
        const error = createApiError('Test error', status)
        expect(error.status).toBe(status)
        expect(typeof error.status).toBe('number')
      })
    })

    it('should handle different error codes', () => {
      const codes = ['VALIDATION_ERROR', 'AUTH_ERROR', 'RATE_LIMIT_ERROR', 'API_ERROR']

      codes.forEach(code => {
        const error = createApiError('Test error', HTTP_STATUS.BAD_REQUEST, code)
        expect(error.code).toBe(code)
        expect(typeof error.code).toBe('string')
      })
    })
  })

  describe('Error structure validation', () => {
    it('should return consistent error structure', () => {
      const error = createApiError('Test', HTTP_STATUS.OK, 'TEST')
      
      expect(error).toHaveProperty('message')
      expect(error).toHaveProperty('status')
      expect(error).toHaveProperty('code')
      expect(Object.keys(error)).toEqual(['message', 'status', 'code'])
    })

    it('should have correct property types', () => {
      const error = createApiError('Test message', HTTP_STATUS.NOT_FOUND, 'TEST_CODE')
      
      expect(typeof error.message).toBe('string')
      expect(typeof error.status).toBe('number')
      expect(typeof error.code).toBe('string')
    })
  })
}) 
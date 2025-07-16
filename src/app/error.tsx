'use client'

import { useEffect } from 'react'
import { Button } from '../components/ui'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <div className="text-center space-y-6 max-w-md mx-auto">
        {/* Error icon */}
        <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
          <svg
            className="w-8 h-8 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>

        {/* Error message */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Something went wrong
          </h1>
          <p className="text-gray-600 mb-4">
            An unexpected error occurred while processing your request.
          </p>
          
          {/* Show error details in development */}
          {process.env.NODE_ENV === 'development' && (
            <details className="text-left bg-gray-50 p-4 rounded-lg border text-sm">
              <summary className="cursor-pointer font-medium text-gray-700 mb-2">
                Error Details (Development Only)
              </summary>
              <pre className="whitespace-pre-wrap text-red-700 overflow-auto">
                {error.message}
                {error.stack && (
                  <>
                    {'\n\nStack Trace:\n'}
                    {error.stack}
                  </>
                )}
                {error.digest && (
                  <>
                    {'\n\nError ID: '}
                    {error.digest}
                  </>
                )}
              </pre>
            </details>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={reset} className="min-w-[120px]">
            Try Again
          </Button>
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/'}
            className="min-w-[120px]"
          >
            Go Home
          </Button>
        </div>

        {/* Help text */}
        <p className="text-sm text-gray-500">
          If this problem persists, please contact support with error ID:{' '}
          <code className="bg-gray-100 px-2 py-1 rounded text-xs">
            {error.digest || 'N/A'}
          </code>
        </p>
      </div>
    </div>
  )
} 
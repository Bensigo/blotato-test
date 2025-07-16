'use client'

import { LoadingSpinner } from '../components/ui'

export default function Loading() {
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <div className="text-center space-y-4">
        <LoadingSpinner size="xl" />
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-1">
            Loading...
          </h2>
          <p className="text-gray-600">
            Please wait while we prepare your content
          </p>
        </div>
      </div>
    </div>
  )
} 
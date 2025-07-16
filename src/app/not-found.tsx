'use client'

import Link from 'next/link'
import { Button } from '../components/ui'

export default function NotFound() {
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <div className="text-center space-y-6 max-w-md mx-auto">
        {/* 404 Icon */}
        <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
          <span className="text-4xl font-bold text-gray-400">404</span>
        </div>

        {/* Message */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Page Not Found
          </h1>
          <p className="text-gray-600 mb-4">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={() => window.history.back()} variant="outline">
            Go Back
          </Button>
          <Button onClick={() => window.location.href = '/'}>
            Go Home
          </Button>
        </div>

        {/* Helpful links */}
        <div className="border-t pt-6">
          <p className="text-sm text-gray-500 mb-3">
            You might be looking for:
          </p>
          <div className="space-y-1">
            <Link 
              href="/" 
              className="block text-blue-600 hover:text-blue-800 text-sm"
            >
              → Create a new post
            </Link>
            <a 
              href="/api/health" 
              className="block text-blue-600 hover:text-blue-800 text-sm"
            >
              → System health check
            </a>
            <a 
              href="https://github.com" 
              className="block text-blue-600 hover:text-blue-800 text-sm"
              target="_blank"
              rel="noopener noreferrer"
            >
              → View documentation
            </a>
          </div>
        </div>
      </div>
    </div>
  )
} 
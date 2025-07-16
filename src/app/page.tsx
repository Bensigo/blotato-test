'use client'

import { useState, useEffect } from 'react'
import { Button } from '../components/ui'
import { moderateContentAPI } from '../lib/api-client'
import { getCharacterCount, isValidPostLength } from '../lib/validations'
import { POST_LIMITS } from '../lib/constants'

interface TwitterUser {
  id: string
  name: string
  username: string
  profile_image_url?: string
  verified?: boolean
}

interface SessionData {
  user: TwitterUser | null
  authenticated: boolean
  expiresAt?: number
}

export default function HomePage() {
  const [session, setSession] = useState<SessionData>({ user: null, authenticated: false })
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{
    type: 'success' | 'error' | 'moderation'
    message: string
    details?: string[]
  } | null>(null)

  useEffect(() => {
    checkSession()
  }, [])

  // Auto-save draft functionality
  useEffect(() => {
    if (content.trim()) {
      const timer = setTimeout(() => {
        localStorage.setItem('blotato_draft', content)
      }, 2000) // Save after 2 seconds of inactivity

      return () => clearTimeout(timer)
    }
  }, [content])

  // Load saved draft on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem('blotato_draft')
    if (savedDraft && !content) {
      setContent(savedDraft)
    }
  }, [])

  const checkSession = async () => {
    try {
      const response = await fetch('/api/auth/session')
      const data = await response.json()
      setSession(data)
    } catch (error) {
      console.error('Session check failed:', error)
      setSession({ user: null, authenticated: false })
    } finally {
      setLoading(false)
    }
  }

  const charInfo = getCharacterCount(content)
  const charCount = charInfo.current
  const isOverLimit = !isValidPostLength(content)
  const isNearLimit = charInfo.status === 'warning'

  const handleSubmit = async () => {
    if (!content.trim()) {
      setResult({ type: 'error', message: 'Please enter some content to post.' })
      return
    }

    if (isOverLimit) {
      setResult({ type: 'error', message: 'Content exceeds 280 character limit.' })
      return
    }

    if (!session.authenticated) {
      setResult({ type: 'error', message: 'Please sign in with Twitter to post.' })
      return
    }

    setIsLoading(true)
    setResult(null)

    try {
      // Step 1: Moderate content
      const moderationResult = await moderateContentAPI(content)
      
      // Debug logging for moderation
      console.log('Moderation result:', {
        content: content,
        isAllowed: moderationResult.isAllowed,
        flaggedCategories: moderationResult.flaggedCategories,
        confidenceScore: moderationResult.confidenceScore
      })
      
      if (!moderationResult.isAllowed) {
        // Get human-readable category names
        const categoryNames = moderationResult.flaggedCategories.map(category => {
          const displayNames: Record<string, string> = {
            hate: 'Hate Speech',
            'hate/threatening': 'Threatening Hate Speech', 
            harassment: 'Harassment',
            'harassment/threatening': 'Threatening Harassment',
            'self-harm': 'Self-Harm Content',
            'self-harm/intent': 'Self-Harm Intent',
            'self-harm/instructions': 'Self-Harm Instructions',
            sexual: 'Sexual Content',
            'sexual/minors': 'Sexual Content Involving Minors',
            violence: 'Violence',
            'violence/graphic': 'Graphic Violence',
          }
          return displayNames[category] || category
        })

        setResult({
          type: 'moderation',
          message: `Content blocked by AI moderation. Detected: ${categoryNames.join(', ')}`,
          details: moderationResult.flaggedCategories
        })
        setIsLoading(false)
        return
      }

      // Step 2: Post to Twitter
      const response = await fetch('/api/twitter/post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: content })
      })

      const postResult = await response.json()
      
      if (response.ok) {
        setResult({
          type: 'success',
          message: 'Tweet posted successfully to Twitter!'
        })
      } else {
        setResult({
          type: 'error',
          message: `Failed to post tweet: ${postResult.error}`
        })
        setIsLoading(false)
        return
      }
      
      // Clear content on success
      setContent('')
      
    } catch (error) {
      setResult({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to process post'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignIn = () => {
    window.location.href = '/api/auth/twitter'
  }

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setSession({ user: null, authenticated: false })
      setContent('')
      setResult(null)
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            AI Social Media Moderator
          </h1>
          <p className="text-gray-600">
            Automatically detect and filter spammy or abusive content before posting to Twitter
          </p>
        </div>

        {/* Authentication */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full mr-2"></div>
              <span className="text-gray-600">Loading...</span>
            </div>
          ) : session.authenticated && session.user ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {session.user.profile_image_url && (
                  <img
                    src={session.user.profile_image_url}
                    alt="Profile"
                    className="w-10 h-10 rounded-full"
                  />
                )}
                <div>
                  <div className="font-medium text-gray-900">
                    {session.user.name || 'Twitter User'}
                  </div>
                  <div className="text-sm text-gray-600">
                    @{session.user.username || 'username'}
                  </div>
                </div>
                <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                  Authenticated
                </div>
              </div>
              
              <Button 
                variant="outline" 
                onClick={handleSignOut}
                className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 font-medium"
              >
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="text-center">
              <div className="mb-4">
                <div className="bg-yellow-100 text-yellow-800 px-3 py-2 rounded-lg text-sm mb-4">
                  ⚠️ Sign in with Twitter to enable posting
                </div>
              </div>
              <Button 
                onClick={handleSignIn}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
                Sign in with Twitter
              </Button>
            </div>
          )}
        </div>

        {/* Post Creation */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Create Post
          </h2>
          
          {/* Textarea */}
          <div className="mb-4">
            <textarea
              data-testid="post-textarea"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's happening? (Content will be automatically moderated for spam and abuse)"
              className={`w-full h-32 p-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 ${
                isOverLimit ? 'border-red-500' : 'border-gray-300'
              }`}
              maxLength={POST_LIMITS.MAX_LENGTH + 50} // Allow slight over-typing for UX
              disabled={isLoading}
            />
            
            {/* Character Counter */}
            <div className="flex justify-between items-center mt-2">
              <div className="text-sm text-gray-600">
                {content.length > 0 && (
                  <span>AI moderation will check for: spam, abuse, hate speech, harassment</span>
                )}
              </div>
              <div 
                data-testid="character-counter"
                className={`text-sm font-mono ${
                  isOverLimit ? 'text-red-600' : 
                  isNearLimit ? 'text-yellow-600' : 
                  'text-gray-500'
                }`}
              >
                {charCount} / {POST_LIMITS.MAX_LENGTH}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-between items-center">
            <Button
              data-testid="clear-button"
              variant="outline"
              onClick={() => {
                setContent('')
                setResult(null)
              }}
              disabled={isLoading || !content.trim()}
            >
              Clear
            </Button>
            
            <Button
              data-testid="save-post-button"
              onClick={handleSubmit}
              disabled={isLoading || !content.trim() || isOverLimit || !session.authenticated}
              loading={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? 'Processing...' : 'Moderate & Post'}
            </Button>
          </div>
        </div>

        {/* Results */}
        {result && (
          <div 
            data-testid="toast"
            className={`mt-6 p-4 rounded-lg border-2 shadow-sm ${
              result.type === 'success' ? 'bg-green-50 border-green-300' :
              result.type === 'moderation' ? 'bg-red-50 border-red-300' :
              'bg-red-50 border-red-300'
            }`}
          >
            <div className={`font-bold text-lg ${
              result.type === 'success' ? 'text-green-800' :
              result.type === 'moderation' ? 'text-red-800' :
              'text-red-800'
            }`}>
              {result.type === 'success' && '✅ Tweet Posted Successfully!'}
              {result.type === 'moderation' && '🚫 Content Blocked by AI Moderation'}
              {result.type === 'error' && '❌ Error Occurred'}
            </div>
            
            <div className={`mt-2 text-base ${
              result.type === 'success' ? 'text-green-700' :
              result.type === 'moderation' ? 'text-red-700' :
              'text-red-700'
            }`}>
              {result.message}
            </div>
            
            {result.details && result.type === 'moderation' && (
              <div data-testid="moderation-feedback" className="mt-3 p-3 bg-white rounded border border-red-200">
                <div className="text-sm font-medium text-red-800 mb-1">
                  Why was this blocked?
                </div>
                <div className="text-sm text-red-700">
                  Your content was flagged for: <strong>{result.details.join(', ')}</strong>
                </div>
                <div className="text-xs text-red-600 mt-2">
                  Please revise your message to remove inappropriate content and try again.
                </div>
              </div>
            )}
            
            {/* Clear button for moderation blocks */}
            {result.type === 'moderation' && (
              <button
                onClick={() => {
                  setResult(null)
                  setContent('')
                }}
                className="mt-3 px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
              >
                Clear and Try Again
              </button>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Powered by OpenAI GPT-4 moderation • Twitter API v2 • Next.js</p>
        </div>
      </div>
    </div>
  )
}

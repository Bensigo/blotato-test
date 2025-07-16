'use client'
import React, { useState, useCallback, useEffect } from 'react'
import { Button, Textarea, LoadingSpinner } from '../ui'
import CharacterCounter from './character-counter'
import { POST_LIMITS, LOADING_MESSAGES, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../../lib/constants'
import { getCharacterCount, isValidPostLength } from '../../lib/validations'
import { moderateContentAPI, type ModerationResponse } from '../../lib/api-client'
import { db } from '../../lib/db'
import { createAppError, getErrorMessage } from '../../utils/error-handler'
import type { LoadingState } from '../../lib/types'

export interface CreatePostProps {
  onPostCreated?: (postId: string) => void
  onPostPublished?: (postId: string, twitterId: string) => void
  onError?: (error: string) => void
  onSuccess?: (message: string) => void
  className?: string
}

const CreatePost: React.FC<CreatePostProps> = ({
  onPostCreated,
  onPostPublished,
  onError,
  onSuccess,
  className,
}) => {
  const [content, setContent] = useState('')
  const [moderationState, setModerationState] = useState<LoadingState>('idle')
  const [postingState, setPostingState] = useState<LoadingState>('idle')
  const [moderationResult, setModerationResult] = useState<ModerationResponse | null>(null)
  const [lastModeratedContent, setLastModeratedContent] = useState('')
  const [draftId, setDraftId] = useState<string | null>(null)

  // Auto-save draft functionality
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (content.trim() && content !== lastModeratedContent) {
        saveDraft()
      }
    }, 2000) // Auto-save after 2 seconds of inactivity

    return () => clearTimeout(timeoutId)
  }, [content, lastModeratedContent])

  const saveDraft = useCallback(() => {
    try {
      if (draftId) {
        db.updateDraft(draftId, content)
      } else {
        const draft = db.addDraft(content)
        if (draft) {
          setDraftId(draft.id)
        }
      }
    } catch (error) {
      console.error('Failed to save draft:', error)
    }
  }, [content, draftId])

  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value
    setContent(newContent)
    
    // Reset moderation if content changed significantly
    if (moderationResult && newContent !== lastModeratedContent) {
      setModerationResult(null)
    }
  }, [moderationResult, lastModeratedContent])

  const moderatePost = useCallback(async () => {
    if (!content.trim()) {
      onError?.(ERROR_MESSAGES.POST_EMPTY)
      return false
    }

    if (!isValidPostLength(content)) {
      onError?.(ERROR_MESSAGES.POST_TOO_LONG)
      return false
    }

    // Skip moderation if content hasn't changed
    if (moderationResult && content === lastModeratedContent) {
      return moderationResult.isAllowed
    }

    setModerationState('loading')

    try {
      const result = await moderateContentAPI(content)
      setModerationResult(result)
      setLastModeratedContent(content)
      setModerationState('success')

      if (!result.isAllowed) {
        const flaggedCategories = result.flaggedCategories.join(', ')
        onError?.(`Content flagged for: ${flaggedCategories}. Please revise your post.`)
        return false
      }

      return true
    } catch (error) {
      setModerationState('error')
      onError?.(getErrorMessage(error))
      return false
    }
  }, [content, moderationResult, lastModeratedContent, onError])

  const createPost = useCallback(async () => {
    const isModerated = await moderatePost()
    if (!isModerated) return

    try {
             const post = db.addPost({
         content,
         userId: 'current-user', // In a real app, get from auth context
         status: 'approved',
         moderationResult: moderationResult?.moderationResult,
       })

      if (!post) {
        throw createAppError('Failed to save post')
      }

      // Clear draft after successful post creation
      if (draftId) {
        db.removeDraft(draftId)
        setDraftId(null)
      }

      setContent('')
      setModerationResult(null)
      setLastModeratedContent('')
      
      onPostCreated?.(post.id)
      onSuccess?.(SUCCESS_MESSAGES.POST_CREATED)
      
      return post.id
    } catch (error) {
      onError?.(getErrorMessage(error))
      return null
    }
  }, [content, moderationResult, draftId, moderatePost, onPostCreated, onSuccess, onError])

  const publishToTwitter = useCallback(async () => {
    setPostingState('loading')

    try {
      const postId = await createPost()
      if (!postId) {
        setPostingState('error')
        return
      }

      // In a real implementation, this would call the Twitter API
      // For now, we'll simulate the API call
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Simulate Twitter API response
      const mockTwitterId = `twitter_${Date.now()}`
      
      // Update post with Twitter ID
      db.updatePost(postId, {
        status: 'posted',
        twitterPostId: mockTwitterId,
      })

      setPostingState('success')
      onPostPublished?.(postId, mockTwitterId)
      onSuccess?.(SUCCESS_MESSAGES.POST_POSTED)
    } catch (error) {
      setPostingState('error')
      onError?.(getErrorMessage(error))
    }
  }, [createPost, onPostPublished, onSuccess, onError])

  const clearContent = useCallback(() => {
    setContent('')
    setModerationResult(null)
    setLastModeratedContent('')
    if (draftId) {
      db.removeDraft(draftId)
      setDraftId(null)
    }
  }, [draftId])

  const charCount = getCharacterCount(content)
  const isContentValid = isValidPostLength(content) && content.trim().length > 0
  const canModerate = isContentValid && moderationState !== 'loading'
  const canPost = isContentValid && moderationResult?.isAllowed && postingState !== 'loading'

  return (
    <div className={className}>
      <div className="space-y-4">
        {/* Main textarea */}
        <div className="relative">
          <Textarea
            value={content}
            onChange={handleContentChange}
            placeholder="What's happening?"
            maxLength={POST_LIMITS.MAX_LENGTH}
            showCharacterCount={false}
            className="min-h-[120px] text-lg resize-none"
            disabled={postingState === 'loading'}
          />
          
          {/* Moderation status indicator */}
          {moderationState === 'loading' && (
            <div className="absolute top-2 right-2">
              <LoadingSpinner size="sm" />
            </div>
          )}
        </div>

        {/* Character counter */}
        <CharacterCounter
          content={content}
          maxLength={POST_LIMITS.MAX_LENGTH}
          showRemaining={true}
        />

        {/* Moderation feedback */}
        {moderationResult && (
          <div className={`p-3 rounded-md text-sm ${
            moderationResult.isAllowed 
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {moderationResult.isAllowed ? (
              <div className="flex items-center space-x-2">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Content passed moderation checks</span>
              </div>
            ) : (
              <div className="flex items-start space-x-2">
                <svg className="h-4 w-4 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="font-medium">Content flagged for moderation</p>
                  {moderationResult.flaggedCategories.length > 0 && (
                    <p className="mt-1">Categories: {moderationResult.flaggedCategories.join(', ')}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex justify-between items-center">
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearContent}
              disabled={!content.trim() || postingState === 'loading'}
            >
              Clear
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={saveDraft}
              disabled={!content.trim() || postingState === 'loading'}
            >
              Save Draft
            </Button>
          </div>

          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={moderatePost}
              disabled={!canModerate}
              loading={moderationState === 'loading'}
            >
              {moderationState === 'loading' ? LOADING_MESSAGES.MODERATING : 'Check Content'}
            </Button>

            <Button
              variant="secondary"
              onClick={createPost}
              disabled={!canPost}
            >
              Save Post
            </Button>

            <Button
              onClick={publishToTwitter}
              disabled={!canPost}
              loading={postingState === 'loading'}
            >
              {postingState === 'loading' ? LOADING_MESSAGES.POSTING : 'Post to Twitter'}
            </Button>
          </div>
        </div>

        {/* Loading state overlay */}
        {postingState === 'loading' && (
          <div className="text-center py-4">
            <LoadingSpinner size="lg" />
            <p className="mt-2 text-gray-600">{LOADING_MESSAGES.POSTING}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default CreatePost 
import React from 'react'
import { clsx } from 'clsx'
import type { BaseComponentProps } from '../../lib/types'

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    BaseComponentProps {
  error?: string
  showCharacterCount?: boolean
  maxLength?: number
  helperText?: string
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ 
    className, 
    error, 
    showCharacterCount = false, 
    maxLength, 
    helperText, 
    value = '', 
    ...props 
  }, ref) => {
    const currentLength = typeof value === 'string' ? value.length : 0
    const isOverLimit = maxLength && currentLength > maxLength
    const isNearLimit = maxLength && currentLength > maxLength * 0.8

    return (
      <div className="space-y-2">
        <textarea
          className={clsx(
            'flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2',
            'text-sm ring-offset-white placeholder:text-gray-500',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'resize-none',
            error && 'border-red-500 focus-visible:ring-red-500',
            isOverLimit && 'border-red-500',
            className
          )}
          ref={ref}
          value={value}
          maxLength={maxLength}
          {...props}
        />
        
        <div className="flex justify-between items-center text-sm">
          <div>
            {error && (
              <p className="text-red-600">{error}</p>
            )}
            {!error && helperText && (
              <p className="text-gray-500">{helperText}</p>
            )}
          </div>
          
          {showCharacterCount && maxLength && (
            <div
              className={clsx(
                'text-xs font-mono',
                isOverLimit && 'text-red-600',
                isNearLimit && !isOverLimit && 'text-yellow-600',
                !isNearLimit && 'text-gray-500'
              )}
            >
              {currentLength}/{maxLength}
            </div>
          )}
        </div>
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'

export default Textarea 
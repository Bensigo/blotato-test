'use client'
import React from 'react'
import { clsx } from 'clsx'
import { getCharacterCount } from '../../lib/validations'
import type { CharacterCount } from '../../lib/types'

export interface CharacterCounterProps {
  content: string
  maxLength: number
  className?: string
  showPercentage?: boolean
  showRemaining?: boolean
}

const CharacterCounter: React.FC<CharacterCounterProps> = ({
  content,
  maxLength,
  className,
  showPercentage = false,
  showRemaining = false,
}) => {
  const count: CharacterCount = getCharacterCount(content)

  const getStatusColor = () => {
    switch (count.status) {
      case 'danger':
        return 'text-red-600'
      case 'warning':
        return 'text-yellow-600'
      case 'safe':
      default:
        return 'text-gray-500'
    }
  }

  const getProgressBarColor = () => {
    switch (count.status) {
      case 'danger':
        return 'bg-red-500'
      case 'warning':
        return 'bg-yellow-500'
      case 'safe':
      default:
        return 'bg-blue-500'
    }
  }

  return (
    <div className={clsx('space-y-2', className)}>
      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-1">
        <div
          className={clsx(
            'h-1 rounded-full transition-all duration-200',
            getProgressBarColor()
          )}
          style={{ width: `${Math.min(count.percentage, 100)}%` }}
        />
      </div>

      {/* Counter display */}
      <div className={clsx('flex justify-between items-center text-xs', getStatusColor())}>
        <div className="space-x-2">
          {showPercentage && (
            <span className="font-mono">
              {Math.round(count.percentage)}%
            </span>
          )}
          
          {showRemaining && (
            <span className="font-mono">
              {count.remaining >= 0 ? `${count.remaining} left` : `${Math.abs(count.remaining)} over`}
            </span>
          )}
        </div>

        <div className="font-mono font-medium">
          {count.current}/{count.max}
        </div>
      </div>

      {/* Warning messages */}
      {count.status === 'warning' && (
        <div className="text-xs text-yellow-700 bg-yellow-50 px-2 py-1 rounded">
          Approaching character limit
        </div>
      )}

      {count.status === 'danger' && (
        <div className="text-xs text-red-700 bg-red-50 px-2 py-1 rounded">
          {count.remaining >= 0 
            ? 'Character limit reached' 
            : `${Math.abs(count.remaining)} characters over limit`
          }
        </div>
      )}
    </div>
  )
}

export default CharacterCounter 
'use client'

import React, { useEffect } from 'react'
import { clsx } from 'clsx'
import { cva, type VariantProps } from 'class-variance-authority'
import type { Toast as ToastType } from '../../lib/types'

const toastVariants = cva(
  [
    'group pointer-events-auto relative flex w-full items-center justify-between',
    'space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all',
    'data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)]',
    'data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none',
    'data-[state=open]:animate-in data-[state=closed]:animate-out',
    'data-[swipe=end]:animate-out data-[state=closed]:fade-out-80',
    'data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full',
    'data-[state=open]:sm:slide-in-from-bottom-full',
  ],
  {
    variants: {
      variant: {
        default: 'border bg-white text-gray-950',
        destructive: 'destructive group border-red-500 bg-red-50 text-red-900',
        success: 'border-green-500 bg-green-50 text-green-900',
        warning: 'border-yellow-500 bg-yellow-50 text-yellow-900',
        info: 'border-blue-500 bg-blue-50 text-blue-900',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface ToastProps extends VariantProps<typeof toastVariants> {
  toast: ToastType
  onRemove: (id: string) => void
}

const Toast: React.FC<ToastProps> = ({ toast, onRemove, variant }) => {
  const { id, type, title, description, duration = 5000 } = toast

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onRemove(id)
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [id, duration, onRemove])

  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <svg
            className="h-5 w-5 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        )
      case 'error':
        return (
          <svg
            className="h-5 w-5 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        )
      case 'warning':
        return (
          <svg
            className="h-5 w-5 text-yellow-600"
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
        )
      case 'info':
        return (
          <svg
            className="h-5 w-5 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        )
      default:
        return null
    }
  }

  const toastVariant = variant || type === 'error' ? 'destructive' : type

  return (
    <div className={clsx(toastVariants({ variant: toastVariant }))}>
      <div className="flex items-start space-x-3">
        {getIcon()}
        <div className="flex-1 min-w-0">
          <div className="font-semibold">{title}</div>
          {description && (
            <div className="mt-1 text-sm opacity-90">{description}</div>
          )}
        </div>
      </div>
      
      <button
        onClick={() => onRemove(id)}
        className={clsx(
          'absolute right-2 top-2 rounded-md p-1 transition-opacity',
          'hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2',
          'opacity-70 focus:ring-offset-2'
        )}
      >
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
        <span className="sr-only">Close</span>
      </button>
    </div>
  )
}

export default Toast 
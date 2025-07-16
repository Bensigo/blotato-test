import React from 'react'
import { clsx } from 'clsx'
import { cva, type VariantProps } from 'class-variance-authority'
import type { BaseComponentProps } from '../../lib/types'

const spinnerVariants = cva(
  'animate-spin rounded-full border-solid border-current border-r-transparent',
  {
    variants: {
      size: {
        sm: 'h-4 w-4 border-2',
        default: 'h-6 w-6 border-2',
        lg: 'h-8 w-8 border-3',
        xl: 'h-12 w-12 border-4',
      },
      variant: {
        default: 'text-blue-600',
        white: 'text-white',
        gray: 'text-gray-500',
        current: 'text-current',
      },
    },
    defaultVariants: {
      size: 'default',
      variant: 'default',
    },
  }
)

export interface LoadingSpinnerProps
  extends VariantProps<typeof spinnerVariants>,
    BaseComponentProps {
  label?: string
  center?: boolean
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size,
  variant,
  className,
  label = 'Loading...',
  center = false,
}) => {
  const spinner = (
    <div
      className={clsx(spinnerVariants({ size, variant }), className)}
      role="status"
      aria-label={label}
    >
      <span className="sr-only">{label}</span>
    </div>
  )

  if (center) {
    return (
      <div className="flex items-center justify-center p-4">
        {spinner}
      </div>
    )
  }

  return spinner
}

export default LoadingSpinner 
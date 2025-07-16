import { useState, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { UI } from '../lib/constants'
import type { Toast } from '../lib/types'

export interface UseToastReturn {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => string
  removeToast: (id: string) => void
  clearToasts: () => void
  success: (title: string, description?: string) => string
  error: (title: string, description?: string) => string
  warning: (title: string, description?: string) => string
  info: (title: string, description?: string) => string
}

export function useToast(): UseToastReturn {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = uuidv4()
    const newToast: Toast = {
      id,
      duration: UI.TOAST_DURATION_MS,
      ...toast,
    }

    setToasts(prev => [...prev, newToast])
    return id
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const clearToasts = useCallback(() => {
    setToasts([])
  }, [])

  // Convenience methods for different toast types
  const success = useCallback((title: string, description?: string) => {
    return addToast({
      type: 'success',
      title,
      description,
    })
  }, [addToast])

  const error = useCallback((title: string, description?: string) => {
    return addToast({
      type: 'error',
      title,
      description,
    })
  }, [addToast])

  const warning = useCallback((title: string, description?: string) => {
    return addToast({
      type: 'warning',
      title,
      description,
    })
  }, [addToast])

  const info = useCallback((title: string, description?: string) => {
    return addToast({
      type: 'info',
      title,
      description,
    })
  }, [addToast])

  return {
    toasts,
    addToast,
    removeToast,
    clearToasts,
    success,
    error,
    warning,
    info,
  }
} 
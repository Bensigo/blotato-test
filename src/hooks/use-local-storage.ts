import { useState, useEffect, useCallback } from 'react'
import { handleStorageError } from '../utils/error-handler'

export interface UseLocalStorageOptions<T> {
  serialize?: (value: T) => string
  deserialize?: (value: string) => T
  defaultValue?: T
  errorCallback?: (error: Error) => void
}

export function useLocalStorage<T>(
  key: string,
  options: UseLocalStorageOptions<T> = {}
): [T | undefined, (value: T | undefined) => void, boolean, Error | null] {
  const {
    serialize = JSON.stringify,
    deserialize = JSON.parse,
    defaultValue,
    errorCallback,
  } = options

  const [storedValue, setStoredValue] = useState<T | undefined>(defaultValue)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Read from localStorage on mount
  useEffect(() => {
    const readFromStorage = () => {
      try {
        if (typeof window === 'undefined') {
          setLoading(false)
          return
        }

        const item = window.localStorage.getItem(key)
        if (item !== null) {
          const parsed = deserialize(item)
          setStoredValue(parsed)
        } else {
          setStoredValue(defaultValue)
        }
        setError(null)
      } catch (err) {
        const storageError = handleStorageError(err)
        setError(storageError)
        setStoredValue(defaultValue)
        errorCallback?.(storageError)
      } finally {
        setLoading(false)
      }
    }

    readFromStorage()
  }, [key, defaultValue, deserialize, errorCallback])

  // Write to localStorage
  const setValue = useCallback(
    (value: T | undefined) => {
      try {
        setStoredValue(value)

        if (typeof window === 'undefined') {
          return
        }

        if (value === undefined) {
          window.localStorage.removeItem(key)
        } else {
          const serialized = serialize(value)
          window.localStorage.setItem(key, serialized)
        }
        setError(null)
      } catch (err) {
        const storageError = handleStorageError(err)
        setError(storageError)
        errorCallback?.(storageError)
      }
    },
    [key, serialize, errorCallback]
  )

  return [storedValue, setValue, loading, error]
}

// Specialized hook for arrays
export function useLocalStorageArray<T>(
  key: string,
  defaultValue: T[] = []
): [T[], (value: T[]) => void, (item: T) => void, (index: number) => void, boolean, Error | null] {
  const [array, setArray, loading, error] = useLocalStorage<T[]>(key, { defaultValue })

  const addItem = useCallback(
    (item: T) => {
      const currentArray = array || []
      setArray([...currentArray, item])
    },
    [setArray, array]
  )

  const removeItem = useCallback(
    (index: number) => {
      const currentArray = array || []
      setArray(currentArray.filter((_, i) => i !== index))
    },
    [setArray, array]
  )

  const updateItem = useCallback(
    (index: number, updates: Partial<T>) => {
      const currentArray = array || []
      setArray(
        currentArray.map((item, i) =>
          i === index ? { ...item, ...updates } : item
        )
      )
    },
    [setArray, array]
  )

  return [array || [], setArray, addItem, removeItem, loading, error]
}

// Specialized hook for objects
export function useLocalStorageObject<T extends Record<string, unknown>>(
  key: string,
  defaultValue: T = {} as T
): [T, (value: T) => void, (updates: Partial<T>) => void, boolean, Error | null] {
  const [object, setObject, loading, error] = useLocalStorage<T>(key, { defaultValue })

  const updateObject = useCallback(
    (updates: Partial<T>) => {
      const currentObject = object || defaultValue
      setObject({ ...currentObject, ...updates })
    },
    [setObject, object, defaultValue]
  )

  return [object || defaultValue, setObject, updateObject, loading, error]
}

// Hook for managing localStorage quota
export function useStorageQuota(): {
  usedBytes: number
  availableBytes: number
  percentageUsed: number
  isNearLimit: boolean
  refresh: () => void
} {
  const [stats, setStats] = useState({
    usedBytes: 0,
    availableBytes: 0,
    percentageUsed: 0,
    isNearLimit: false,
  })

  const refresh = useCallback(() => {
    if (typeof window === 'undefined') return

    try {
      let usedBytes = 0
             for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          usedBytes += localStorage[key].length + key.length
        }
      }

      // Rough estimate of localStorage limit (usually 5-10MB)
      const estimatedLimit = 5 * 1024 * 1024 // 5MB
      const availableBytes = estimatedLimit - usedBytes
      const percentageUsed = (usedBytes / estimatedLimit) * 100
      const isNearLimit = percentageUsed > 80

      setStats({
        usedBytes,
        availableBytes,
        percentageUsed,
        isNearLimit,
      })
    } catch (error) {
      console.error('Error calculating storage quota:', error)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { ...stats, refresh }
} 
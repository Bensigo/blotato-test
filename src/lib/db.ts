import { STORAGE_KEYS, STORAGE } from './constants'
import type {
  StorageData,
  Post,
  Draft,
  UserPreferences,
  SessionState,
} from './types'
import { v4 as uuidv4 } from 'uuid'

// Type-safe localStorage wrapper
class LocalStorageManager {
  private isClient = typeof window !== 'undefined'

  // Generic get method with type safety
  private get<T>(key: string, defaultValue: T): T {
    if (!this.isClient) return defaultValue

    try {
      const item = localStorage.getItem(key)
      if (item === null) return defaultValue
      return JSON.parse(item) as T
    } catch (error) {
      console.error(`Error reading from localStorage key "${key}":`, error)
      return defaultValue
    }
  }

  // Generic set method with error handling
  private set<T>(key: string, value: T): boolean {
    if (!this.isClient) return false

    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (error) {
      console.error(`Error writing to localStorage key "${key}":`, error)
      return false
    }
  }

  // Remove item from localStorage
  private remove(key: string): boolean {
    if (!this.isClient) return false

    try {
      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.error(`Error removing from localStorage key "${key}":`, error)
      return false
    }
  }

  // Check if localStorage is available and has space
  isAvailable(): boolean {
    if (!this.isClient) return false

    try {
      const testKey = '__localStorage_test__'
      localStorage.setItem(testKey, 'test')
      localStorage.removeItem(testKey)
      return true
    } catch (error) {
      return false
    }
  }

  // Get estimated storage usage in bytes
  getStorageUsage(): number {
    if (!this.isClient) return 0

    let total = 0
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length + key.length
      }
    }
    return total
  }

  // Posts management
  getPosts(): Post[] {
    return this.get<Post[]>(STORAGE_KEYS.POSTS, [])
  }

  setPosts(posts: Post[]): boolean {
    // Limit posts to prevent storage bloat
    const limitedPosts = posts.slice(0, STORAGE.MAX_POSTS_HISTORY)
    return this.set(STORAGE_KEYS.POSTS, limitedPosts)
  }

  addPost(post: Omit<Post, 'id' | 'createdAt' | 'updatedAt'>): Post | null {
    try {
      const newPost: Post = {
        ...post,
        id: uuidv4(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const posts = this.getPosts()
      posts.unshift(newPost) // Add to beginning
      
      if (this.setPosts(posts)) {
        return newPost
      }
      return null
    } catch (error) {
      console.error('Error adding post:', error)
      return null
    }
  }

  updatePost(id: string, updates: Partial<Post>): boolean {
    try {
      const posts = this.getPosts()
      const index = posts.findIndex(post => post.id === id)
      
      if (index === -1) return false

      posts[index] = {
        ...posts[index],
        ...updates,
        updatedAt: new Date(),
      }

      return this.setPosts(posts)
    } catch (error) {
      console.error('Error updating post:', error)
      return false
    }
  }

  removePost(id: string): boolean {
    try {
      const posts = this.getPosts()
      const filteredPosts = posts.filter(post => post.id !== id)
      return this.setPosts(filteredPosts)
    } catch (error) {
      console.error('Error removing post:', error)
      return false
    }
  }

  // Drafts management
  getDrafts(): Draft[] {
    return this.get<Draft[]>(STORAGE_KEYS.DRAFTS, [])
  }

  setDrafts(drafts: Draft[]): boolean {
    // Limit drafts to prevent storage bloat
    const limitedDrafts = drafts.slice(0, STORAGE.MAX_DRAFTS)
    return this.set(STORAGE_KEYS.DRAFTS, limitedDrafts)
  }

  addDraft(content: string): Draft | null {
    try {
      const newDraft: Draft = {
        id: uuidv4(),
        content,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const drafts = this.getDrafts()
      drafts.unshift(newDraft) // Add to beginning
      
      if (this.setDrafts(drafts)) {
        return newDraft
      }
      return null
    } catch (error) {
      console.error('Error adding draft:', error)
      return null
    }
  }

  updateDraft(id: string, content: string): boolean {
    try {
      const drafts = this.getDrafts()
      const index = drafts.findIndex(draft => draft.id === id)
      
      if (index === -1) return false

      drafts[index] = {
        ...drafts[index],
        content,
        updatedAt: new Date(),
      }

      return this.setDrafts(drafts)
    } catch (error) {
      console.error('Error updating draft:', error)
      return false
    }
  }

  removeDraft(id: string): boolean {
    try {
      const drafts = this.getDrafts()
      const filteredDrafts = drafts.filter(draft => draft.id !== id)
      return this.setDrafts(filteredDrafts)
    } catch (error) {
      console.error('Error removing draft:', error)
      return false
    }
  }

  // User preferences management
  getUserPreferences(): UserPreferences {
    return this.get<UserPreferences>(STORAGE_KEYS.USER_PREFERENCES, {})
  }

  setUserPreferences(preferences: UserPreferences): boolean {
    return this.set(STORAGE_KEYS.USER_PREFERENCES, preferences)
  }

  updateUserPreferences(updates: Partial<UserPreferences>): boolean {
    try {
      const current = this.getUserPreferences()
      const updated = { ...current, ...updates }
      return this.setUserPreferences(updated)
    } catch (error) {
      console.error('Error updating user preferences:', error)
      return false
    }
  }

  // Session state management
  getSessionState(): SessionState {
    return this.get<SessionState>(STORAGE_KEYS.SESSION_STATE, {
      isAuthenticated: false,
      lastActivity: Date.now(),
    })
  }

  setSessionState(state: SessionState): boolean {
    return this.set(STORAGE_KEYS.SESSION_STATE, state)
  }

  updateSessionState(updates: Partial<SessionState>): boolean {
    try {
      const current = this.getSessionState()
      const updated = { ...current, ...updates }
      return this.setSessionState(updated)
    } catch (error) {
      console.error('Error updating session state:', error)
      return false
    }
  }

  // Cleanup management
  getLastCleanup(): number {
    return this.get<number>(STORAGE_KEYS.LAST_CLEANUP, 0)
  }

  setLastCleanup(timestamp: number): boolean {
    return this.set(STORAGE_KEYS.LAST_CLEANUP, timestamp)
  }

  // Cleanup expired data
  cleanup(): boolean {
    try {
      const now = Date.now()
      const expiryMs = STORAGE.EXPIRY_HOURS * 60 * 60 * 1000
      let hasChanges = false

      // Clean up old posts
      const posts = this.getPosts()
      const validPosts = posts.filter(post => {
        const ageMs = now - new Date(post.createdAt).getTime()
        return ageMs < expiryMs
      })
      
      if (validPosts.length !== posts.length) {
        this.setPosts(validPosts)
        hasChanges = true
      }

      // Clean up old drafts
      const drafts = this.getDrafts()
      const validDrafts = drafts.filter(draft => {
        const ageMs = now - new Date(draft.updatedAt).getTime()
        return ageMs < expiryMs
      })
      
      if (validDrafts.length !== drafts.length) {
        this.setDrafts(validDrafts)
        hasChanges = true
      }

      // Update last cleanup timestamp
      this.setLastCleanup(now)
      
      return hasChanges
    } catch (error) {
      console.error('Error during cleanup:', error)
      return false
    }
  }

  // Check if cleanup is needed
  needsCleanup(): boolean {
    const lastCleanup = this.getLastCleanup()
    const now = Date.now()
    const cleanupInterval = STORAGE.CLEANUP_INTERVAL_MINUTES * 60 * 1000
    
    return (now - lastCleanup) >= cleanupInterval
  }

  // Clear all data
  clearAll(): boolean {
    try {
      const keys = Object.values(STORAGE_KEYS)
      for (const key of keys) {
        this.remove(key)
      }
      return true
    } catch (error) {
      console.error('Error clearing all data:', error)
      return false
    }
  }

  // Export all data
  exportData(): StorageData {
    return {
      posts: this.getPosts(),
      drafts: this.getDrafts(),
      userPreferences: this.getUserPreferences(),
      sessionState: this.getSessionState(),
      lastCleanup: this.getLastCleanup(),
    }
  }

  // Import data
  importData(data: StorageData): boolean {
    try {
      this.setPosts(data.posts || [])
      this.setDrafts(data.drafts || [])
      this.setUserPreferences(data.userPreferences || {})
      this.setSessionState(data.sessionState || {
        isAuthenticated: false,
        lastActivity: Date.now(),
      })
      this.setLastCleanup(data.lastCleanup || Date.now())
      return true
    } catch (error) {
      console.error('Error importing data:', error)
      return false
    }
  }

  // Get storage statistics
  getStats(): {
    posts: number
    drafts: number
    totalSize: number
    lastCleanup: Date
    needsCleanup: boolean
  } {
    return {
      posts: this.getPosts().length,
      drafts: this.getDrafts().length,
      totalSize: this.getStorageUsage(),
      lastCleanup: new Date(this.getLastCleanup()),
      needsCleanup: this.needsCleanup(),
    }
  }
}

// Create singleton instance
export const db = new LocalStorageManager()

// Auto-cleanup setup
let cleanupInterval: NodeJS.Timeout | null = null

export function startAutoCleanup(): void {
  if (cleanupInterval) return // Already started

  const intervalMs = STORAGE.CLEANUP_INTERVAL_MINUTES * 60 * 1000
  
  cleanupInterval = setInterval(() => {
    if (db.needsCleanup()) {
      console.log('Running automatic storage cleanup...')
      const hasChanges = db.cleanup()
      if (hasChanges) {
        console.log('Storage cleanup completed with changes')
      }
    }
  }, intervalMs)

  // Cleanup on page unload
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
      db.cleanup()
    })
  }
}

export function stopAutoCleanup(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval)
    cleanupInterval = null
  }
}

// Initialize auto-cleanup on module load
if (typeof window !== 'undefined') {
  startAutoCleanup()
} 
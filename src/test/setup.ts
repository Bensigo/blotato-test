import '@testing-library/jest-dom'
import { vi, beforeEach } from 'vitest'

// Mock environment variables before any modules are imported
vi.mock('../lib/env', () => ({
  env: {
    TWITTER_CLIENT_ID: 'test_client_id',
    TWITTER_CLIENT_SECRET: 'test_client_secret',
    OPENAI_API_KEY: 'test_openai_key',
    NEXTAUTH_SECRET: 'test_nextauth_secret_with_sufficient_length',
    NEXTAUTH_URL: 'http://localhost:3000',
    NODE_ENV: 'test',
  },
  TWITTER_CLIENT_ID: 'test_client_id',
  TWITTER_CLIENT_SECRET: 'test_client_secret',
  OPENAI_API_KEY: 'test_openai_key',
  NEXTAUTH_SECRET: 'test_nextauth_secret_with_sufficient_length',
  NEXTAUTH_URL: 'http://localhost:3000',
  NODE_ENV: 'test',
}))

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
  }),
  usePathname: () => '/test-path',
}))

// Mock OpenAI
vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    moderations: {
      create: vi.fn().mockResolvedValue({
        id: 'modr-test',
        model: 'omni-moderation-latest',
        results: [{
          flagged: false,
          categories: {},
          category_scores: {},
        }],
      }),
    },
  })),
}))

// Reset all mocks before each test
beforeEach(() => {
  vi.clearAllMocks()
  localStorageMock.getItem.mockClear()
  localStorageMock.setItem.mockClear()
  localStorageMock.removeItem.mockClear()
  localStorageMock.clear.mockClear()
}) 
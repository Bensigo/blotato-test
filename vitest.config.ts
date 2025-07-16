import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', '.next'],
    // Disable CSS processing completely
    css: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      // Only include source files we want to test
      include: [
        'src/app/api/**/*.ts',
        'src/lib/**/*.ts',
        'src/utils/**/*.ts',
        'src/components/**/*.tsx',
        'src/hooks/**/*.ts'
      ],
      exclude: [
        'node_modules/',
        '.next/',
        'dist/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**',
        'src/app/layout.tsx',
        'src/app/page.tsx',
        'src/app/error.tsx',
        'src/app/loading.tsx',
        'src/app/not-found.tsx',
        'src/lib/env.ts', // Exclude env validation from coverage
      ],
      // Set 90% coverage thresholds
      thresholds: {
        global: {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90
        }
      }
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
}) 
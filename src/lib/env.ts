import { z } from 'zod'

const envSchema = z.object({
  // Twitter OAuth Configuration
  TWITTER_CLIENT_ID: z.string().min(1, "Twitter Client ID is required"),
  TWITTER_CLIENT_SECRET: z.string().min(1, "Twitter Client Secret is required"),
  
  // OpenAI Configuration
  OPENAI_API_KEY: z.string().min(1, "OpenAI API Key is required"),
  
  // NextAuth Configuration
  NEXTAUTH_SECRET: z.string().min(32, "NextAuth Secret must be at least 32 characters"),
  NEXTAUTH_URL: z.string().url("NextAuth URL must be a valid URL"),
  
  // Optional Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

export type Env = z.infer<typeof envSchema>

function validateEnv(): Env {
  try {
    return envSchema.parse(process.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(
        (err) => `${err.path.join('.')}: ${err.message}`
      )
      throw new Error(
        `Environment validation failed:\n${errorMessages.join('\n')}`
      )
    }
    throw error
  }
}

export const env = validateEnv()

// Export individual values for convenience
export const {
  TWITTER_CLIENT_ID,
  TWITTER_CLIENT_SECRET,
  OPENAI_API_KEY,
  NEXTAUTH_SECRET,
  NEXTAUTH_URL,
  NODE_ENV,
} = env 
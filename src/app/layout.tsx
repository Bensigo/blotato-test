import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { APP_NAME, APP_DESCRIPTION } from '../lib/constants'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  keywords: ['Twitter', 'AI', 'moderation', 'social media', 'content moderation', 'OpenAI'],
  authors: [{ name: 'AI Twitter Moderator Team' }],
  creator: 'AI Twitter Moderator',
  publisher: 'AI Twitter Moderator',
  robots: {
    index: false,
    follow: false,
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full bg-gray-50 antialiased`}>
        {children}
      </body>
    </html>
  )
}

import type { Metadata } from 'next'
import { AuthProvider } from '@/contexts/auth-context'
import { SettingsProvider } from '@/contexts/settings-context'
import { ErrorBoundary } from '@/components/error-boundary'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI Focus Hub',
  description: 'Personal operating system for managing outcome-based projects',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className="min-h-screen"
        style={{
          // Fallback if `/_next/static/css/*.css` fails to load (e.g. file:// or bad deploy path)
          backgroundColor: '#0a0a0a',
          color: '#ededed',
        }}
        suppressHydrationWarning
      >
        <ErrorBoundary>
          <AuthProvider>
            <SettingsProvider>
              {children}
            </SettingsProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}

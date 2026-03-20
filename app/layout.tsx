import type { Metadata } from 'next'
import { AuthProvider } from '@/contexts/auth-context'
import { SettingsProvider } from '@/contexts/settings-context'
import { ErrorBoundary } from '@/components/error-boundary'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI Productivity OS',
  description: 'Personal operating system for managing outcome-based projects',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-screen" suppressHydrationWarning>
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

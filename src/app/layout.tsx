import type React from 'react'
import '@/styles/globals.css'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import { ToastProvider } from '@/components/ui/Toast'
import { ReadOnlyModeProvider } from '@/contexts/ReadOnlyModeContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'NeuralLift - AI-Powered Strength Training & Progress Optimization',
  description:
    'Transform your strength training with AI-powered programs, track workouts, and unlock your lifting potential with NeuralLift.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <ToastProvider>
            <ReadOnlyModeProvider>
              {children}
            </ReadOnlyModeProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

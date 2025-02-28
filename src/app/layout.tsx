import './globals.css'
import { Inter } from 'next/font/google'
import { ClientProvider } from '@/components/providers/ClientProvider'
import { metadata } from './metadata'

const inter = Inter({ subsets: ['latin'] })

export { metadata }

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ClientProvider>
          <main className="min-h-screen bg-background">
            {children}
          </main>
        </ClientProvider>
      </body>
    </html>
  )
} 
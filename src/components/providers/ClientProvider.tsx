'use client'

import { ReactNode } from 'react'

interface ClientProviderProps {
  children: ReactNode
}

export function ClientProvider({ children }: ClientProviderProps) {
  return <>{children}</>
} 
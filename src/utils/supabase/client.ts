// src/utils/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'
import { getSupabaseConfig } from '@/lib/env'

export function createClient() {
  const { url, anonKey } = getSupabaseConfig()
  return createBrowserClient(url, anonKey)
} 
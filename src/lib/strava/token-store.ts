/**
 * Strava Token Storage Utilities
 * ------------------------------------------------
 * This module handles secure storage and retrieval of Strava OAuth tokens,
 * both client-side (localStorage) and server-side (Supabase).
 */

import type { SupabaseClient } from '@supabase/supabase-js'

export interface StravaTokens {
  access_token: string
  refresh_token: string
  expires_at: number
}

// Local storage key for Strava tokens
const STRAVA_TOKENS_KEY = 'neurallift_strava_tokens'

/**
 * Saves Strava tokens to localStorage for temporary client-side storage
 */
export const saveTokensToLocalStorage = (tokens: StravaTokens): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STRAVA_TOKENS_KEY, JSON.stringify(tokens))
  }
}

/**
 * Retrieves Strava tokens from localStorage
 */
export const getTokensFromLocalStorage = (): StravaTokens | null => {
  if (typeof window !== 'undefined') {
    const tokensString = localStorage.getItem(STRAVA_TOKENS_KEY)
    if (tokensString) {
      try {
        return JSON.parse(tokensString) as StravaTokens
      } catch (error) {
        console.error('Error parsing Strava tokens from localStorage:', error)
        return null
      }
    }
  }
  return null
}

/**
 * Removes Strava tokens from localStorage (e.g., on logout)
 */
export const removeTokensFromLocalStorage = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STRAVA_TOKENS_KEY)
  }
}

/**
 * Saves Strava tokens to the user's profile in Supabase
 * This is more secure for long-term storage
 */
export const saveTokensToDatabase = async (
  supabaseClient: SupabaseClient,
  userId: string,
  tokens: StravaTokens
): Promise<void> => {
  try {
    // Update the user's profile with Strava tokens
    const { error } = await supabaseClient
      .from('profiles')
      .update({
        strava_access_token: tokens.access_token,
        strava_refresh_token: tokens.refresh_token,
        strava_token_expires_at: tokens.expires_at,
        strava_connected: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (error) {
      throw error
    }
  } catch (error) {
    console.error('Error saving Strava tokens to database:', error)
    throw error
  }
}

/**
 * Retrieves Strava tokens from the user's profile in Supabase
 */
export const getTokensFromDatabase = async (
  supabaseClient: SupabaseClient,
  userId: string
): Promise<StravaTokens | null> => {
  try {
    const { data, error } = await supabaseClient
      .from('profiles')
      .select('strava_access_token, strava_refresh_token, strava_token_expires_at')
      .eq('id', userId)
      .single()

    if (error || !data) {
      if (error && error.code !== 'PGRST116') {
        // Not found is not an error
        console.error('Error fetching Strava tokens from database:', error)
      }
      return null
    }

    if (!data.strava_access_token || !data.strava_refresh_token || !data.strava_token_expires_at) {
      console.warn(`Tokens fields incomplete in DB for user ${userId.substring(0, 6)}.`)
      return null
    }

    return {
      access_token: data.strava_access_token,
      refresh_token: data.strava_refresh_token,
      expires_at: data.strava_token_expires_at,
    }
  } catch (error) {
    console.error('Error getting Strava tokens from database:', error)
    return null
  }
}

/**
 * Removes Strava tokens from the user's profile in Supabase
 */
export const removeTokensFromDatabase = async (
  supabaseClient: SupabaseClient,
  userId: string
): Promise<void> => {
  try {
    const { error } = await supabaseClient
      .from('profiles')
      .update({
        strava_access_token: null,
        strava_refresh_token: null,
        strava_token_expires_at: null,
        strava_connected: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (error) {
      throw error
    }
  } catch (error) {
    console.error('Error removing Strava tokens from database:', error)
    throw error
  }
}

/**
 * Checks if a user has connected their Strava account
 */
export const isStravaConnected = async (
  supabaseClient: SupabaseClient,
  userId: string
): Promise<boolean> => {
  try {
    const { data, error } = await supabaseClient
      .from('profiles')
      .select('strava_connected')
      .eq('id', userId)
      .single()

    if (error || !data) {
      return false
    }

    return !!data.strava_connected
  } catch (error) {
    console.error('Error checking Strava connection status:', error)
    return false
  }
}

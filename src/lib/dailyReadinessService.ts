/**
 * Daily Readiness Service
 * ------------------------------------------------
 * Service for tracking daily readiness completion using localStorage
 * with timezone awareness to ensure proper "daily" boundaries
 */

import { type DailyReadinessData, type DailyReadinessService } from './types/program'

const STORAGE_KEY = 'daily_readiness_data'

/**
 * Get today's date string in YYYY-MM-DD format using user's timezone
 */
function getTodayDateString(): string {
  const today = new Date()
  return today.toISOString().split('T')[0]
}

/**
 * Get stored readiness data from localStorage
 */
function getStoredReadinessData(): Record<string, DailyReadinessData> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return {}
    return JSON.parse(stored)
  } catch (error) {
    console.error('Error reading daily readiness data from localStorage:', error)
    return {}
  }
}

/**
 * Store readiness data to localStorage
 */
function storeReadinessData(data: Record<string, DailyReadinessData>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (error) {
    console.error('Error storing daily readiness data to localStorage:', error)
  }
}

/**
 * Clean up old readiness data (keep only last 7 days)
 */
function cleanupOldData(data: Record<string, DailyReadinessData>): Record<string, DailyReadinessData> {
  const today = new Date()
  const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
  const cutoffDate = sevenDaysAgo.toISOString().split('T')[0]
  
  const cleaned: Record<string, DailyReadinessData> = {}
  
  Object.entries(data).forEach(([date, readiness]) => {
    if (date >= cutoffDate) {
      cleaned[date] = readiness
    }
  })
  
  return cleaned
}

/**
 * Implementation of the DailyReadinessService
 */
export const dailyReadinessService: DailyReadinessService = {
  /**
   * Check if user has completed readiness check for today
   */
  hasCompletedToday(): boolean {
    const todayDate = getTodayDateString()
    const storedData = getStoredReadinessData()
    return todayDate in storedData
  },

  /**
   * Record that user has completed readiness check for today
   */
  markCompletedToday(readiness: DailyReadinessData): void {
    const todayDate = getTodayDateString()
    const storedData = getStoredReadinessData()
    
    // Ensure the readiness data has the correct date
    const normalizedReadiness: DailyReadinessData = {
      ...readiness,
      date: todayDate,
      timestamp: new Date().toISOString()
    }
    
    // Update the stored data
    storedData[todayDate] = normalizedReadiness
    
    // Clean up old data and store
    const cleanedData = cleanupOldData(storedData)
    storeReadinessData(cleanedData)
  },

  /**
   * Get today's readiness data if available
   */
  getTodaysReadiness(): DailyReadinessData | null {
    const todayDate = getTodayDateString()
    const storedData = getStoredReadinessData()
    return storedData[todayDate] || null
  },

  /**
   * Clear all stored readiness data
   */
  clearAll(): void {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.error('Error clearing daily readiness data:', error)
    }
  }
}

/**
 * Convenience function to check if readiness modal should be shown
 * This is the main function that components should use
 */
export function shouldShowDailyReadinessModal(): boolean {
  // Only show if running in browser (not server-side)
  if (typeof window === 'undefined') return false
  
  return !dailyReadinessService.hasCompletedToday()
}

/**
 * Get readiness data for analytics or debugging
 */
export function getDailyReadinessHistory(): DailyReadinessData[] {
  const storedData = getStoredReadinessData()
  return Object.values(storedData).sort((a, b) => b.date.localeCompare(a.date))
} 
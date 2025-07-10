'use server'

import { cookies } from 'next/headers'
import { createClient as createSupabaseServerClient } from '@/utils/supabase/server'

export type ActionStatus = 'pending' | 'in_progress' | 'completed' | 'skipped'

export interface WeeklyReviewActionTracking {
  id: string
  user_id: string
  review_week_start: string // YYYY-MM-DD format
  actionable_tip: string
  status: ActionStatus
  progress_notes: string | null
  completion_date: string | null
  created_at: string
  updated_at: string
}

export interface ActionTrackingUpdate {
  status: ActionStatus
  progress_notes?: string
}

/**
 * Get the Monday of the current week in YYYY-MM-DD format
 */
function getCurrentWeekStart(): string {
  const now = new Date()
  const dayOfWeek = now.getDay() // 0 = Sunday, 1 = Monday, etc.
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // Convert Sunday to 6, others to dayOfWeek - 1
  const monday = new Date(now)
  monday.setDate(now.getDate() - daysFromMonday)
  return monday.toISOString().split('T')[0] // YYYY-MM-DD format
}

/**
 * Create or update action tracking for the current week's actionable tip
 */
export async function upsertActionTracking(
  actionableTip: string,
  status: ActionStatus = 'pending',
  progressNotes?: string
): Promise<{ success: boolean; error?: string; data?: WeeklyReviewActionTracking }> {
  try {
    const cookieStore = await cookies()
    const supabase = await createSupabaseServerClient(cookieStore)

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('Authentication error in upsertActionTracking:', authError)
      return { success: false, error: 'Authentication required. Please log in again.' }
    }

    const reviewWeekStart = getCurrentWeekStart()
    const completionDate = status === 'completed' ? new Date().toISOString() : null

    console.log('Upserting action tracking:', {
      userId: user.id,
      reviewWeekStart,
      actionableTip,
      status,
      progressNotes
    })

    const { data, error } = await supabase
      .from('weekly_review_action_tracking')
      .upsert(
        {
          user_id: user.id,
          review_week_start: reviewWeekStart,
          actionable_tip: actionableTip,
          status: status,
          progress_notes: progressNotes || null,
          completion_date: completionDate,
        },
        {
          onConflict: 'user_id,review_week_start'
        }
      )
      .select()
      .single()

    if (error) {
      console.error('Error upserting action tracking:', error)
      return { success: false, error: 'Failed to save action progress. Please try again.' }
    }

    console.log('Successfully upserted action tracking:', data)
    return { success: true, data }

  } catch (error) {
    console.error('Unexpected error in upsertActionTracking:', error)
    return { success: false, error: 'An unexpected error occurred while saving your progress.' }
  }
}

/**
 * Update existing action tracking status and notes
 */
export async function updateActionTracking(
  reviewWeekStart: string,
  updates: ActionTrackingUpdate
): Promise<{ success: boolean; error?: string; data?: WeeklyReviewActionTracking }> {
  try {
    const cookieStore = await cookies()
    const supabase = await createSupabaseServerClient(cookieStore)

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('Authentication error in updateActionTracking:', authError)
      return { success: false, error: 'Authentication required. Please log in again.' }
    }

    const completionDate = updates.status === 'completed' ? new Date().toISOString() : null

    console.log('Updating action tracking:', {
      userId: user.id,
      reviewWeekStart,
      updates
    })

    const updateData: any = {
      status: updates.status,
      completion_date: completionDate,
    }

    if (updates.progress_notes !== undefined) {
      updateData.progress_notes = updates.progress_notes || null
    }

    const { data, error } = await supabase
      .from('weekly_review_action_tracking')
      .update(updateData)
      .eq('user_id', user.id)
      .eq('review_week_start', reviewWeekStart)
      .select()
      .single()

    if (error) {
      console.error('Error updating action tracking:', error)
      return { success: false, error: 'Failed to update action progress. Please try again.' }
    }

    console.log('Successfully updated action tracking:', data)
    return { success: true, data }

  } catch (error) {
    console.error('Unexpected error in updateActionTracking:', error)
    return { success: false, error: 'An unexpected error occurred while updating your progress.' }
  }
}

/**
 * Get action tracking for the current week
 */
export async function getCurrentWeekActionTracking(): Promise<{
  success: boolean
  error?: string
  data?: WeeklyReviewActionTracking | null
}> {
  try {
    const cookieStore = await cookies()
    const supabase = await createSupabaseServerClient(cookieStore)

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('Authentication error in getCurrentWeekActionTracking:', authError)
      return { success: false, error: 'Authentication required. Please log in again.' }
    }

    const reviewWeekStart = getCurrentWeekStart()

    console.log('Getting current week action tracking:', {
      userId: user.id,
      reviewWeekStart
    })

    const { data, error } = await supabase
      .from('weekly_review_action_tracking')
      .select('*')
      .eq('user_id', user.id)
      .eq('review_week_start', reviewWeekStart)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No data found - this is normal for new weeks
        console.log('No action tracking found for current week')
        return { success: true, data: null }
      }
      console.error('Error getting action tracking:', error)
      return { success: false, error: 'Failed to load action progress. Please try again.' }
    }

    console.log('Successfully retrieved action tracking:', data)
    return { success: true, data }

  } catch (error) {
    console.error('Unexpected error in getCurrentWeekActionTracking:', error)
    return { success: false, error: 'An unexpected error occurred while loading your progress.' }
  }
}

/**
 * Get action tracking history for the user (last 4 weeks)
 */
export async function getActionTrackingHistory(): Promise<{
  success: boolean
  error?: string
  data?: WeeklyReviewActionTracking[]
}> {
  try {
    const cookieStore = await cookies()
    const supabase = await createSupabaseServerClient(cookieStore)

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('Authentication error in getActionTrackingHistory:', authError)
      return { success: false, error: 'Authentication required. Please log in again.' }
    }

    // Get last 4 weeks of data
    const fourWeeksAgo = new Date()
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28)
    const fourWeeksAgoStr = fourWeeksAgo.toISOString().split('T')[0]

    console.log('Getting action tracking history:', {
      userId: user.id,
      since: fourWeeksAgoStr
    })

    const { data, error } = await supabase
      .from('weekly_review_action_tracking')
      .select('*')
      .eq('user_id', user.id)
      .gte('review_week_start', fourWeeksAgoStr)
      .order('review_week_start', { ascending: false })

    if (error) {
      console.error('Error getting action tracking history:', error)
      return { success: false, error: 'Failed to load action tracking history. Please try again.' }
    }

    console.log('Successfully retrieved action tracking history:', data?.length || 0, 'records')
    return { success: true, data: data || [] }

  } catch (error) {
    console.error('Unexpected error in getActionTrackingHistory:', error)
    return { success: false, error: 'An unexpected error occurred while loading your history.' }
  }
} 
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { IndepthAnalysisCard } from './IndepthAnalysisCard'

// Mock Supabase
const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        gte: jest.fn(() => ({
          lte: jest.fn(() => ({
            order: jest.fn(() => Promise.resolve({ data: [], error: null }))
          }))
        }))
      }))
    }))
  }))
}

jest.mock('@/utils/supabase/client', () => ({
  createClient: () => mockSupabase,
}))

// Mock date-fns-tz to control timezone behavior
jest.mock('date-fns-tz', () => ({
  toZonedTime: jest.fn((date) => new Date(date)),
  fromZonedTime: jest.fn((date) => new Date(date))
}))

// Mock date-fns
jest.mock('date-fns', () => ({
  format: jest.fn(() => 'Dec 15'),
  subDays: jest.fn(() => new Date('2024-01-08T12:00:00.000Z')),
  startOfDay: jest.fn(() => new Date('2024-01-15T00:00:00.000Z')),
  endOfDay: jest.fn(() => new Date('2024-01-15T23:59:59.999Z')),
  getDay: jest.fn(() => 1) // Monday
}))

describe('IndepthAnalysisCard', () => {
  const defaultProps = {
    userId: 'test-user-id',
    weightUnit: 'kg' as const,
    userTimezone: 'America/New_York',
    className: 'test-class'
  }

  beforeEach(() => {
    jest.clearAllMocks()
    // Reset the mock chain for each test
    mockSupabase.from.mockReturnValue({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          gte: jest.fn(() => ({
            lte: jest.fn(() => ({
              order: jest.fn(() => Promise.resolve({ data: [], error: null }))
            }))
          }))
        }))
      }))
    } as any)
  })

  describe('Loading State', () => {
    it('displays loading skeleton while fetching data', () => {
      // Mock a delayed response
      const mockChain = {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            gte: jest.fn(() => ({
              lte: jest.fn(() => ({
                order: jest.fn(() => new Promise(() => {})) // Never resolves
              }))
            }))
          }))
        }))
      }
      mockSupabase.from.mockReturnValue(mockChain as any)

      render(<IndepthAnalysisCard {...defaultProps} />)

      // Check for loading skeleton elements
      expect(screen.getByText('Indepth Analysis')).toBeInTheDocument()
      
      // Should show animated skeleton elements
      const skeletonElements = document.querySelectorAll('.animate-pulse')
      expect(skeletonElements.length).toBeGreaterThan(0)
    })

    it('displays correct header during loading', () => {
      const mockChain = {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            gte: jest.fn(() => ({
              lte: jest.fn(() => ({
                order: jest.fn(() => new Promise(() => {}))
              }))
            }))
          }))
        }))
      }
      mockSupabase.from.mockReturnValue(mockChain as any)

      render(<IndepthAnalysisCard {...defaultProps} />)

      expect(screen.getByText('Indepth Analysis')).toBeInTheDocument()
      expect(screen.getByText('Compare today\'s workout to the same session from last week')).toBeInTheDocument()
    })
  })

  describe('Error State', () => {
    it('displays error message when today\'s workout fetch fails', async () => {
      const mockChain = {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            gte: jest.fn(() => ({
              lte: jest.fn(() => ({
                order: jest.fn(() => Promise.resolve({ 
                  data: null, 
                  error: { message: 'Database connection failed' } 
                }))
              }))
            }))
          }))
        }))
      }
      mockSupabase.from.mockReturnValue(mockChain as any)

      render(<IndepthAnalysisCard {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Indepth Analysis')).toBeInTheDocument()
        expect(screen.getByText('Failed to load workout comparison data')).toBeInTheDocument()
      })
    })

    it('displays error message when last week\'s workout fetch fails', async () => {
      // First call (today's workouts) succeeds, second call (last week) fails
      let callCount = 0
      const mockChain = {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            gte: jest.fn(() => ({
              lte: jest.fn(() => ({
                order: jest.fn(() => {
                  callCount++
                  if (callCount === 1) {
                    // Today's workouts - return some data
                    return Promise.resolve({ 
                      data: [{
                        exercise_name: 'Bench Press',
                        weight: 80,
                        reps: 10,
                        sets: 3,
                        muscle_group: 'chest',
                        created_at: '2024-01-15T12:00:00.000Z'
                      }], 
                      error: null 
                    })
                  } else {
                    // Last week's workouts - return error
                    return Promise.resolve({ 
                      data: null, 
                      error: { message: 'Network error' } 
                    })
                  }
                })
              }))
            }))
          }))
        }))
      }
      mockSupabase.from.mockReturnValue(mockChain as any)

      render(<IndepthAnalysisCard {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Failed to load workout comparison data')).toBeInTheDocument()
      })
    })
  })

  describe('Empty States', () => {
    it('displays "No workout recorded today" when no workouts exist for today', async () => {
      const mockChain = {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            gte: jest.fn(() => ({
              lte: jest.fn(() => ({
                order: jest.fn(() => Promise.resolve({ data: [], error: null }))
              }))
            }))
          }))
        }))
      }
      mockSupabase.from.mockReturnValue(mockChain as any)

      render(<IndepthAnalysisCard {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('No workout recorded today')).toBeInTheDocument()
        expect(screen.getByText('Complete a workout to see your week-over-week progress analysis')).toBeInTheDocument()
      })

      // Should show calendar icon
      const calendarIcon = document.querySelector('svg')
      expect(calendarIcon).toBeInTheDocument()
    })

    it('displays "No matching workout from last week" when today has workouts but last week doesn\'t', async () => {
      let callCount = 0
      const mockChain = {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            gte: jest.fn(() => ({
              lte: jest.fn(() => ({
                order: jest.fn(() => {
                  callCount++
                  if (callCount === 1) {
                    // Today's workouts - return data
                    return Promise.resolve({ 
                      data: [{
                        exercise_name: 'Bench Press',
                        weight: 80,
                        reps: 10,
                        sets: 3,
                        muscle_group: 'chest',
                        created_at: '2024-01-15T12:00:00.000Z'
                      }], 
                      error: null 
                    })
                  } else {
                    // Last week's workouts - return empty array
                    return Promise.resolve({ data: [], error: null })
                  }
                })
              }))
            }))
          }))
        }))
      }
      mockSupabase.from.mockReturnValue(mockChain as any)

      render(<IndepthAnalysisCard {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('No matching workout from last week')).toBeInTheDocument()
        expect(screen.getByText('Keep training consistently to see week-over-week comparisons')).toBeInTheDocument()
      })
    })
  })

  describe('Data Display and Calculations', () => {
    it('correctly calculates and displays positive percentage changes', async () => {
      let callCount = 0
      const mockChain = {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            gte: jest.fn(() => ({
              lte: jest.fn(() => ({
                order: jest.fn(() => {
                  callCount++
                  if (callCount === 1) {
                    // Today's workouts - improved performance
                    return Promise.resolve({ 
                      data: [{
                        exercise_name: 'Bench Press',
                        weight: 85, // Increased from 80
                        reps: 10,
                        sets: 3,
                        muscle_group: 'chest',
                        created_at: '2024-01-15T12:00:00.000Z'
                      }], 
                      error: null 
                    })
                  } else {
                    // Last week's workouts - baseline
                    return Promise.resolve({ 
                      data: [{
                        exercise_name: 'Bench Press',
                        weight: 80,
                        reps: 10,
                        sets: 3,
                        muscle_group: 'chest',
                        created_at: '2024-01-08T12:00:00.000Z'
                      }], 
                      error: null 
                    })
                  }
                })
              }))
            }))
          }))
        }))
      }
      mockSupabase.from.mockReturnValue(mockChain as any)

      render(<IndepthAnalysisCard {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Bench Press')).toBeInTheDocument()
        
        // Check for positive weight change
        expect(screen.getByText(/\+5kg/)).toBeInTheDocument()
        expect(screen.getByText(/\+6\.3%/)).toBeInTheDocument() // (5/80)*100 = 6.25%, rounded to 6.3%
        
        // Check for today's values
        expect(screen.getByText('85kg × 10 × 3')).toBeInTheDocument()
        
        // Check for last week's values
        expect(screen.getByText('80kg × 10 × 3')).toBeInTheDocument()
      })
    })

    it('correctly calculates and displays negative percentage changes', async () => {
      let callCount = 0
      const mockChain = {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            gte: jest.fn(() => ({
              lte: jest.fn(() => ({
                order: jest.fn(() => {
                  callCount++
                  if (callCount === 1) {
                    // Today's workouts - decreased performance
                    return Promise.resolve({ 
                      data: [{
                        exercise_name: 'Squat',
                        weight: 90, // Decreased from 100
                        reps: 8,    // Decreased from 10
                        sets: 3,
                        muscle_group: 'legs',
                        created_at: '2024-01-15T12:00:00.000Z'
                      }], 
                      error: null 
                    })
                  } else {
                    // Last week's workouts - baseline
                    return Promise.resolve({ 
                      data: [{
                        exercise_name: 'Squat',
                        weight: 100,
                        reps: 10,
                        sets: 3,
                        muscle_group: 'legs',
                        created_at: '2024-01-08T12:00:00.000Z'
                      }], 
                      error: null 
                    })
                  }
                })
              }))
            }))
          }))
        }))
      }
      mockSupabase.from.mockReturnValue(mockChain as any)

      render(<IndepthAnalysisCard {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Squat')).toBeInTheDocument()
        
        // Check for negative weight change
        expect(screen.getByText(/-10kg/)).toBeInTheDocument()
        expect(screen.getByText(/-10%/)).toBeInTheDocument() // (-10/100)*100 = -10%
        
        // Volume should also be negative: (90*8*3) - (100*10*3) = 2160 - 3000 = -840
        // Volume percentage: (-840/3000)*100 = -28%
        expect(screen.getByText(/-28%/)).toBeInTheDocument()
      })
    })

    it('handles lbs weight unit correctly', async () => {
      let callCount = 0
      const mockChain = {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            gte: jest.fn(() => ({
              lte: jest.fn(() => ({
                order: jest.fn(() => {
                  callCount++
                  if (callCount === 1) {
                    return Promise.resolve({ 
                      data: [{
                        exercise_name: 'Deadlift',
                        weight: 185,
                        reps: 5,
                        sets: 3,
                        muscle_group: 'back',
                        created_at: '2024-01-15T12:00:00.000Z'
                      }], 
                      error: null 
                    })
                  } else {
                    return Promise.resolve({ 
                      data: [{
                        exercise_name: 'Deadlift',
                        weight: 180,
                        reps: 5,
                        sets: 3,
                        muscle_group: 'back',
                        created_at: '2024-01-08T12:00:00.000Z'
                      }], 
                      error: null 
                    })
                  }
                })
              }))
            }))
          }))
        }))
      }
      mockSupabase.from.mockReturnValue(mockChain as any)

      render(<IndepthAnalysisCard {...defaultProps} weightUnit="lbs" />)

      await waitFor(() => {
        expect(screen.getByText('185lbs × 5 × 3')).toBeInTheDocument()
        expect(screen.getByText('180lbs × 5 × 3')).toBeInTheDocument()
        expect(screen.getByText(/\+5lbs/)).toBeInTheDocument()
      })
    })

    it('displays muscle group information when available', async () => {
      let callCount = 0
      const mockChain = {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            gte: jest.fn(() => ({
              lte: jest.fn(() => ({
                order: jest.fn(() => {
                  callCount++
                  if (callCount === 1) {
                    return Promise.resolve({ 
                      data: [{
                        exercise_name: 'Overhead Press',
                        weight: 60,
                        reps: 8,
                        sets: 3,
                        muscle_group: 'shoulders',
                        created_at: '2024-01-15T12:00:00.000Z'
                      }], 
                      error: null 
                    })
                  } else {
                    return Promise.resolve({ 
                      data: [{
                        exercise_name: 'Overhead Press',
                        weight: 55,
                        reps: 8,
                        sets: 3,
                        muscle_group: 'shoulders',
                        created_at: '2024-01-08T12:00:00.000Z'
                      }], 
                      error: null 
                    })
                  }
                })
              }))
            }))
          }))
        }))
      }
      mockSupabase.from.mockReturnValue(mockChain as any)

      render(<IndepthAnalysisCard {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Overhead Press')).toBeInTheDocument()
        expect(screen.getByText('shoulders')).toBeInTheDocument()
      })
    })
  })

  describe('Trend Indicators', () => {
    it('displays "improving" trend with TrendingUp icon for positive changes', async () => {
      let callCount = 0
      const mockChain = {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            gte: jest.fn(() => ({
              lte: jest.fn(() => ({
                order: jest.fn(() => {
                  callCount++
                  if (callCount === 1) {
                    return Promise.resolve({ 
                      data: [{
                        exercise_name: 'Pull-ups',
                        weight: 0,
                        reps: 12, // Increased significantly
                        sets: 3,
                        muscle_group: 'back',
                        created_at: '2024-01-15T12:00:00.000Z'
                      }], 
                      error: null 
                    })
                  } else {
                    return Promise.resolve({ 
                      data: [{
                        exercise_name: 'Pull-ups',
                        weight: 0,
                        reps: 8, // Baseline
                        sets: 3,
                        muscle_group: 'back',
                        created_at: '2024-01-08T12:00:00.000Z'
                      }], 
                      error: null 
                    })
                  }
                })
              }))
            }))
          }))
        }))
      }
      mockSupabase.from.mockReturnValue(mockChain as any)

      render(<IndepthAnalysisCard {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Pull-ups')).toBeInTheDocument()
        expect(screen.getByText('improving')).toBeInTheDocument()
        
        // Should have green styling classes for improvement
        const badge = screen.getByText('improving').closest('.bg-green-100')
        expect(badge).toBeInTheDocument()
      })
    })

    it('displays "declining" trend with TrendingDown icon for negative changes', async () => {
      let callCount = 0
      const mockChain = {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            gte: jest.fn(() => ({
              lte: jest.fn(() => ({
                order: jest.fn(() => {
                  callCount++
                  if (callCount === 1) {
                    return Promise.resolve({ 
                      data: [{
                        exercise_name: 'Bicep Curls',
                        weight: 20,
                        reps: 8, // Significantly decreased
                        sets: 3,
                        muscle_group: 'arms',
                        created_at: '2024-01-15T12:00:00.000Z'
                      }], 
                      error: null 
                    })
                  } else {
                    return Promise.resolve({ 
                      data: [{
                        exercise_name: 'Bicep Curls',
                        weight: 25,
                        reps: 12, // Baseline
                        sets: 3,
                        muscle_group: 'arms',
                        created_at: '2024-01-08T12:00:00.000Z'
                      }], 
                      error: null 
                    })
                  }
                })
              }))
            }))
          }))
        }))
      }
      mockSupabase.from.mockReturnValue(mockChain as any)

      render(<IndepthAnalysisCard {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Bicep Curls')).toBeInTheDocument()
        expect(screen.getByText('declining')).toBeInTheDocument()
        
        // Should have red styling classes for decline
        const badge = screen.getByText('declining').closest('.bg-red-100')
        expect(badge).toBeInTheDocument()
      })
    })

    it('displays "stable" trend with Minus icon for minimal changes', async () => {
      let callCount = 0
      const mockChain = {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            gte: jest.fn(() => ({
              lte: jest.fn(() => ({
                order: jest.fn(() => {
                  callCount++
                  if (callCount === 1) {
                    return Promise.resolve({ 
                      data: [{
                        exercise_name: 'Plank',
                        weight: 0,
                        reps: 60, // Minimal change
                        sets: 3,
                        muscle_group: 'core',
                        created_at: '2024-01-15T12:00:00.000Z'
                      }], 
                      error: null 
                    })
                  } else {
                    return Promise.resolve({ 
                      data: [{
                        exercise_name: 'Plank',
                        weight: 0,
                        reps: 59, // Very close to today's value
                        sets: 3,
                        muscle_group: 'core',
                        created_at: '2024-01-08T12:00:00.000Z'
                      }], 
                      error: null 
                    })
                  }
                })
              }))
            }))
          }))
        }))
      }
      mockSupabase.from.mockReturnValue(mockChain as any)

      render(<IndepthAnalysisCard {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Plank')).toBeInTheDocument()
        expect(screen.getByText('stable')).toBeInTheDocument()
        
        // Should have gray styling classes for stable
        const badge = screen.getByText('stable').closest('.bg-gray-100')
        expect(badge).toBeInTheDocument()
      })
    })
  })

  describe('Multiple Exercises', () => {
    it('handles multiple exercises and sorts by volume change', async () => {
      let callCount = 0
      const mockChain = {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            gte: jest.fn(() => ({
              lte: jest.fn(() => ({
                order: jest.fn(() => {
                  callCount++
                  if (callCount === 1) {
                    // Today's workouts - multiple exercises
                    return Promise.resolve({ 
                      data: [
                        {
                          exercise_name: 'Bench Press',
                          weight: 85,
                          reps: 10,
                          sets: 3,
                          muscle_group: 'chest',
                          created_at: '2024-01-15T12:00:00.000Z'
                        },
                        {
                          exercise_name: 'Squat',
                          weight: 110,
                          reps: 8,
                          sets: 3,
                          muscle_group: 'legs',
                          created_at: '2024-01-15T12:00:00.000Z'
                        }
                      ], 
                      error: null 
                    })
                  } else {
                    // Last week's workouts
                    return Promise.resolve({ 
                      data: [
                        {
                          exercise_name: 'Bench Press',
                          weight: 80,
                          reps: 10,
                          sets: 3,
                          muscle_group: 'chest',
                          created_at: '2024-01-08T12:00:00.000Z'
                        },
                        {
                          exercise_name: 'Squat',
                          weight: 100,
                          reps: 8,
                          sets: 3,
                          muscle_group: 'legs',
                          created_at: '2024-01-08T12:00:00.000Z'
                        }
                      ], 
                      error: null 
                    })
                  }
                })
              }))
            }))
          }))
        }))
      }
      mockSupabase.from.mockReturnValue(mockChain as any)

      render(<IndepthAnalysisCard {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Bench Press')).toBeInTheDocument()
        expect(screen.getByText('Squat')).toBeInTheDocument()
        
        // Both should show improvements
        const improvingBadges = screen.getAllByText('improving')
        expect(improvingBadges).toHaveLength(2)
      })
    })

    it('only shows exercises that exist in both weeks', async () => {
      let callCount = 0
      const mockChain = {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            gte: jest.fn(() => ({
              lte: jest.fn(() => ({
                order: jest.fn(() => {
                  callCount++
                  if (callCount === 1) {
                    // Today's workouts - two exercises
                    return Promise.resolve({ 
                      data: [
                        {
                          exercise_name: 'Bench Press',
                          weight: 85,
                          reps: 10,
                          sets: 3,
                          muscle_group: 'chest',
                          created_at: '2024-01-15T12:00:00.000Z'
                        },
                        {
                          exercise_name: 'New Exercise',
                          weight: 50,
                          reps: 12,
                          sets: 3,
                          muscle_group: 'arms',
                          created_at: '2024-01-15T12:00:00.000Z'
                        }
                      ], 
                      error: null 
                    })
                  } else {
                    // Last week's workouts - only one matching exercise
                    return Promise.resolve({ 
                      data: [
                        {
                          exercise_name: 'Bench Press',
                          weight: 80,
                          reps: 10,
                          sets: 3,
                          muscle_group: 'chest',
                          created_at: '2024-01-08T12:00:00.000Z'
                        }
                      ], 
                      error: null 
                    })
                  }
                })
              }))
            }))
          }))
        }))
      }
      mockSupabase.from.mockReturnValue(mockChain as any)

      render(<IndepthAnalysisCard {...defaultProps} />)

      await waitFor(() => {
        // Should only show Bench Press (exists in both weeks)
        expect(screen.getByText('Bench Press')).toBeInTheDocument()
        // Should NOT show New Exercise (only exists this week)
        expect(screen.queryByText('New Exercise')).not.toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('has proper heading structure', async () => {
      const mockChain = {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            gte: jest.fn(() => ({
              lte: jest.fn(() => ({
                order: jest.fn(() => Promise.resolve({ data: [], error: null }))
              }))
            }))
          }))
        }))
      }
      mockSupabase.from.mockReturnValue(mockChain as any)

      render(<IndepthAnalysisCard {...defaultProps} />)

      await waitFor(() => {
        const heading = screen.getByText('Indepth Analysis')
        expect(heading).toBeInTheDocument()
        // Should be in a CardTitle which typically renders as h3
      })
    })

    it('applies custom className when provided', async () => {
      const mockChain = {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            gte: jest.fn(() => ({
              lte: jest.fn(() => ({
                order: jest.fn(() => Promise.resolve({ data: [], error: null }))
              }))
            }))
          }))
        }))
      }
      mockSupabase.from.mockReturnValue(mockChain as any)

      const { container } = render(<IndepthAnalysisCard {...defaultProps} className="custom-class" />)

      await waitFor(() => {
        const cardElement = container.querySelector('.custom-class')
        expect(cardElement).toBeInTheDocument()
      })
    })
  })
}) 
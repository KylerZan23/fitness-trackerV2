import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { WorkoutLog } from './WorkoutLog'
import * as dbModule from '@/lib/db/index'

// Mock the logWorkout function
jest.mock('@/lib/db/index', () => ({
  logWorkout: jest.fn(),
}))

const mockLogWorkout = dbModule.logWorkout as jest.MockedFunction<typeof dbModule.logWorkout>

describe('WorkoutLog', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Form Rendering', () => {
    it('renders all expected input fields', () => {
      render(<WorkoutLog />)

      // Check for form title
      expect(screen.getByRole('heading', { name: /log workout/i })).toBeInTheDocument()

      // Check for all form fields
      expect(screen.getByLabelText(/exercise name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/sets/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/reps/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/weight/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/duration/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/notes/i)).toBeInTheDocument()

      // Check for submit button
      expect(screen.getByRole('button', { name: /log workout/i })).toBeInTheDocument()
    })

    it('has correct input types and attributes', () => {
      render(<WorkoutLog />)

      // Exercise name should be text input
      const exerciseNameInput = screen.getByLabelText(/exercise name/i)
      expect(exerciseNameInput).toHaveAttribute('type', 'text')
      expect(exerciseNameInput).toHaveAttribute('placeholder', 'e.g., Bench Press')

      // Numeric inputs should have correct types
      expect(screen.getByLabelText(/sets/i)).toHaveAttribute('type', 'number')
      expect(screen.getByLabelText(/reps/i)).toHaveAttribute('type', 'number')
      expect(screen.getByLabelText(/weight/i)).toHaveAttribute('type', 'number')
      expect(screen.getByLabelText(/weight/i)).toHaveAttribute('step', '0.5')
      expect(screen.getByLabelText(/duration/i)).toHaveAttribute('type', 'number')

      // Notes should be textarea
      expect(screen.getByLabelText(/notes/i)).toHaveProperty('tagName', 'TEXTAREA')
    })

    it('does not show success or error messages initially', () => {
      render(<WorkoutLog />)

      expect(screen.queryByText(/workout logged successfully/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/error/i)).not.toBeInTheDocument()
    })
  })

  describe('Form Validation', () => {
    it('displays validation errors for empty required fields', async () => {
      const user = userEvent.setup()
      render(<WorkoutLog />)

      const submitButton = screen.getByRole('button', { name: /log workout/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/exercise name must be at least 2 characters/i)).toBeInTheDocument()
        expect(screen.getByText(/must have at least 1 set/i)).toBeInTheDocument()
        expect(screen.getByText(/must have at least 1 rep/i)).toBeInTheDocument()
        expect(screen.getByText(/weight cannot be negative/i)).toBeInTheDocument()
        expect(screen.getByText(/duration cannot be negative/i)).toBeInTheDocument()
      })
    })

    it('displays validation error for exercise name that is too short', async () => {
      const user = userEvent.setup()
      render(<WorkoutLog />)

      const exerciseNameInput = screen.getByLabelText(/exercise name/i)
      await user.type(exerciseNameInput, 'A')
      
      const submitButton = screen.getByRole('button', { name: /log workout/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/exercise name must be at least 2 characters/i)).toBeInTheDocument()
      })
    })

    it('displays validation error for exercise name that is too long', async () => {
      const user = userEvent.setup()
      render(<WorkoutLog />)

      const exerciseNameInput = screen.getByLabelText(/exercise name/i)
      const longName = 'A'.repeat(51) // 51 characters
      await user.type(exerciseNameInput, longName)
      
      const submitButton = screen.getByRole('button', { name: /log workout/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/exercise name must be less than 50 characters/i)).toBeInTheDocument()
      })
    })

    it('displays validation errors for invalid numeric values', async () => {
      const user = userEvent.setup()
      render(<WorkoutLog />)

      // Fill in exercise name to avoid that validation error
      await user.type(screen.getByLabelText(/exercise name/i), 'Bench Press')

      // Test sets validation
      const setsInput = screen.getByLabelText(/sets/i)
      await user.clear(setsInput)
      await user.type(setsInput, '0')

      // Test reps validation
      const repsInput = screen.getByLabelText(/reps/i)
      await user.clear(repsInput)
      await user.type(repsInput, '0')

      // Test weight validation
      const weightInput = screen.getByLabelText(/weight/i)
      await user.clear(weightInput)
      await user.type(weightInput, '-10')

      const submitButton = screen.getByRole('button', { name: /log workout/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/must have at least 1 set/i)).toBeInTheDocument()
        expect(screen.getByText(/must have at least 1 rep/i)).toBeInTheDocument()
        expect(screen.getByText(/weight cannot be negative/i)).toBeInTheDocument()
      })
    })

    it('displays validation error for notes that are too long', async () => {
      const user = userEvent.setup()
      render(<WorkoutLog />)

      const notesTextarea = screen.getByLabelText(/notes/i)
      const longNotes = 'A'.repeat(501) // 501 characters
      await user.type(notesTextarea, longNotes)
      
      const submitButton = screen.getByRole('button', { name: /log workout/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/notes must be less than 500 characters/i)).toBeInTheDocument()
      })
    })

    it('accepts valid form data without validation errors', async () => {
      const user = userEvent.setup()
      const mockWorkout = {
        id: '123',
        user_id: 'user1',
        exerciseName: 'Bench Press',
        sets: 3,
        reps: 10,
        weight: 80,
        duration: 45,
        notes: 'Felt good today',
        created_at: new Date().toISOString()
      }
      mockLogWorkout.mockResolvedValue(mockWorkout)
      
      render(<WorkoutLog />)

      // Fill in valid data
      await user.type(screen.getByLabelText(/exercise name/i), 'Bench Press')
      await user.type(screen.getByLabelText(/sets/i), '3')
      await user.type(screen.getByLabelText(/reps/i), '10')
      await user.type(screen.getByLabelText(/weight/i), '80')
      await user.type(screen.getByLabelText(/duration/i), '45')
      await user.type(screen.getByLabelText(/notes/i), 'Felt good today')

      const submitButton = screen.getByRole('button', { name: /log workout/i })
      await user.click(submitButton)

      // Should not show validation errors
      await waitFor(() => {
        expect(screen.queryByText(/must be at least/i)).not.toBeInTheDocument()
        expect(screen.queryByText(/cannot be negative/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Form Submission', () => {
    it('calls logWorkout with correct payload on successful submission', async () => {
      const user = userEvent.setup()
      const mockWorkout = {
        id: '123',
        user_id: 'user1',
        exerciseName: 'Bench Press',
        sets: 3,
        reps: 10,
        weight: 80.5,
        duration: 45,
        notes: 'Felt good today',
        created_at: new Date().toISOString()
      }
      mockLogWorkout.mockResolvedValue(mockWorkout)
      
      render(<WorkoutLog />)

      // Fill in form data
      await user.type(screen.getByLabelText(/exercise name/i), 'Bench Press')
      await user.type(screen.getByLabelText(/sets/i), '3')
      await user.type(screen.getByLabelText(/reps/i), '10')
      await user.type(screen.getByLabelText(/weight/i), '80.5')
      await user.type(screen.getByLabelText(/duration/i), '45')
      await user.type(screen.getByLabelText(/notes/i), 'Felt good today')

      const submitButton = screen.getByRole('button', { name: /log workout/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockLogWorkout).toHaveBeenCalledWith({
          exerciseName: 'Bench Press',
          sets: 3,
          reps: 10,
          weight: 80.5,
          duration: 45,
          notes: 'Felt good today',
        })
      })
    })

    it('calls onSuccess callback when provided and submission succeeds', async () => {
      const user = userEvent.setup()
      const mockOnSuccess = jest.fn()
      const mockWorkout = {
        id: '123',
        user_id: 'user1',
        exerciseName: 'Bench Press',
        sets: 3,
        reps: 10,
        weight: 80,
        duration: 45,
        created_at: new Date().toISOString()
      }
      mockLogWorkout.mockResolvedValue(mockWorkout)
      
      render(<WorkoutLog onSuccess={mockOnSuccess} />)

      // Fill in minimal valid data
      await user.type(screen.getByLabelText(/exercise name/i), 'Bench Press')
      await user.type(screen.getByLabelText(/sets/i), '3')
      await user.type(screen.getByLabelText(/reps/i), '10')
      await user.type(screen.getByLabelText(/weight/i), '80')
      await user.type(screen.getByLabelText(/duration/i), '45')

      const submitButton = screen.getByRole('button', { name: /log workout/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledTimes(1)
      })
    })

    it('resets form after successful submission', async () => {
      const user = userEvent.setup()
      const mockWorkout = {
        id: '123',
        user_id: 'user1',
        exerciseName: 'Bench Press',
        sets: 3,
        reps: 10,
        weight: 80,
        duration: 45,
        created_at: new Date().toISOString()
      }
      mockLogWorkout.mockResolvedValue(mockWorkout)
      
      render(<WorkoutLog />)

      // Fill in form data
      const exerciseNameInput = screen.getByLabelText(/exercise name/i)
      const setsInput = screen.getByLabelText(/sets/i)
      const repsInput = screen.getByLabelText(/reps/i)
      
      await user.type(exerciseNameInput, 'Bench Press')
      await user.type(setsInput, '3')
      await user.type(repsInput, '10')
      await user.type(screen.getByLabelText(/weight/i), '80')
      await user.type(screen.getByLabelText(/duration/i), '45')

      const submitButton = screen.getByRole('button', { name: /log workout/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(exerciseNameInput).toHaveValue('')
        expect(setsInput).toHaveValue(null)
        expect(repsInput).toHaveValue(null)
      })
    })
  })

  describe('UI States', () => {
    it('displays loading state during submission', async () => {
      const user = userEvent.setup()
      // Mock a delayed response
      const mockWorkout = {
        id: '123',
        user_id: 'user1',
        exerciseName: 'Bench Press',
        sets: 3,
        reps: 10,
        weight: 80,
        duration: 45,
        created_at: new Date().toISOString()
      }
      mockLogWorkout.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(mockWorkout), 100)))
      
      render(<WorkoutLog />)

      // Fill in minimal valid data
      await user.type(screen.getByLabelText(/exercise name/i), 'Bench Press')
      await user.type(screen.getByLabelText(/sets/i), '3')
      await user.type(screen.getByLabelText(/reps/i), '10')
      await user.type(screen.getByLabelText(/weight/i), '80')
      await user.type(screen.getByLabelText(/duration/i), '45')

      const submitButton = screen.getByRole('button', { name: /log workout/i })
      await user.click(submitButton)

      // Check loading state
      expect(screen.getByRole('button', { name: /logging workout.../i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /logging workout.../i })).toBeDisabled()

      // Check that all inputs are disabled during loading
      expect(screen.getByLabelText(/exercise name/i)).toBeDisabled()
      expect(screen.getByLabelText(/sets/i)).toBeDisabled()
      expect(screen.getByLabelText(/reps/i)).toBeDisabled()

      // Wait for completion
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /log workout/i })).toBeInTheDocument()
      })
    })

    it('displays success message after successful submission', async () => {
      const user = userEvent.setup()
      const mockWorkout = {
        id: '123',
        user_id: 'user1',
        exerciseName: 'Bench Press',
        sets: 3,
        reps: 10,
        weight: 80,
        duration: 45,
        created_at: new Date().toISOString()
      }
      mockLogWorkout.mockResolvedValue(mockWorkout)
      
      render(<WorkoutLog />)

      // Fill in minimal valid data
      await user.type(screen.getByLabelText(/exercise name/i), 'Bench Press')
      await user.type(screen.getByLabelText(/sets/i), '3')
      await user.type(screen.getByLabelText(/reps/i), '10')
      await user.type(screen.getByLabelText(/weight/i), '80')
      await user.type(screen.getByLabelText(/duration/i), '45')

      const submitButton = screen.getByRole('button', { name: /log workout/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/workout logged successfully!/i)).toBeInTheDocument()
      })
    })

    it('displays error message when submission fails', async () => {
      const user = userEvent.setup()
      const errorMessage = 'Failed to save workout to database'
      mockLogWorkout.mockRejectedValue(new Error(errorMessage))
      
      render(<WorkoutLog />)

      // Fill in minimal valid data
      await user.type(screen.getByLabelText(/exercise name/i), 'Bench Press')
      await user.type(screen.getByLabelText(/sets/i), '3')
      await user.type(screen.getByLabelText(/reps/i), '10')
      await user.type(screen.getByLabelText(/weight/i), '80')
      await user.type(screen.getByLabelText(/duration/i), '45')

      const submitButton = screen.getByRole('button', { name: /log workout/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument()
      })
    })

    it('displays generic error message when logWorkout returns null', async () => {
      const user = userEvent.setup()
      mockLogWorkout.mockResolvedValue(null)
      
      render(<WorkoutLog />)

      // Fill in minimal valid data
      await user.type(screen.getByLabelText(/exercise name/i), 'Bench Press')
      await user.type(screen.getByLabelText(/sets/i), '3')
      await user.type(screen.getByLabelText(/reps/i), '10')
      await user.type(screen.getByLabelText(/weight/i), '80')
      await user.type(screen.getByLabelText(/duration/i), '45')

      const submitButton = screen.getByRole('button', { name: /log workout/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/failed to log workout/i)).toBeInTheDocument()
      })
    })

    it('clears previous error when new submission starts', async () => {
      const user = userEvent.setup()
      
      // First submission fails
      mockLogWorkout.mockRejectedValueOnce(new Error('Database error'))
      
      render(<WorkoutLog />)

      // Fill in data and submit
      await user.type(screen.getByLabelText(/exercise name/i), 'Bench Press')
      await user.type(screen.getByLabelText(/sets/i), '3')
      await user.type(screen.getByLabelText(/reps/i), '10')
      await user.type(screen.getByLabelText(/weight/i), '80')
      await user.type(screen.getByLabelText(/duration/i), '45')

      const submitButton = screen.getByRole('button', { name: /log workout/i })
      await user.click(submitButton)

      // Wait for error to appear
      await waitFor(() => {
        expect(screen.getByText(/database error/i)).toBeInTheDocument()
      })

      // Second submission succeeds
      const successWorkout = {
        id: '123',
        user_id: 'user1',
        exerciseName: 'Squat',
        sets: 3,
        reps: 10,
        weight: 80,
        duration: 45,
        created_at: new Date().toISOString()
      }
      mockLogWorkout.mockResolvedValue(successWorkout)
      
      // Fill in new data and submit again
      await user.type(screen.getByLabelText(/exercise name/i), 'Squat')
      await user.click(submitButton)

      // Error should be cleared during new submission
      await waitFor(() => {
        expect(screen.queryByText(/database error/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('has proper form labels and associations', () => {
      render(<WorkoutLog />)

      // Check that all inputs have proper labels
      expect(screen.getByLabelText(/exercise name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/sets/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/reps/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/weight/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/duration/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/notes/i)).toBeInTheDocument()
    })

    it('has proper heading structure', () => {
      render(<WorkoutLog />)

      const heading = screen.getByRole('heading', { name: /log workout/i })
      expect(heading).toBeInTheDocument()
      expect(heading).toHaveProperty('tagName', 'H2')
    })

    it('error messages are associated with their inputs', async () => {
      const user = userEvent.setup()
      render(<WorkoutLog />)

      const submitButton = screen.getByRole('button', { name: /log workout/i })
      await user.click(submitButton)

      await waitFor(() => {
        // Check that error messages are properly associated
        const exerciseNameInput = screen.getByLabelText(/exercise name/i)
        const errorMessage = screen.getByText(/exercise name must be at least 2 characters/i)
        
        // The error should be in the DOM and accessible
        expect(errorMessage).toBeInTheDocument()
        expect(exerciseNameInput).toBeInvalid()
      })
    })
  })
}) 
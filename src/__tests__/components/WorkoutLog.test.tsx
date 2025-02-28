import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { WorkoutLog } from '@/components/workout/WorkoutLog'
import { logWorkout } from '@/lib/db'

// Mock the db functions
jest.mock('@/lib/db', () => ({
  logWorkout: jest.fn(),
}))

describe('WorkoutLog', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the workout form', () => {
    render(<WorkoutLog />)
    
    expect(screen.getByLabelText(/exercise name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/sets/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/reps/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/weight/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/duration/i)).toBeInTheDocument()
  })

  it('handles successful form submission', async () => {
    const mockWorkout = {
      id: '123',
      user_id: 'user123',
      exerciseName: 'Bench Press',
      sets: 3,
      reps: 10,
      weight: 100,
      duration: 30,
      created_at: new Date().toISOString(),
    }

    ;(logWorkout as jest.Mock).mockResolvedValueOnce(mockWorkout)

    const onSuccess = jest.fn()
    render(<WorkoutLog onSuccess={onSuccess} />)

    fireEvent.change(screen.getByLabelText(/exercise name/i), {
      target: { value: 'Bench Press' },
    })
    fireEvent.change(screen.getByLabelText(/sets/i), {
      target: { value: '3' },
    })
    fireEvent.change(screen.getByLabelText(/reps/i), {
      target: { value: '10' },
    })
    fireEvent.change(screen.getByLabelText(/weight/i), {
      target: { value: '100' },
    })
    fireEvent.change(screen.getByLabelText(/duration/i), {
      target: { value: '30' },
    })

    fireEvent.click(screen.getByText(/log workout/i))

    await waitFor(() => {
      expect(logWorkout).toHaveBeenCalledWith({
        exerciseName: 'Bench Press',
        sets: 3,
        reps: 10,
        weight: 100,
        duration: 30,
      })
      expect(onSuccess).toHaveBeenCalled()
      expect(screen.getByText(/workout logged successfully/i)).toBeInTheDocument()
    })
  })

  it('displays validation errors', async () => {
    render(<WorkoutLog />)

    fireEvent.click(screen.getByText(/log workout/i))

    await waitFor(() => {
      expect(screen.getByText(/exercise name must be at least 2 characters/i)).toBeInTheDocument()
      expect(screen.getByText(/must have at least 1 set/i)).toBeInTheDocument()
    })
  })

  it('handles API errors', async () => {
    ;(logWorkout as jest.Mock).mockRejectedValueOnce(new Error('API Error'))

    render(<WorkoutLog />)

    fireEvent.change(screen.getByLabelText(/exercise name/i), {
      target: { value: 'Bench Press' },
    })
    fireEvent.change(screen.getByLabelText(/sets/i), {
      target: { value: '3' },
    })
    fireEvent.change(screen.getByLabelText(/reps/i), {
      target: { value: '10' },
    })
    fireEvent.change(screen.getByLabelText(/weight/i), {
      target: { value: '100' },
    })
    fireEvent.change(screen.getByLabelText(/duration/i), {
      target: { value: '30' },
    })

    fireEvent.click(screen.getByText(/log workout/i))

    await waitFor(() => {
      expect(screen.getByText(/an error occurred while logging your workout/i)).toBeInTheDocument()
    })
  })
}) 
import { describe, it, expect } from 'vitest'
import { extractApiErrorMessage } from './apiError'

describe('extractApiErrorMessage', () => {
  it('returns the concrete field message, not the generic "Validation failed"', () => {
    // Exact body from POST /api/appointments when ScheduledAt is in the past.
    const body = {
      status: 400,
      message: 'Validation failed',
      errors: { ScheduledAt: ['Appointment must be scheduled in the future'] },
    }

    const msg = extractApiErrorMessage(body)

    expect(msg).toBe('Appointment must be scheduled in the future')
    expect(msg).not.toBe('Validation failed')
  })

  it('joins messages across multiple invalid fields', () => {
    const body = {
      status: 400,
      message: 'Validation failed',
      errors: {
        ScheduledAt: ['Appointment must be scheduled in the future'],
        DurationMinutes: ['Duration must be positive'],
      },
    }

    expect(extractApiErrorMessage(body)).toBe(
      'Appointment must be scheduled in the future; Duration must be positive',
    )
  })

  it('falls back to message when there is no errors object', () => {
    expect(
      extractApiErrorMessage({ status: 409, message: 'Slot already booked' }),
    ).toBe('Slot already booked')
  })

  it('falls back to the provided fallback when body is empty', () => {
    expect(extractApiErrorMessage(undefined, 'Network error')).toBe('Network error')
  })

  it('ignores an empty errors object', () => {
    expect(
      extractApiErrorMessage({ message: 'Validation failed', errors: {} }),
    ).toBe('Validation failed')
  })
})

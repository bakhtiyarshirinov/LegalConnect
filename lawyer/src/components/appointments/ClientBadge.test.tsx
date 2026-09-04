import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ClientBadge } from './ClientBadge'
import type { Appointment } from '../../api/appointments'

// Shape mirrors GET /api/appointments/lawyer/{lawyerId} — the field is clientFullName.
const mockAppointment: Appointment = {
  id: 'a1',
  clientId: 'c1',
  clientFullName: 'Anar Həsənov',
  lawyerId: 'l1',
  scheduledAt: '2026-09-10T09:00:00Z',
  durationMinutes: 60,
  type: 'Online',
  status: 'Confirmed',
  price: 100,
}

describe('ClientBadge', () => {
  it('renders the real client name and its initial as the avatar', () => {
    const { container } = render(
      <ClientBadge fullName={mockAppointment.clientFullName} subtitle="10 Sep, 09:00" />,
    )

    expect(screen.getByText('Anar Həsənov')).toBeInTheDocument()
    expect(screen.getByText('A')).toBeInTheDocument() // avatar initial, not "?"
    expect(screen.getByText('10 Sep, 09:00')).toBeInTheDocument()
    expect(container.textContent).not.toContain('?')
    expect(container).toMatchSnapshot()
  })

  it('falls back to "?" and a placeholder name when clientFullName is missing', () => {
    render(<ClientBadge fullName={undefined} />)

    expect(screen.getByText('?')).toBeInTheDocument()
    expect(screen.getByText('Naməlum müştəri')).toBeInTheDocument()
  })

  it('falls back when clientFullName is an empty / whitespace string', () => {
    render(<ClientBadge fullName="   " />)
    expect(screen.getByText('?')).toBeInTheDocument()
  })
})

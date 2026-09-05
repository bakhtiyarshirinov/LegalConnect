import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ProposeRescheduleModal } from './ProposeRescheduleModal'

describe('ProposeRescheduleModal', () => {
  it('disables submit until a time is picked when opened without a pre-filled newTime (card-button flow)', () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined)
    render(
      <ProposeRescheduleModal open newTime={null} onClose={() => {}} onConfirm={onConfirm} />,
    )

    expect(screen.getByText('Sorğu göndər')).toBeDisabled()

    fireEvent.change(screen.getByLabelText('Yeni tarix və saat'), {
      target: { value: '2099-01-01T10:00' },
    })

    expect(screen.getByText('Sorğu göndər')).not.toBeDisabled()
  })

  it('pre-fills the picked time from a drag-and-drop drop target (calendar flow) and still allows submit', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined)
    const dropTime = new Date('2099-01-01T10:00:00')
    render(
      <ProposeRescheduleModal open newTime={dropTime} onClose={() => {}} onConfirm={onConfirm} />,
    )

    expect(screen.getByText('Sorğu göndər')).not.toBeDisabled()

    fireEvent.click(screen.getByText('Sorğu göndər'))

    expect(onConfirm).toHaveBeenCalledWith(dropTime, undefined)
  })
})

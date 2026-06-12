import { useState } from 'react'
import { motion } from 'framer-motion'
import { Star } from 'lucide-react'
import toast from 'react-hot-toast'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { reviewsApi } from '../../api/reviews'
import { useAuthStore } from '../../store/authStore'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'

interface Props {
  open: boolean
  onClose: () => void
  appointmentId: string
  lawyerId: string
  lawyerName: string
}

export function ReviewModal({ open, onClose, appointmentId, lawyerId, lawyerName }: Props) {
  const user = useAuthStore((s) => s.user)!
  const qc = useQueryClient()
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState('')

  const mutation = useMutation({
    mutationFn: () => reviewsApi.create({
      clientId: user.userId,
      lawyerId,
      appointmentId,
      rating,
      comment: comment.trim() || undefined,
    }),
    onSuccess: () => {
      toast.success('Rəy göndərildi!')
      qc.invalidateQueries({ queryKey: ['reviews', lawyerId] })
      qc.invalidateQueries({ queryKey: ['clientReviews', user.userId] })
      handleClose()
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const handleClose = () => {
    setRating(0)
    setHover(0)
    setComment('')
    onClose()
  }

  const labels = ['', 'Zəif', 'Orta', 'Yaxşı', 'Çox yaxşı', 'Əla']

  return (
    <Modal open={open} onClose={handleClose} title={`${lawyerName} haqqında rəy`} width={440}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Stars */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <motion.button
                key={n}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setRating(n)}
                onMouseEnter={() => setHover(n)}
                onMouseLeave={() => setHover(0)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
              >
                <Star
                  size={32}
                  color="#f59e0b"
                  fill={n <= (hover || rating) ? '#f59e0b' : 'none'}
                  strokeWidth={1.5}
                />
              </motion.button>
            ))}
          </div>
          <span style={{ fontSize: 13, color: '#6B6B6B', minHeight: 18 }}>
            {labels[hover || rating]}
          </span>
        </div>

        {/* Comment */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 13, fontWeight: 500, color: '#0A0A0A' }}>
            Şərh <span style={{ color: '#A3A3A3', fontWeight: 400 }}>(isteğe bağlı)</span>
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value.slice(0, 500))}
            placeholder="Bu vəkillə təcrübənizi paylaşın..."
            rows={4}
            style={{
              border: '1px solid #E8E8E8', borderRadius: 10, padding: '11px 14px',
              fontSize: 14, outline: 'none', resize: 'vertical',
              fontFamily: 'Inter, sans-serif', background: '#FFFFFF', color: '#0A0A0A',
              lineHeight: 1.5,
            }}
            onFocus={(e) => { e.target.style.borderColor = '#0A0A0A' }}
            onBlur={(e) => { e.target.style.borderColor = '#E8E8E8' }}
          />
          <div style={{ fontSize: 11, color: '#A3A3A3', textAlign: 'right' }}>
            {comment.length}/500
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="secondary" fullWidth onClick={handleClose}>Ləğv et</Button>
          <Button
            fullWidth
            loading={mutation.isPending}
            disabled={rating === 0}
            onClick={() => mutation.mutate()}
          >
            Rəyi göndər
          </Button>
        </div>
      </div>
    </Modal>
  )
}

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Calendar, XCircle, Star } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { appointmentsApi } from '../../api/appointments'
import { reviewsApi } from '../../api/reviews'
import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import { SkeletonCard } from '../../components/ui/Skeleton'
import { ReviewModal } from '../../components/reviews/ReviewModal'

const stagger = { visible: { transition: { staggerChildren: 0.07 } } }
const item = { hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0 } }

const statusOrder = ['Pending', 'Confirmed', 'Completed', 'Cancelled']

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  }) + ' at ' + new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

export default function ClientAppointments() {
  const user = useAuthStore((s) => s.user)!
  const qc = useQueryClient()
  const [reviewTarget, setReviewTarget] = useState<{
    appointmentId: string; lawyerId: string; lawyerName: string
  } | null>(null)

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['clientAppointments', user.userId],
    queryFn: () => appointmentsApi.getByClient(user.userId),
  })

  const completedLawyerIds = [
    ...new Set(
      appointments.filter((a) => a.status === 'Completed').map((a) => a.lawyerId)
    ),
  ]

  // Fetch reviews for all lawyers the client has completed appointments with
  const { data: allReviews = [] } = useQuery({
    queryKey: ['clientReviews', user.userId, completedLawyerIds.join(',')],
    queryFn: async () => {
      const results = await Promise.all(completedLawyerIds.map((id) => reviewsApi.getByLawyer(id)))
      return results.flat()
    },
    enabled: completedLawyerIds.length > 0,
  })

  const reviewedApptIds = new Set(allReviews.map((r) => r.appointmentId))

  const cancelMutation = useMutation({
    mutationFn: (id: string) => appointmentsApi.cancel(id, user.userId),
    onSuccess: () => {
      toast.success('Appointment cancelled')
      qc.invalidateQueries({ queryKey: ['clientAppointments', user.userId] })
      qc.invalidateQueries({ queryKey: ['appointments', user.userId] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const sorted = [...appointments].sort((a, b) => {
    const ai = statusOrder.indexOf(a.status)
    const bi = statusOrder.indexOf(b.status)
    if (ai !== bi) return ai - bi
    return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
  })

  const pendingCount = appointments.filter((a) => a.status === 'Pending').length
  const confirmedCount = appointments.filter((a) => a.status === 'Confirmed').length

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{ padding: '32px 28px', maxWidth: 800 }}
    >
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#0A0A0A', letterSpacing: '-0.5px' }}>
          My Appointments
        </h1>
        <p style={{ color: '#6B6B6B', marginTop: 4 }}>
          {appointments.length} total · {pendingCount} pending · {confirmedCount} confirmed
        </p>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : sorted.length === 0 ? (
        <Card padding={40} style={{ textAlign: 'center' }}>
          <Calendar size={40} style={{ margin: '0 auto 12px', opacity: 0.3, color: '#6B6B6B' }} />
          <p style={{ color: '#6B6B6B' }}>No appointments yet</p>
        </Card>
      ) : (
        <motion.div variants={stagger} initial="hidden" animate="visible" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {sorted.map((appt) => (
            <motion.div key={appt.id} variants={item}>
              <Card padding={20}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <div style={{
                        width: 36, height: 36, background: '#E8E8E8', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, color: '#0A0A0A', fontSize: 14, flexShrink: 0,
                      }}>
                        {appt.lawyerFullName[0]}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: '#0A0A0A', fontSize: 15 }}>{appt.lawyerFullName}</div>
                        <div style={{ display: 'flex', gap: 6, marginTop: 3 }}>
                          <Badge>{appt.status}</Badge>
                          <Badge>{appt.type}</Badge>
                        </div>
                      </div>
                    </div>
                    <div style={{ color: '#6B6B6B', fontSize: 13, paddingLeft: 46, display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <span>📅 {formatDate(appt.scheduledAt)}</span>
                      <span>⏱ {appt.durationMinutes} minutes · ${appt.price}</span>
                      {appt.notes && <span style={{ fontStyle: 'italic' }}>"{appt.notes}"</span>}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
                    {(appt.status === 'Pending' || appt.status === 'Confirmed') && (
                      <button
                        onClick={() => cancelMutation.mutate(appt.id)}
                        disabled={cancelMutation.isPending}
                        style={{
                          background: '#FFF1F0', color: '#E03131',
                          border: '1px solid #FFCCC7', borderRadius: 8,
                          padding: '6px 14px', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: 6,
                          fontSize: 13, fontWeight: 500, fontFamily: 'Inter, sans-serif',
                          opacity: cancelMutation.isPending ? 0.6 : 1,
                        }}
                      >
                        <XCircle size={14} /> Cancel
                      </button>
                    )}

                    {appt.status === 'Completed' && (
                      reviewedApptIds.has(appt.id) ? (
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 5,
                          color: '#6B6B6B', fontSize: 13, fontWeight: 500,
                        }}>
                          <Star size={14} color="#f59e0b" fill="#f59e0b" />
                          Reviewed
                        </div>
                      ) : (
                        <button
                          onClick={() => setReviewTarget({
                            appointmentId: appt.id,
                            lawyerId: appt.lawyerId,
                            lawyerName: appt.lawyerFullName,
                          })}
                          style={{
                            background: '#FFFBEB', color: '#B45309',
                            border: '1px solid #FDE68A', borderRadius: 8,
                            padding: '6px 14px', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 6,
                            fontSize: 13, fontWeight: 500, fontFamily: 'Inter, sans-serif',
                          }}
                        >
                          <Star size={14} /> Leave Review
                        </button>
                      )
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      {reviewTarget && (
        <ReviewModal
          open={!!reviewTarget}
          onClose={() => setReviewTarget(null)}
          appointmentId={reviewTarget.appointmentId}
          lawyerId={reviewTarget.lawyerId}
          lawyerName={reviewTarget.lawyerName}
        />
      )}
    </motion.div>
  )
}

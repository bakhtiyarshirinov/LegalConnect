import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Calendar, XCircle, Star, List, CalendarDays, Video } from 'lucide-react'
import ReactCalendar from 'react-calendar'
import { useAuthStore } from '../../store/authStore'
import { appointmentsApi, type AppointmentDto } from '../../api/appointments'
import { reviewsApi } from '../../api/reviews'
import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import { SkeletonCard } from '../../components/ui/Skeleton'
import { ReviewModal } from '../../components/reviews/ReviewModal'

const stagger = { visible: { transition: { staggerChildren: 0.07 } } }
const item = { hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0 } }

const STATUS_DOT: Record<string, string> = {
  Pending: '#F97316',
  Confirmed: '#16A34A',
  Completed: '#3B82F6',
  Cancelled: '#9CA3AF',
}

type View = 'list' | 'calendar'

function toLocalKey(isoStr: string): string {
  return new Date(isoStr).toLocaleDateString('en-CA')
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  }) + ' at ' + new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

function formatTime(d: string) {
  return new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

export default function ClientAppointments() {
  const user = useAuthStore((s) => s.user)!
  const qc = useQueryClient()
  const [view, setView] = useState<View>('list')
  const [selectedCalDate, setSelectedCalDate] = useState<Date | null>(null)
  const [reviewTarget, setReviewTarget] = useState<{
    appointmentId: string; lawyerId: string; lawyerName: string
  } | null>(null)

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['clientAppointments', user.userId],
    queryFn: () => appointmentsApi.getByClient(user.userId),
  })

  const completedLawyerIds = [...new Set(appointments.filter((a) => a.status === 'Completed').map((a) => a.lawyerId))]

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
      toast.success('Görüş ləğv edildi')
      qc.invalidateQueries({ queryKey: ['clientAppointments', user.userId] })
      qc.invalidateQueries({ queryKey: ['appointments', user.userId] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const joinMeeting = async (appt: AppointmentDto) => {
    if (appt.meetingUrl) {
      window.open(appt.meetingUrl, '_blank')
      return
    }
    try {
      const { meetingUrl } = await appointmentsApi.createMeeting(appt.id)
      window.open(meetingUrl, '_blank')
      qc.invalidateQueries({ queryKey: ['clientAppointments', user.userId] })
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Görüşə qoşulmaq alınmadı')
    }
  }

  function isWithin24Hours(scheduledAt: string) {
    const diff = new Date(scheduledAt).getTime() - Date.now()
    return diff >= 0 && diff <= 24 * 60 * 60 * 1000
  }

  const dateMap = appointments.reduce<Record<string, AppointmentDto[]>>((acc, a) => {
    const key = toLocalKey(a.scheduledAt)
    if (!acc[key]) acc[key] = []
    acc[key].push(a)
    return acc
  }, {})

  const selectedDateStr = selectedCalDate ? selectedCalDate.toLocaleDateString('en-CA') : null
  const selectedDayAppts = selectedDateStr ? (dateMap[selectedDateStr] ?? []) : []

  const sorted = [...appointments].sort((a, b) => {
    const order = ['Pending', 'Confirmed', 'Completed', 'Cancelled']
    const ai = order.indexOf(a.status)
    const bi = order.indexOf(b.status)
    if (ai !== bi) return ai - bi
    return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
  })

  const pendingCount = appointments.filter((a) => a.status === 'Pending').length
  const confirmedCount = appointments.filter((a) => a.status === 'Confirmed').length

  function ApptCard({ appt }: { appt: AppointmentDto }) {
    return (
      <Card padding={20}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 36, height: 36, background: 'var(--surface)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--text)', fontSize: 14, flexShrink: 0 }}>
                {appt.lawyerFullName[0]}
              </div>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: 15 }}>{appt.lawyerFullName}</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 3 }}>
                  <Badge>{appt.status}</Badge>
                  <Badge>{appt.type}</Badge>
                </div>
              </div>
            </div>
            <div style={{ color: 'var(--text-2)', fontSize: 13, paddingLeft: 46, display: 'flex', flexDirection: 'column', gap: 3 }}>
              <span>📅 {formatDate(appt.scheduledAt)}</span>
              <span>⏱ {appt.durationMinutes} dəqiqə · ${appt.price}</span>
              {appt.notes && <span style={{ fontStyle: 'italic' }}>"{appt.notes}"</span>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
            {appt.status === 'Confirmed' && isWithin24Hours(appt.scheduledAt) && (
              <button
                onClick={() => joinMeeting(appt)}
                style={{ background: '#1C7ED6', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600 }}
              >
                <Video size={14} /> Görüşə qoşul
              </button>
            )}
            {(appt.status === 'Pending' || appt.status === 'Confirmed') && (
              <button
                onClick={() => cancelMutation.mutate(appt.id)}
                disabled={cancelMutation.isPending}
                style={{ background: '#FFF1F0', color: '#E03131', border: '1px solid #FFCCC7', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500, opacity: cancelMutation.isPending ? 0.6 : 1 }}
              >
                <XCircle size={14} /> Ləğv et
              </button>
            )}
            {appt.status === 'Completed' && (
              reviewedApptIds.has(appt.id) ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-2)', fontSize: 13, fontWeight: 500 }}>
                  <Star size={14} color="#f59e0b" fill="#f59e0b" /> Rəy yazıldı ✓
                </div>
              ) : (
                <button
                  onClick={() => setReviewTarget({ appointmentId: appt.id, lawyerId: appt.lawyerId, lawyerName: appt.lawyerFullName })}
                  style={{ background: '#FFFBEB', color: '#B45309', border: '1px solid #FDE68A', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500 }}
                >
                  <Star size={14} /> Rəy yaz
                </button>
              )
            )}
          </div>
        </div>
      </Card>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{ padding: '32px 28px', maxWidth: 860 }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.5px' }}>Görüşlər</h1>
          <p style={{ color: 'var(--text-2)', marginTop: 4 }}>
            {appointments.length} Cəmi · {pendingCount} Gözləyir · {confirmedCount} Təsdiqləndi
          </p>
        </div>
        {/* View toggle */}
        <div style={{ display: 'flex', gap: 4, background: 'var(--surface)', padding: 4, borderRadius: 10 }}>
          {([['list', <List size={14} />, 'Siyahı'], ['calendar', <CalendarDays size={14} />, 'Təqvim']] as const).map(([v, icon, label]) => (
            <button
              key={v}
              onClick={() => setView(v as View)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 14px', borderRadius: 7, border: 'none',
                background: view === v ? 'var(--bg)' : 'transparent',
                color: view === v ? 'var(--text)' : 'var(--text-2)',
                fontWeight: view === v ? 600 : 500, fontSize: 13, cursor: 'pointer',
                boxShadow: view === v ? 'var(--shadow)' : 'none',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              {icon}{label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : view === 'list' ? (
        sorted.length === 0 ? (
          <Card padding={40} style={{ textAlign: 'center' }}>
            <Calendar size={40} style={{ margin: '0 auto 12px', opacity: 0.3, color: 'var(--text-2)' }} />
            <p style={{ color: 'var(--text-2)' }}>Görüş tapılmadı</p>
          </Card>
        ) : (
          <motion.div variants={stagger} initial="hidden" animate="visible" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {sorted.map((appt) => (
              <motion.div key={appt.id} variants={item}>
                <ApptCard appt={appt} />
              </motion.div>
            ))}
          </motion.div>
        )
      ) : (
        /* ── Calendar View ── */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <ReactCalendar
            onChange={(val) => setSelectedCalDate(val as Date)}
            value={selectedCalDate}
            tileContent={({ date, view: calView }) => {
              if (calView !== 'month') return null
              const key = date.toLocaleDateString('en-CA')
              const dayAppts = dateMap[key]
              if (!dayAppts?.length) return null
              return (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 2, marginTop: 3 }}>
                  {dayAppts.slice(0, 4).map((a, i) => (
                    <span key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: STATUS_DOT[a.status] ?? '#9CA3AF', flexShrink: 0 }} />
                  ))}
                </div>
              )
            }}
          />

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {Object.entries(STATUS_DOT).map(([status, color]) => (
              <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-2)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                {status}
              </div>
            ))}
          </div>

          {selectedCalDate && (
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>
                {selectedCalDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-2)', marginLeft: 8 }}>
                  {selectedDayAppts.length} görüş
                </span>
              </h3>
              {selectedDayAppts.length === 0 ? (
                <Card padding={24} style={{ textAlign: 'center', color: 'var(--text-2)', fontSize: 14 }}>
                  Bu gündə görüş yoxdur
                </Card>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {selectedDayAppts.map((appt) => (
                    <Card key={appt.id} padding={18}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: 14 }}>{appt.lawyerFullName}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>
                            {formatTime(appt.scheduledAt)} · {appt.durationMinutes} dəq · {appt.type}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>${appt.price}</span>
                          <span style={{ background: STATUS_DOT[appt.status] + '22', color: STATUS_DOT[appt.status], borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 700 }}>
                            {appt.status}
                          </span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
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

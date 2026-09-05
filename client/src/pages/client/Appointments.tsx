import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Calendar, XCircle, Trash2, Star, List, CalendarDays, Video } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { appointmentsApi, type AppointmentDto } from '../../api/appointments'
import { reviewsApi } from '../../api/reviews'
import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import { SkeletonCard } from '../../components/ui/Skeleton'
import { ReviewModal } from '../../components/reviews/ReviewModal'
import { AppointmentActionModal, type AppointmentAction } from '../../components/appointments/AppointmentActionModal'
import { ProposeRescheduleModal } from '../../components/appointments/ProposeRescheduleModal'
import { RespondRescheduleModal } from '../../components/appointments/RespondRescheduleModal'
import { RescheduleBadge } from '../../components/appointments/RescheduleBadge'
import { WeekTimeGrid, type GridAppointment } from '../../components/calendar/WeekTimeGrid'
import { startOfWeek } from '../../lib/weekGrid'

const stagger = { visible: { transition: { staggerChildren: 0.07 } } }
const item = { hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0 } }

type View = 'list' | 'calendar'

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  }) + ' at ' + new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

export default function ClientAppointments() {
  const user = useAuthStore((s) => s.user)!
  const qc = useQueryClient()
  const [view, setView] = useState<View>('list')
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()))
  const [reviewTarget, setReviewTarget] = useState<{
    appointmentId: string; lawyerId: string; lawyerName: string
  } | null>(null)
  const [actionTarget, setActionTarget] = useState<{
    id: string; action: AppointmentAction; lawyerName: string
  } | null>(null)
  const [proposeTarget, setProposeTarget] = useState<{ id: string; newTime: Date; lawyerName: string } | null>(null)
  const [respondTarget, setRespondTarget] = useState<{ id: string; proposedAt: string } | null>(null)
  const [respondBusy, setRespondBusy] = useState<string | null>(null)

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['appointments', user.userId],
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

  const runAction = async (reason: string | undefined) => {
    if (!actionTarget) return
    try {
      if (actionTarget.action === 'cancel') {
        await appointmentsApi.cancel(actionTarget.id, reason as string)
        toast.success('Görüş ləğv edildi')
      } else {
        await appointmentsApi.remove(actionTarget.id, reason)
        toast.success('Görüş silindi')
      }
      qc.invalidateQueries({ queryKey: ['appointments', user.userId] })
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Əməliyyat alınmadı')
      throw err
    }
  }

  const joinMeeting = async (appt: AppointmentDto) => {
    if (appt.meetingUrl) {
      window.open(appt.meetingUrl, '_blank')
      return
    }
    try {
      const { meetingUrl } = await appointmentsApi.createMeeting(appt.id)
      window.open(meetingUrl, '_blank')
      qc.invalidateQueries({ queryKey: ['appointments', user.userId] })
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Görüşə qoşulmaq alınmadı')
    }
  }

  function isWithin24Hours(scheduledAt: string) {
    const diff = new Date(scheduledAt).getTime() - Date.now()
    return diff >= 0 && diff <= 24 * 60 * 60 * 1000
  }

  const acceptReschedule = async (apptId: string) => {
    setRespondBusy(apptId)
    try {
      await appointmentsApi.respondReschedule(apptId, true)
      toast.success('Perenos təsdiqləndi, görüş vaxtı yeniləndi')
      qc.invalidateQueries({ queryKey: ['appointments', user.userId] })
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Əməliyyat alınmadı')
    } finally {
      setRespondBusy(null)
    }
  }

  const rejectReschedule = async (reason: string | undefined) => {
    if (!respondTarget) return
    try {
      await appointmentsApi.respondReschedule(respondTarget.id, false, reason)
      toast.success('Perenos təklifi rədd edildi')
      qc.invalidateQueries({ queryKey: ['appointments', user.userId] })
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Əməliyyat alınmadı')
      throw err
    }
  }

  const proposeReschedule = async (reason: string | undefined) => {
    if (!proposeTarget) return
    try {
      await appointmentsApi.proposeReschedule(proposeTarget.id, proposeTarget.newTime.toISOString(), reason)
      toast.success('Perenos sorğusu göndərildi')
      qc.invalidateQueries({ queryKey: ['appointments', user.userId] })
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Əməliyyat alınmadı')
      throw err
    }
  }

  const gridAppointments: GridAppointment[] = appointments
    .filter((a) => a.status !== 'Cancelled')
    .map((a) => ({
      id: a.id,
      scheduledAt: a.scheduledAt,
      durationMinutes: a.durationMinutes,
      status: a.status,
      title: a.lawyerFullName,
      rescheduleStatus: a.rescheduleStatus,
    }))

  const isApptLocked = (g: GridAppointment) =>
    g.status === 'Completed' || g.rescheduleStatus === 'Pending'

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
              {appt.status === 'Cancelled' && appt.cancellationReason && (
                <span style={{ color: '#E03131' }}>✕ Ləğv səbəbi: {appt.cancellationReason}</span>
              )}
            </div>
            {appt.rescheduleStatus === 'Pending' && appt.proposedScheduledAt && (
              <div style={{ paddingLeft: 46, marginTop: 8 }}>
                <RescheduleBadge
                  proposedScheduledAt={appt.proposedScheduledAt}
                  isOwnProposal={appt.proposedByUserId === user.userId}
                  accepting={respondBusy === appt.id}
                  onAccept={() => acceptReschedule(appt.id)}
                  onReject={() => setRespondTarget({ id: appt.id, proposedAt: appt.proposedScheduledAt! })}
                />
              </div>
            )}
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
              <>
                <button
                  onClick={() => setActionTarget({ id: appt.id, action: 'cancel', lawyerName: appt.lawyerFullName })}
                  style={{ background: '#FFF1F0', color: '#E03131', border: '1px solid #FFCCC7', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500 }}
                >
                  <XCircle size={14} /> Ləğv et
                </button>
                <button
                  onClick={() => setActionTarget({ id: appt.id, action: 'delete', lawyerName: appt.lawyerFullName })}
                  style={{ background: 'var(--surface)', color: 'var(--text-2)', border: '1px solid var(--border, #E8E8E8)', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500 }}
                >
                  <Trash2 size={14} /> Sil
                </button>
              </>
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
        /* ── Calendar View (custom week time-grid, drag-and-drop reschedule) ── */
        <WeekTimeGrid
          appointments={gridAppointments}
          weekStart={weekStart}
          onWeekStartChange={setWeekStart}
          isLocked={isApptLocked}
          onDropProposal={(id, newTime) => {
            const appt = appointments.find((a) => a.id === id)
            setProposeTarget({ id, newTime, lawyerName: appt?.lawyerFullName ?? '' })
          }}
        />
      )}

      <ProposeRescheduleModal
        open={!!proposeTarget}
        newTime={proposeTarget?.newTime ?? null}
        counterpartyName={proposeTarget?.lawyerName}
        onClose={() => setProposeTarget(null)}
        onConfirm={proposeReschedule}
      />

      <RespondRescheduleModal
        open={!!respondTarget}
        proposedTime={respondTarget ? new Date(respondTarget.proposedAt) : null}
        onClose={() => setRespondTarget(null)}
        onConfirm={rejectReschedule}
      />

      <AppointmentActionModal
        open={!!actionTarget}
        action={actionTarget?.action ?? 'cancel'}
        counterpartyName={actionTarget?.lawyerName}
        onClose={() => setActionTarget(null)}
        onConfirm={runAction}
      />

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

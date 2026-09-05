import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Calendar, List, CalendarDays, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'
import {
  getByLawyer,
  confirmAppointment,
  cancelAppointment,
  deleteAppointment,
  completeAppointment,
  proposeReschedule as proposeRescheduleApi,
  respondReschedule as respondRescheduleApi,
  type Appointment,
  type AppointmentStatus,
} from '../api/appointments'
import { getMyLawyerProfile } from '../api/profile'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { AppointmentSkeleton } from '../components/ui/Skeleton'
import { AppointmentActionModal, type AppointmentAction } from '../components/appointments/AppointmentActionModal'
import { ProposeRescheduleModal } from '../components/appointments/ProposeRescheduleModal'
import { RespondRescheduleModal } from '../components/appointments/RespondRescheduleModal'
import { RescheduleBadge } from '../components/appointments/RescheduleBadge'
import { WeekTimeGrid, type GridAppointment } from '../components/calendar/WeekTimeGrid'
import { startOfWeek } from '../lib/weekGrid'
import { useVerificationStatus } from '../hooks/useVerificationStatus'

type View = 'list' | 'calendar'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

const TABS: { label: string; value: AppointmentStatus | 'All' }[] = [
  { label: 'Hamısı', value: 'All' },
  { label: 'Gözləyir', value: 'Pending' },
  { label: 'Təsdiqləndi', value: 'Confirmed' },
  { label: 'Ləğv edildi', value: 'Cancelled' },
  { label: 'Tamamlandı', value: 'Completed' },
]

export default function Appointments() {
  const { user, lawyerId, setLawyerId } = useAuthStore()
  const { isRevoked } = useVerificationStatus()
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState<AppointmentStatus | 'All'>('All')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [view, setView] = useState<View>('list')
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()))
  const [actionTarget, setActionTarget] = useState<{
    id: string; action: AppointmentAction; clientName: string
  } | null>(null)
  const [proposeTarget, setProposeTarget] = useState<{ id: string; newTime: Date; clientName: string } | null>(null)
  const [respondTarget, setRespondTarget] = useState<{ id: string; proposedAt: string } | null>(null)
  const [respondBusy, setRespondBusy] = useState<string | null>(null)

  const { data: profile } = useQuery({
    queryKey: ['lawyer-profile', user?.userId],
    queryFn: getMyLawyerProfile,
    enabled: !!user && !lawyerId,
  })

  useEffect(() => {
    if (profile?.id && !lawyerId) { setLawyerId(profile.id) }
  }, [profile?.id, lawyerId, setLawyerId])

  const effectiveLawyerId = lawyerId ?? profile?.id

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['appointments', effectiveLawyerId],
    queryFn: () => getByLawyer(effectiveLawyerId!),
    enabled: !!effectiveLawyerId,
  })

  const filtered = activeTab === 'All' ? appointments : appointments.filter((a) => a.status === activeTab)

  const gridAppointments: GridAppointment[] = appointments
    .filter((a) => a.status !== 'Cancelled')
    .map((a) => ({
      id: a.id,
      scheduledAt: a.scheduledAt,
      durationMinutes: a.durationMinutes,
      status: a.status,
      title: a.clientFullName,
      rescheduleStatus: a.rescheduleStatus,
    }))

  const isApptLocked = (g: GridAppointment) =>
    isRevoked || g.status === 'Completed' || g.rescheduleStatus === 'Pending'

  const acceptReschedule = async (id: string) => {
    setRespondBusy(id)
    try {
      await respondRescheduleApi(id, true)
      toast.success('Perenos təsdiqləndi, görüş vaxtı yeniləndi')
      qc.invalidateQueries({ queryKey: ['appointments'] })
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Əməliyyat alınmadı')
    } finally {
      setRespondBusy(null)
    }
  }

  const rejectReschedule = async (reason: string | undefined) => {
    if (!respondTarget) return
    try {
      await respondRescheduleApi(respondTarget.id, false, reason)
      toast.success('Perenos təklifi rədd edildi')
      qc.invalidateQueries({ queryKey: ['appointments'] })
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Əməliyyat alınmadı')
      throw err
    }
  }

  const proposeReschedule = async (reason: string | undefined) => {
    if (!proposeTarget) return
    try {
      await proposeRescheduleApi(proposeTarget.id, proposeTarget.newTime.toISOString(), reason)
      toast.success('Perenos sorğusu göndərildi')
      qc.invalidateQueries({ queryKey: ['appointments'] })
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Əməliyyat alınmadı')
      throw err
    }
  }

  const handleConfirm = async (a: Appointment) => {
    if (!effectiveLawyerId) return
    setActionLoading(a.id + 'confirm')
    try { await confirmAppointment(a.id, effectiveLawyerId); toast.success('Görüş təsdiqləndi!'); qc.invalidateQueries({ queryKey: ['appointments'] }) }
    catch { toast.error('Görüşü təsdiqləmək alınmadı') } finally { setActionLoading(null) }
  }

  const runAction = async (reason: string | undefined) => {
    if (!actionTarget) return
    try {
      if (actionTarget.action === 'cancel') {
        await cancelAppointment(actionTarget.id, reason as string)
        toast.success('Görüş ləğv edildi')
      } else {
        await deleteAppointment(actionTarget.id, reason)
        toast.success('Görüş silindi')
      }
      qc.invalidateQueries({ queryKey: ['appointments'] })
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Əməliyyat alınmadı')
      throw err
    }
  }

  const handleComplete = async (a: Appointment) => {
    if (!effectiveLawyerId) return
    setActionLoading(a.id + 'complete')
    try { await completeAppointment(a.id, effectiveLawyerId); toast.success('Görüş tamamlandı!'); qc.invalidateQueries({ queryKey: ['appointments'] }) }
    catch { toast.error('Görüşü tamamlamaq alınmadı') } finally { setActionLoading(null) }
  }

  const tabCounts = TABS.reduce(
    (acc, tab) => {
      acc[tab.value] = tab.value === 'All' ? appointments.length : appointments.filter((a) => a.status === tab.value).length
      return acc
    },
    {} as Record<string, number>,
  )

  return (
    <div style={{ padding: 32, maxWidth: 1100 }}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)' }}>Görüşlər</h1>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>Bütün müştəri görüşlərini idarə edin</p>
          </div>
          <div style={{ display: 'flex', gap: 4, background: 'var(--surface)', padding: 4, borderRadius: 10 }}>
            {([['list', <List size={14} />, 'Siyahı'], ['calendar', <CalendarDays size={14} />, 'Təqvim']] as const).map(([v, icon, label]) => (
              <button key={v} onClick={() => setView(v as View)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 7, border: 'none', background: view === v ? 'var(--bg)' : 'transparent', color: view === v ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: view === v ? 600 : 500, fontSize: 13, cursor: 'pointer', boxShadow: view === v ? 'var(--shadow)' : 'none', fontFamily: 'Inter, sans-serif' }}
              >
                {icon}{label}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {view === 'list' ? (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
            style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--surface)', padding: 4, borderRadius: 12, width: 'fit-content' }}
          >
            {TABS.map((tab) => (
              <button key={tab.value} onClick={() => setActiveTab(tab.value)}
                style={{ padding: '7px 14px', borderRadius: 9, border: 'none', background: activeTab === tab.value ? 'var(--bg)' : 'transparent', color: activeTab === tab.value ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: activeTab === tab.value ? 600 : 500, fontSize: 13, cursor: 'pointer', boxShadow: activeTab === tab.value ? 'var(--shadow)' : 'none', transition: 'all 0.15s', whiteSpace: 'nowrap' }}
              >
                {tab.label}
                {tabCounts[tab.value] > 0 && (
                  <span style={{ marginLeft: 6, fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>{tabCounts[tab.value]}</span>
                )}
              </button>
            ))}
          </motion.div>

          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[1, 2, 3, 4].map((k) => <AppointmentSkeleton key={k} />)}
            </div>
          ) : filtered.length === 0 ? (
            <Card style={{ textAlign: 'center', padding: '60px 24px' }}>
              <Calendar size={36} color="var(--border)" style={{ margin: '0 auto 16px' }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, fontWeight: 500 }}>Görüş tapılmadı</p>
            </Card>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filtered.map((a, i) => (
                <motion.div key={a.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, duration: 0.3 }}>
                  <Card>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                      <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', flexShrink: 0 }}>
                        {a.clientFullName?.[0] ?? '?'}
                      </div>
                      <div style={{ flex: 1, minWidth: 180 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{a.clientFullName}</div>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{formatDate(a.scheduledAt)}</div>
                        {a.status === 'Cancelled' && a.cancellationReason && (
                          <div style={{ fontSize: 12, color: '#DC2626', marginTop: 4 }}>✕ Ləğv səbəbi: {a.cancellationReason}</div>
                        )}
                        {a.rescheduleStatus === 'Pending' && a.proposedScheduledAt && (
                          <div style={{ marginTop: 6 }}>
                            <RescheduleBadge
                              proposedScheduledAt={a.proposedScheduledAt}
                              isOwnProposal={a.proposedByUserId === user?.userId}
                              accepting={respondBusy === a.id}
                              onAccept={() => acceptReschedule(a.id)}
                              onReject={() => setRespondTarget({ id: a.id, proposedAt: a.proposedScheduledAt! })}
                            />
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 20, fontSize: 13, color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                        <span>
                          <span style={{ padding: '3px 10px', borderRadius: 100, fontSize: 12, fontWeight: 500, background: a.type === 'Online' ? '#EFF6FF' : '#F0FDF4', color: a.type === 'Online' ? '#1D4ED8' : '#15803D' }}>
                            {a.type}
                          </span>
                        </span>
                        <span>⏱ {a.durationMinutes} dəq</span>
                        <span>💰 ${a.price}</span>
                      </div>
                      <Badge status={a.status} />
                      {a.status === 'Pending' && !isRevoked && (
                        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                          <Button variant="success" size="sm" loading={actionLoading === a.id + 'confirm'} onClick={() => handleConfirm(a)}>Təsdiqlə</Button>
                          <Button variant="danger" size="sm" onClick={() => setActionTarget({ id: a.id, action: 'cancel', clientName: a.clientFullName })}>Ləğv et</Button>
                        </div>
                      )}
                      {a.status === 'Confirmed' && !isRevoked && (
                        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                          <button disabled={actionLoading === a.id + 'complete'} onClick={() => handleComplete(a)}
                            style={{ background: '#EBFBEE', color: '#2F9E44', border: '1px solid #B2F2BB', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 500, opacity: actionLoading === a.id + 'complete' ? 0.6 : 1 }}
                          >
                            Tamamla
                          </button>
                          <Button variant="danger" size="sm" onClick={() => setActionTarget({ id: a.id, action: 'cancel', clientName: a.clientFullName })}>Ləğv et</Button>
                          <Button variant="secondary" size="sm" onClick={() => setActionTarget({ id: a.id, action: 'delete', clientName: a.clientFullName })}><Trash2 size={13} /> Sil</Button>
                        </div>
                      )}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </>
      ) : (
        /* ── Calendar View (custom week time-grid, drag-and-drop reschedule) ── */
        <WeekTimeGrid
          appointments={gridAppointments}
          weekStart={weekStart}
          onWeekStartChange={setWeekStart}
          isLocked={isApptLocked}
          onDropProposal={(id, newTime) => {
            const appt = appointments.find((a) => a.id === id)
            setProposeTarget({ id, newTime, clientName: appt?.clientFullName ?? '' })
          }}
        />
      )}

      <ProposeRescheduleModal
        open={!!proposeTarget}
        newTime={proposeTarget?.newTime ?? null}
        counterpartyName={proposeTarget?.clientName}
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
        counterpartyName={actionTarget?.clientName}
        onClose={() => setActionTarget(null)}
        onConfirm={runAction}
      />
    </div>
  )
}

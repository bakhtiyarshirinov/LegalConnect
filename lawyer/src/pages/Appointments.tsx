import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Calendar, List, CalendarDays } from 'lucide-react'
import ReactCalendar from 'react-calendar'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'
import {
  getByLawyer,
  confirmAppointment,
  cancelAppointment,
  completeAppointment,
  type Appointment,
  type AppointmentStatus,
} from '../api/appointments'
import { getMyLawyerProfile } from '../api/profile'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { AppointmentSkeleton } from '../components/ui/Skeleton'

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

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function formatTime(d: string) {
  return new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
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
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState<AppointmentStatus | 'All'>('All')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [view, setView] = useState<View>('list')
  const [selectedCalDate, setSelectedCalDate] = useState<Date | null>(null)

  const { data: profile } = useQuery({
    queryKey: ['lawyer-profile'],
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

  const dateMap = appointments.reduce<Record<string, Appointment[]>>((acc, a) => {
    const key = toLocalKey(a.scheduledAt)
    if (!acc[key]) acc[key] = []
    acc[key].push(a)
    return acc
  }, {})

  const selectedDateStr = selectedCalDate ? selectedCalDate.toLocaleDateString('en-CA') : null
  const selectedDayAppts = selectedDateStr ? (dateMap[selectedDateStr] ?? []) : []

  const handleConfirm = async (a: Appointment) => {
    if (!effectiveLawyerId) return
    setActionLoading(a.id + 'confirm')
    try { await confirmAppointment(a.id, effectiveLawyerId); toast.success('Görüş təsdiqləndi!'); qc.invalidateQueries({ queryKey: ['appointments'] }) }
    catch { toast.error('Görüşü təsdiqləmək alınmadı') } finally { setActionLoading(null) }
  }

  const handleCancel = async (a: Appointment) => {
    if (!effectiveLawyerId) return
    if (!window.confirm('Görüşü ləğv etmək istədiyinizə əminsiniz?')) return
    setActionLoading(a.id + 'cancel')
    try { await cancelAppointment(a.id, effectiveLawyerId); toast.success('Görüş ləğv edildi'); qc.invalidateQueries({ queryKey: ['appointments'] }) }
    catch { toast.error('Görüşü ləğv etmək alınmadı') } finally { setActionLoading(null) }
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
                        {a.clientName?.[0] ?? '?'}
                      </div>
                      <div style={{ flex: 1, minWidth: 180 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{a.clientName}</div>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{formatDate(a.scheduledAt)}</div>
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
                      {a.status === 'Pending' && (
                        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                          <Button variant="success" size="sm" loading={actionLoading === a.id + 'confirm'} onClick={() => handleConfirm(a)}>Təsdiqlə</Button>
                          <Button variant="danger" size="sm" loading={actionLoading === a.id + 'cancel'} onClick={() => handleCancel(a)}>Ləğv et</Button>
                        </div>
                      )}
                      {a.status === 'Confirmed' && (
                        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                          <button disabled={actionLoading === a.id + 'complete'} onClick={() => handleComplete(a)}
                            style={{ background: '#EBFBEE', color: '#2F9E44', border: '1px solid #B2F2BB', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 500, opacity: actionLoading === a.id + 'complete' ? 0.6 : 1 }}
                          >
                            Tamamla
                          </button>
                          <Button variant="danger" size="sm" loading={actionLoading === a.id + 'cancel'} onClick={() => handleCancel(a)}>Ləğv et</Button>
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
              <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                {status}
              </div>
            ))}
          </div>

          {selectedCalDate && (
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>
                {selectedCalDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginLeft: 8 }}>
                  {selectedDayAppts.length} görüş
                </span>
              </h3>
              {selectedDayAppts.length === 0 ? (
                <Card style={{ textAlign: 'center', padding: 24, color: 'var(--text-secondary)', fontSize: 14 }}>Bu gündə görüş yoxdur</Card>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {selectedDayAppts.map((a) => (
                    <Card key={a.id} padding={18}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 14 }}>{a.clientName}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                            {formatTime(a.scheduledAt)} · {a.durationMinutes} dəq · {a.type}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>${a.price}</span>
                          <span style={{ background: (STATUS_DOT[a.status] ?? '#9CA3AF') + '22', color: STATUS_DOT[a.status] ?? '#9CA3AF', borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 700 }}>
                            {a.status}
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
    </div>
  )
}

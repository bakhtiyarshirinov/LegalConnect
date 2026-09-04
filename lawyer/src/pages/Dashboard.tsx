import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Calendar, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'
import { getByLawyer, confirmAppointment, cancelAppointment, deleteAppointment, completeAppointment, type Appointment } from '../api/appointments'
import { AppointmentActionModal, type AppointmentAction } from '../components/appointments/AppointmentActionModal'
import { ClientBadge } from '../components/appointments/ClientBadge'
import { getMyLawyerProfile } from '../api/profile'
import { useVerificationStatus } from '../hooks/useVerificationStatus'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { AppointmentSkeleton } from '../components/ui/Skeleton'
import { useState, useEffect } from 'react'

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.35 },
  }),
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export default function Dashboard() {
  const { user, lawyerId, setLawyerId } = useAuthStore()
  const { isRevoked } = useVerificationStatus()
  const qc = useQueryClient()
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [actionTarget, setActionTarget] = useState<{
    id: string; action: AppointmentAction; clientName: string
  } | null>(null)

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

  const pending = appointments.filter((a) => a.status === 'Pending')
  const confirmed = appointments.filter((a) => a.status === 'Confirmed')
  const lawyerProfile = profile

  const handleConfirm = async (a: Appointment) => {
    if (!effectiveLawyerId) return
    setActionLoading(a.id + 'confirm')
    try {
      await confirmAppointment(a.id, effectiveLawyerId)
      toast.success('Görüş təsdiqləndi!')
      qc.invalidateQueries({ queryKey: ['appointments'] })
    } catch { toast.error('Görüşü təsdiqləmək alınmadı') } finally { setActionLoading(null) }
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
    try {
      await completeAppointment(a.id, effectiveLawyerId)
      toast.success('Görüş tamamlandı!')
      qc.invalidateQueries({ queryKey: ['appointments'] })
    } catch { toast.error('Görüşü tamamlamaq alınmadı') } finally { setActionLoading(null) }
  }

  const stats = [
    { label: 'Cəmi', value: appointments.length },
    { label: 'Gözləyir', value: pending.length },
    { label: 'Təsdiqləndi', value: confirmed.length },
    { label: 'Reytinq', value: lawyerProfile?.rating?.toFixed(1) ?? '—' },
  ]

  return (
    <div style={{ padding: 32, maxWidth: 1100 }}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#0A0A0A' }}>
          Xoş gəldiniz, {user?.fullName?.split(' ')[0]} 👋
        </h1>
        <p style={{ fontSize: 14, color: '#6B6B6B', marginTop: 4 }}>Bugün təcrübənizlə nə baş verir.</p>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 36 }}>
        {stats.map((s, i) => (
          <motion.div key={s.label} custom={i} variants={fadeUp} initial="hidden" animate="visible"
            whileHover={{ y: -2, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
            style={{ background: '#FFFFFF', border: '1px solid #F0F0F0', borderTop: '3px solid #0A0A0A', borderRadius: 16, padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', cursor: 'default' }}
          >
            <div style={{ fontSize: 40, fontWeight: 700, color: '#0A0A0A', letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 8 }}>{s.value}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#6B6B6B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.35 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontSize: 17, fontWeight: 600, color: '#0A0A0A' }}>
            Gözləyən sorğular{' '}
            {pending.length > 0 && (
              <span style={{ fontSize: 12, fontWeight: 600, background: '#FEF9C3', color: '#854D0E', padding: '2px 8px', borderRadius: 100, marginLeft: 6 }}>
                {pending.length}
              </span>
            )}
          </h2>
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3].map((k) => <AppointmentSkeleton key={k} />)}
          </div>
        ) : pending.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: '40px 24px' }}>
            <Calendar size={32} color="#E8E8E8" style={{ margin: '0 auto 12px' }} />
            <p style={{ color: '#6B6B6B', fontSize: 14 }}>Gözləyən sorğu yoxdur</p>
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {pending.map((a, i) => (
              <motion.div key={a.id} custom={i} variants={fadeUp} initial="hidden" animate="visible">
                <Card>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <ClientBadge fullName={a.clientFullName} subtitle={formatDate(a.scheduledAt)} />
                        <Badge status={a.status} />
                      </div>
                      <div style={{ display: 'flex', gap: 20, fontSize: 12, color: '#6B6B6B', flexWrap: 'wrap' }}>
                        <span>📍 {a.type}</span>
                        <span>⏱ {a.durationMinutes} dəq</span>
                        <span>💰 ${a.price}</span>
                      </div>
                    </div>
                    {!isRevoked && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Button variant="success" size="sm" loading={actionLoading === a.id + 'confirm'} onClick={() => handleConfirm(a)}>Təsdiqlə</Button>
                      <Button variant="danger" size="sm" onClick={() => setActionTarget({ id: a.id, action: 'cancel', clientName: a.clientFullName })}>Ləğv et</Button>
                    </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {confirmed.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.35 }} style={{ marginTop: 32 }}>
          <h2 style={{ fontSize: 17, fontWeight: 600, color: '#0A0A0A', marginBottom: 16 }}>
            Təsdiqləndi
            <span style={{ fontSize: 12, fontWeight: 600, background: '#EBFBEE', color: '#2F9E44', padding: '2px 8px', borderRadius: 100, marginLeft: 6 }}>
              {confirmed.length}
            </span>
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {confirmed.map((a, i) => (
              <motion.div key={a.id} custom={i} variants={fadeUp} initial="hidden" animate="visible">
                <Card>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <ClientBadge fullName={a.clientFullName} subtitle={formatDate(a.scheduledAt)} />
                        <Badge status={a.status} />
                      </div>
                      <div style={{ display: 'flex', gap: 20, fontSize: 12, color: '#6B6B6B', flexWrap: 'wrap' }}>
                        <span>📍 {a.type}</span>
                        <span>⏱ {a.durationMinutes} dəq</span>
                        <span>💰 ${a.price}</span>
                      </div>
                    </div>
                    {!isRevoked && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        disabled={actionLoading === a.id + 'complete'}
                        onClick={() => handleComplete(a)}
                        style={{ background: '#EBFBEE', color: '#2F9E44', border: '1px solid #B2F2BB', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 500, fontFamily: 'Inter, sans-serif', opacity: actionLoading === a.id + 'complete' ? 0.6 : 1 }}
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
        </motion.div>
      )}

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

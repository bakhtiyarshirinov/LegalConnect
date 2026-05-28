import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Calendar } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'
import { getByLawyer, confirmAppointment, cancelAppointment, type Appointment } from '../api/appointments'
import { getMyLawyerProfile } from '../api/profile'
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
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function Dashboard() {
  const { user, lawyerId, setLawyerId } = useAuthStore()
  const qc = useQueryClient()
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // If lawyerId not set yet, fetch it
  const { data: profile } = useQuery({
    queryKey: ['lawyer-profile'],
    queryFn: getMyLawyerProfile,
    enabled: !!user && !lawyerId,
  })

  useEffect(() => {
    if (profile?.id && !lawyerId) {
      setLawyerId(profile.id)
    }
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
      toast.success('Appointment confirmed!')
      qc.invalidateQueries({ queryKey: ['appointments'] })
    } catch {
      toast.error('Failed to confirm appointment')
    } finally {
      setActionLoading(null)
    }
  }

  const handleCancel = async (a: Appointment) => {
    if (!effectiveLawyerId) return
    setActionLoading(a.id + 'cancel')
    try {
      await cancelAppointment(a.id, effectiveLawyerId)
      toast.success('Appointment cancelled')
      qc.invalidateQueries({ queryKey: ['appointments'] })
    } catch {
      toast.error('Failed to cancel appointment')
    } finally {
      setActionLoading(null)
    }
  }

  const stats = [
    { label: 'Total Appointments', value: appointments.length },
    { label: 'Pending', value: pending.length },
    { label: 'Confirmed', value: confirmed.length },
    { label: 'Rating', value: lawyerProfile?.rating?.toFixed(1) ?? '—' },
  ]

  return (
    <div style={{ padding: 32, maxWidth: 1100 }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 32 }}
      >
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#0A0A0A' }}>
          Welcome back, {user?.fullName?.split(' ')[0]} 👋
        </h1>
        <p style={{ fontSize: 14, color: '#6B6B6B', marginTop: 4 }}>
          Here's what's happening with your practice today.
        </p>
      </motion.div>

      {/* Stat cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
          marginBottom: 36,
        }}
      >
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            custom={i}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            whileHover={{ y: -2, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
            style={{
              background: '#FFFFFF',
              border: '1px solid #F0F0F0',
              borderTop: '3px solid #0A0A0A',
              borderRadius: 16,
              padding: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              cursor: 'default',
            }}
          >
            <div style={{ fontSize: 40, fontWeight: 700, color: '#0A0A0A', letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 8 }}>
              {s.value}
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#6B6B6B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {s.label}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Pending requests */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.35 }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}
        >
          <h2 style={{ fontSize: 17, fontWeight: 600, color: '#0A0A0A' }}>
            Pending Requests{' '}
            {pending.length > 0 && (
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  background: '#FEF9C3',
                  color: '#854D0E',
                  padding: '2px 8px',
                  borderRadius: 100,
                  marginLeft: 6,
                }}
              >
                {pending.length}
              </span>
            )}
          </h2>
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3].map((k) => (
              <AppointmentSkeleton key={k} />
            ))}
          </div>
        ) : pending.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: '40px 24px' }}>
            <Calendar size={32} color="#E8E8E8" style={{ margin: '0 auto 12px' }} />
            <p style={{ color: '#6B6B6B', fontSize: 14 }}>No pending appointments</p>
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {pending.map((a, i) => (
              <motion.div
                key={a.id}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
              >
                <Card>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 12,
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          marginBottom: 8,
                        }}
                      >
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            background: '#F5F5F5',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 14,
                            fontWeight: 600,
                            color: '#0A0A0A',
                            flexShrink: 0,
                          }}
                        >
                          {a.clientName?.[0] ?? '?'}
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: '#0A0A0A' }}>
                            {a.clientName}
                          </div>
                          <div style={{ fontSize: 12, color: '#6B6B6B' }}>
                            {formatDate(a.scheduledAt)}
                          </div>
                        </div>
                        <Badge status={a.status} />
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          gap: 20,
                          fontSize: 12,
                          color: '#6B6B6B',
                          flexWrap: 'wrap',
                        }}
                      >
                        <span>📍 {a.type}</span>
                        <span>⏱ {a.durationMinutes} min</span>
                        <span>💰 ${a.price}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Button
                        variant="success"
                        size="sm"
                        loading={actionLoading === a.id + 'confirm'}
                        onClick={() => handleConfirm(a)}
                      >
                        Confirm
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        loading={actionLoading === a.id + 'cancel'}
                        onClick={() => handleCancel(a)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}

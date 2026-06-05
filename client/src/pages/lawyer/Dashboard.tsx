import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Calendar, Star, CheckCircle, X, Clock, Video } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { lawyersApi } from '../../api/lawyers'
import { appointmentsApi } from '../../api/appointments'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { SkeletonCard } from '../../components/ui/Skeleton'

const stagger = { visible: { transition: { staggerChildren: 0.07 } } }
const item = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }

export default function LawyerDashboard() {
  const user = useAuthStore((s) => s.user)!
  const qc = useQueryClient()

  const { data: profile } = useQuery({
    queryKey: ['my-lawyer-profile', user.userId],
    queryFn: lawyersApi.getMyProfile,
  })

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['lawyer-appointments', profile?.id],
    queryFn: () => appointmentsApi.getByLawyer(profile!.id),
    enabled: !!profile?.id,
  })

  const { mutate: confirm } = useMutation({
    mutationFn: (id: string) => appointmentsApi.confirm(id, profile!.id),
    onSuccess: () => {
      toast.success('Appointment confirmed!')
      qc.invalidateQueries({ queryKey: ['lawyer-appointments'] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const { mutate: cancel } = useMutation({
    mutationFn: (id: string) => appointmentsApi.cancel(id, profile!.id),
    onSuccess: () => {
      toast.success('Appointment cancelled')
      qc.invalidateQueries({ queryKey: ['lawyer-appointments'] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const joinMeeting = async (appt: typeof appointments[0]) => {
    if (appt.meetingUrl) { window.open(appt.meetingUrl, '_blank'); return }
    try {
      const { meetingUrl } = await appointmentsApi.createMeeting(appt.id)
      window.open(meetingUrl, '_blank')
      qc.invalidateQueries({ queryKey: ['lawyer-appointments'] })
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create meeting')
    }
  }

  function isWithin24Hours(scheduledAt: string) {
    const diff = new Date(scheduledAt).getTime() - Date.now()
    return diff >= 0 && diff <= 24 * 60 * 60 * 1000
  }

  const pending = appointments.filter((a) => a.status === 'Pending')
  const confirmed = appointments.filter((a) => a.status === 'Confirmed')
  const past = appointments.filter((a) => a.status === 'Completed' || a.status === 'Cancelled')

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{ padding: '32px 28px', maxWidth: 900, minHeight: 'calc(100vh - 64px)' }}
    >
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#0A0A0A', letterSpacing: '-0.5px' }}>
          Welcome back, {user.fullName.split(' ')[0]}! ⚖️
        </h1>
        <p style={{ color: '#6B6B6B', marginTop: 4 }}>Manage your appointments and profile</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 32 }}>
        {[
          { label: 'Pending', value: pending.length, icon: <Clock size={18} /> },
          { label: 'Confirmed', value: confirmed.length, icon: <CheckCircle size={18} /> },
          { label: 'Total', value: appointments.length, icon: <Calendar size={18} /> },
          { label: 'Rating', value: profile?.rating.toFixed(1) ?? '—', icon: <Star size={18} color="#fbbf24" /> },
        ].map((s) => (
          <Card key={s.label} padding={18}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ color: '#6B6B6B' }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#0A0A0A' }}>{s.value}</div>
                <div style={{ fontSize: 11, color: '#6B6B6B' }}>{s.label}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Pending Appointments */}
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: '#0A0A0A', display: 'flex', alignItems: 'center', gap: 8 }}>
        Pending Requests
        {pending.length > 0 && (
          <span style={{ background: '#fff', color: '#000', borderRadius: 20, fontSize: 11, fontWeight: 700, padding: '1px 8px' }}>
            {pending.length}
          </span>
        )}
      </h2>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : pending.length === 0 ? (
        <Card padding={24} style={{ textAlign: 'center', marginBottom: 28 }}>
          <p style={{ color: '#6B6B6B', fontSize: 14 }}>No pending appointment requests</p>
        </Card>
      ) : (
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}
        >
          {pending.map((appt) => (
            <motion.div key={appt.id} variants={item}>
              <Card padding={20}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <div
                        style={{
                          width: 36, height: 36, background: '#E8E8E8', borderRadius: '50%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, color: '#0A0A0A', fontSize: 14, flexShrink: 0,
                        }}
                      >
                        {appt.clientFullName[0]}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 15, color: '#0A0A0A' }}>
                          {appt.clientFullName}
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 3 }}>
                          <Badge variant="warning">{appt.status}</Badge>
                          <Badge>{appt.type}</Badge>
                        </div>
                      </div>
                    </div>
                    <div style={{ color: '#6B6B6B', fontSize: 13, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span>📅 {new Date(appt.scheduledAt).toLocaleDateString('en-US', {
                        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
                      })} at {new Date(appt.scheduledAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                      <span>⏱ {appt.durationMinutes} min · ${appt.price}</span>
                      {appt.notes && <span style={{ fontStyle: 'italic' }}>"{appt.notes}"</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => confirm(appt.id)}
                    >
                      <CheckCircle size={13} /> Confirm
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => cancel(appt.id)}
                    >
                      <X size={13} /> Decline
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Confirmed Appointments */}
      {confirmed.length > 0 && (
        <>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: '#0A0A0A' }}>
            Confirmed Appointments
          </h2>
          <motion.div variants={stagger} initial="hidden" animate="visible" style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
            {confirmed.map((appt) => (
              <motion.div key={appt.id} variants={item}>
                <Card padding={18}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <Badge variant="success">{appt.status}</Badge>
                      <span style={{ fontWeight: 600 }}>{appt.clientFullName}</span>
                      <span style={{ color: '#6B6B6B', fontSize: 13 }}>
                        {new Date(appt.scheduledAt).toLocaleDateString()} · {appt.durationMinutes}min
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {isWithin24Hours(appt.scheduledAt) && (
                        <Button size="sm" onClick={() => joinMeeting(appt)} style={{ background: '#1C7ED6', color: '#fff', border: 'none' }}>
                          <Video size={13} /> Join
                        </Button>
                      )}
                      <Button variant="danger" size="sm" onClick={() => cancel(appt.id)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </>
      )}

      {/* Past */}
      {past.length > 0 && (
        <>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: '#0A0A0A' }}>History</h2>
          <motion.div variants={stagger} initial="hidden" animate="visible" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {past.slice(0, 5).map((appt) => (
              <motion.div key={appt.id} variants={item}>
                <Card padding={14} style={{ opacity: 0.6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Badge>{appt.status}</Badge>
                    <span style={{ fontWeight: 500, fontSize: 14 }}>{appt.clientFullName}</span>
                    <span style={{ color: '#6B6B6B', fontSize: 12, marginLeft: 'auto' }}>
                      {new Date(appt.scheduledAt).toLocaleDateString()}
                    </span>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </>
      )}
    </motion.div>
  )
}

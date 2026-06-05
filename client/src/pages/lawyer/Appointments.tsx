import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { CheckCircle, X, Video } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { lawyersApi } from '../../api/lawyers'
import { appointmentsApi } from '../../api/appointments'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { SkeletonCard } from '../../components/ui/Skeleton'

const stagger = { visible: { transition: { staggerChildren: 0.07 } } }
const item = { hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0 } }

export default function LawyerAppointments() {
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

  const statusOrder = ['Pending', 'Confirmed', 'Completed', 'Cancelled']
  const sorted = [...appointments].sort((a, b) => {
    const ai = statusOrder.indexOf(a.status)
    const bi = statusOrder.indexOf(b.status)
    if (ai !== bi) return ai - bi
    return new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{ padding: '32px 28px', maxWidth: 800 }}
    >
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#0A0A0A', letterSpacing: '-0.5px' }}>
          Appointments
        </h1>
        <p style={{ color: '#6B6B6B', marginTop: 4 }}>
          {appointments.length} total · {appointments.filter((a) => a.status === 'Pending').length} pending
        </p>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : sorted.length === 0 ? (
        <Card padding={40} style={{ textAlign: 'center' }}>
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
                        <div style={{ fontWeight: 600, color: '#0A0A0A', fontSize: 15 }}>{appt.clientFullName}</div>
                        <div style={{ display: 'flex', gap: 6, marginTop: 3 }}>
                          <Badge>{appt.status}</Badge>
                          <Badge>{appt.type}</Badge>
                        </div>
                      </div>
                    </div>
                    <div style={{ color: '#6B6B6B', fontSize: 13, paddingLeft: 46, display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <span>📅 {new Date(appt.scheduledAt).toLocaleDateString('en-US', {
                        weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
                      })} at {new Date(appt.scheduledAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                      <span>⏱ {appt.durationMinutes} minutes · ${appt.price}</span>
                      {appt.notes && <span style={{ fontStyle: 'italic', color: '#6B6B6B' }}>"{appt.notes}"</span>}
                    </div>
                  </div>

                  {appt.status === 'Pending' && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Button variant="primary" size="sm" onClick={() => confirm(appt.id)}>
                        <CheckCircle size={13} /> Confirm
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => cancel(appt.id)}>
                        <X size={13} /> Decline
                      </Button>
                    </div>
                  )}
                  {appt.status === 'Confirmed' && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      {isWithin24Hours(appt.scheduledAt) && (
                        <Button size="sm" onClick={() => joinMeeting(appt)} style={{ background: '#1C7ED6', color: '#fff', border: 'none' }}>
                          <Video size={13} /> Join Meeting
                        </Button>
                      )}
                      <Button variant="danger" size="sm" onClick={() => cancel(appt.id)}>
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  )
}

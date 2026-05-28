import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Calendar, Bell, CheckCircle, Clock, XCircle, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { appointmentsApi } from '../../api/appointments'
import { notificationsApi } from '../../api/notifications'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { SkeletonCard, Skeleton } from '../../components/ui/Skeleton'

const stagger = { visible: { transition: { staggerChildren: 0.07 } } }
const item = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }

const pageVariant = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
}

export default function ClientDashboard() {
  const user = useAuthStore((s) => s.user)!
  const qc = useQueryClient()

  const { data: appointments = [], isLoading: loadingAppts } = useQuery({
    queryKey: ['appointments', user.userId],
    queryFn: () => appointmentsApi.getByClient(user.userId),
  })

  const { data: notifications = [], isLoading: loadingNotifs } = useQuery({
    queryKey: ['notifications', user.userId],
    queryFn: () => notificationsApi.getAll(user.userId),
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) => appointmentsApi.cancel(id, user.userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments', user.userId] })
      toast.success('Appointment cancelled')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const upcoming = appointments
    .filter((a) => a.status === 'Pending' || a.status === 'Confirmed')
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    .slice(0, 3)

  const total = appointments.length
  const upcomingCount = appointments.filter((a) => a.status === 'Pending' || a.status === 'Confirmed').length
  const completed = appointments.filter((a) => a.status === 'Completed').length

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  const stats = [
    { label: 'Total Appointments', value: total },
    { label: 'Upcoming', value: upcomingCount },
    { label: 'Completed', value: completed },
  ]

  return (
    <motion.div
      initial="hidden" animate="visible" variants={pageVariant}
      style={{ padding: '32px 36px', background: '#F5F5F5', minHeight: 'calc(100vh - 64px)' }}
    >
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0A0A0A', letterSpacing: '-0.03em', marginBottom: 6 }}>
          Welcome back, {user.fullName.split(' ')[0]}! 👋
        </h1>
        <p style={{ color: '#6B6B6B', fontSize: 15 }}>Here's an overview of your legal activity.</p>
      </div>

      {/* Stats */}
      <motion.div
        initial="hidden" animate="visible" variants={stagger}
        style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}
      >
        {stats.map((s) => (
          <motion.div
            key={s.label}
            variants={item}
            whileHover={{ y: -2, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
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
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Upcoming Appointments */}
        <div style={{ background: '#FFFFFF', border: '1px solid #F0F0F0', borderRadius: 16, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0A0A0A', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Calendar size={16} /> Upcoming Appointments
            </h2>
            <Link to="/lawyers" style={{ fontSize: 13, color: '#6B6B6B', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
              Book new <ArrowRight size={12} />
            </Link>
          </div>
          {loadingAppts ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[1,2,3].map(i => <SkeletonCard key={i} />)}
            </div>
          ) : upcoming.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#A3A3A3' }}>
              <Calendar size={32} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
              <p style={{ fontSize: 14 }}>No upcoming appointments</p>
              <Link to="/lawyers">
                <Button size="sm" style={{ marginTop: 12 }}>Find a Lawyer</Button>
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {upcoming.map((a) => (
                <div key={a.id} style={{
                  padding: '16px', background: '#F5F5F5', borderRadius: 12,
                  border: '1px solid #F0F0F0',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: '#0A0A0A', marginBottom: 4 }}>{a.lawyerFullName}</div>
                      <div style={{ fontSize: 12, color: '#6B6B6B' }}>{formatDate(a.scheduledAt)}</div>
                    </div>
                    <Badge>{a.status}</Badge>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Badge variant="info">{a.type}</Badge>
                      <span style={{ fontSize: 12, color: '#6B6B6B' }}>{a.durationMinutes}min</span>
                    </div>
                    {(a.status === 'Pending' || a.status === 'Confirmed') && (
                      <button
                        onClick={() => cancelMutation.mutate(a.id)}
                        style={{
                          background: 'none', border: '1px solid #fecaca',
                          color: '#ef4444', fontSize: 12, fontWeight: 500,
                          padding: '4px 10px', borderRadius: 7, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: 4,
                          fontFamily: 'Inter, sans-serif',
                        }}
                      >
                        <XCircle size={12} /> Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Notifications */}
        <div style={{ background: '#FFFFFF', border: '1px solid #F0F0F0', borderRadius: 16, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0A0A0A', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Bell size={16} /> Recent Notifications
            </h2>
            <Link to="/notifications" style={{ fontSize: 13, color: '#6B6B6B', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {loadingNotifs ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[1,2,3,4,5].map(i => <Skeleton key={i} height={60} borderRadius={10} />)}
            </div>
          ) : notifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#A3A3A3' }}>
              <Bell size={32} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
              <p style={{ fontSize: 14 }}>No notifications yet</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {notifications.slice(0, 5).map((n) => (
                <div key={n.id} style={{
                  padding: '12px 14px', borderRadius: 10,
                  background: n.isRead ? '#FFFFFF' : '#F5F5F5',
                  border: `1px solid ${n.isRead ? '#E8E8E8' : '#E8E8E8'}`,
                  borderLeft: `3px solid ${n.isRead ? '#E8E8E8' : '#0A0A0A'}`,
                }}>
                  <div style={{ fontWeight: n.isRead ? 400 : 600, fontSize: 13, color: '#0A0A0A', marginBottom: 2 }}>{n.title}</div>
                  <div style={{ fontSize: 12, color: '#6B6B6B', lineHeight: 1.4 }}>{n.body}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

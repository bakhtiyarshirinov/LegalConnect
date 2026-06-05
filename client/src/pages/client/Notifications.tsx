import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Bell, Calendar, MessageSquare, CheckCheck, Info } from 'lucide-react'
import { notificationsApi } from '../../api/notifications'
import { useAuthStore } from '../../store/authStore'
import { Button } from '../../components/ui/Button'
import { Skeleton } from '../../components/ui/Skeleton'

const pageVariant = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } } }
const stagger = { visible: { transition: { staggerChildren: 0.05 } } }
const item = { hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }

function getIcon(type: string) {
  if (type?.toLowerCase().includes('appointment') || type?.toLowerCase().includes('booking')) return <Calendar size={16} color="#2563eb" />
  if (type?.toLowerCase().includes('message') || type?.toLowerCase().includes('chat')) return <MessageSquare size={16} color="#16a34a" />
  return <Info size={16} color="#d97706" />
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function Notifications() {
  const user = useAuthStore((s) => s.user)!
  const qc = useQueryClient()

  const { data: notifications = [], isLoading } = useQuery({ queryKey: ['notifications', user.userId], queryFn: () => notificationsApi.getAll(user.userId) })

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id, user.userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications', user.userId] }),
    onError: (err: Error) => toast.error(err.message),
  })

  const markAllMutation = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(user.userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications', user.userId] })
      qc.invalidateQueries({ queryKey: ['unread-count', user.userId] })
      toast.success('Bütün bildirişlər oxunmuş sayıldı')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const unreadCount = notifications.filter((n) => !n.isRead).length

  return (
    <motion.div initial="hidden" animate="visible" variants={pageVariant} style={{ padding: '32px 36px', background: '#F5F5F5', minHeight: 'calc(100vh - 64px)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0A0A0A', letterSpacing: '-0.03em', marginBottom: 6 }}>Bildirişlər</h1>
          <p style={{ color: '#6B6B6B', fontSize: 15 }}>{unreadCount > 0 ? `${unreadCount} oxunmamış` : 'Hamısı oxunub!'}</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="secondary" loading={markAllMutation.isPending} onClick={() => markAllMutation.mutate()}>
            <CheckCheck size={15} /> Hamısını oxunmuş say
          </Button>
        )}
      </div>

      <div style={{ background: '#FFFFFF', border: '1px solid #E8E8E8', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        {isLoading ? (
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} height={72} borderRadius={10} />)}
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 24px', color: '#A3A3A3' }}>
            <Bell size={40} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
            <h3 style={{ fontSize: 18, fontWeight: 600, color: '#6B6B6B', marginBottom: 8 }}>Bildiriş yoxdur</h3>
            <p style={{ fontSize: 14 }}>Görüşlər və mesajlar haqqında bildirişlər burada görünəcək.</p>
          </div>
        ) : (
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            {notifications.map((n, index) => (
              <motion.div
                key={n.id}
                variants={item}
                onClick={() => !n.isRead && markReadMutation.mutate(n.id)}
                style={{
                  padding: '18px 24px',
                  borderBottom: index < notifications.length - 1 ? '1px solid #E8E8E8' : 'none',
                  background: n.isRead ? '#FFFFFF' : '#F5F5F5',
                  borderLeft: `3px solid ${n.isRead ? 'transparent' : '#0A0A0A'}`,
                  cursor: n.isRead ? 'default' : 'pointer',
                  display: 'flex', gap: 14, alignItems: 'flex-start',
                }}
                onMouseEnter={(e) => { if (!n.isRead) (e.currentTarget as HTMLElement).style.background = '#EFEFEF' }}
                onMouseLeave={(e) => { if (!n.isRead) (e.currentTarget as HTMLElement).style.background = '#F5F5F5' }}
              >
                <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: n.isRead ? '#F5F5F5' : '#FFFFFF', border: '1px solid #E8E8E8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {getIcon(n.type)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: n.isRead ? 500 : 700, fontSize: 14, color: '#0A0A0A' }}>{n.title}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      {!n.isRead && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#0A0A0A' }} />}
                      <span style={{ fontSize: 12, color: '#A3A3A3', whiteSpace: 'nowrap' }}>{formatDate(n.createdAt)}</span>
                    </div>
                  </div>
                  <p style={{ fontSize: 13, color: '#6B6B6B', lineHeight: 1.5 }}>{n.body}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Calendar } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'
import {
  getByLawyer,
  confirmAppointment,
  cancelAppointment,
  type Appointment,
  type AppointmentStatus,
} from '../api/appointments'
import { getByUserId } from '../api/profile'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { AppointmentSkeleton } from '../components/ui/Skeleton'

const TABS: { label: string; value: AppointmentStatus | 'All' }[] = [
  { label: 'All', value: 'All' },
  { label: 'Pending', value: 'Pending' },
  { label: 'Confirmed', value: 'Confirmed' },
  { label: 'Cancelled', value: 'Cancelled' },
  { label: 'Completed', value: 'Completed' },
]

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function Appointments() {
  const { user, lawyerId, setLawyerId } = useAuthStore()
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState<AppointmentStatus | 'All'>('All')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const { data: profile } = useQuery({
    queryKey: ['lawyer-profile', user?.userId],
    queryFn: () => getByUserId(user!.userId),
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

  const filtered =
    activeTab === 'All' ? appointments : appointments.filter((a) => a.status === activeTab)

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
    if (!user) return
    setActionLoading(a.id + 'cancel')
    try {
      await cancelAppointment(a.id, user.userId)
      toast.success('Appointment cancelled')
      qc.invalidateQueries({ queryKey: ['appointments'] })
    } catch {
      toast.error('Failed to cancel appointment')
    } finally {
      setActionLoading(null)
    }
  }

  const tabCounts = TABS.reduce(
    (acc, tab) => {
      acc[tab.value] =
        tab.value === 'All'
          ? appointments.length
          : appointments.filter((a) => a.status === tab.value).length
      return acc
    },
    {} as Record<string, number>,
  )

  return (
    <div style={{ padding: 32, maxWidth: 1100 }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 28 }}
      >
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#0A0A0A' }}>Appointments</h1>
        <p style={{ fontSize: 14, color: '#6B6B6B', marginTop: 4 }}>
          Manage all your client appointments
        </p>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        style={{
          display: 'flex',
          gap: 4,
          marginBottom: 24,
          background: '#F5F5F5',
          padding: 4,
          borderRadius: 12,
          width: 'fit-content',
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            style={{
              padding: '7px 14px',
              borderRadius: 9,
              border: 'none',
              background: activeTab === tab.value ? '#FFFFFF' : 'transparent',
              color: activeTab === tab.value ? '#0A0A0A' : '#6B6B6B',
              fontWeight: activeTab === tab.value ? 600 : 500,
              fontSize: 13,
              cursor: 'pointer',
              boxShadow: activeTab === tab.value ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s',
              whiteSpace: 'nowrap',
            }}
          >
            {tab.label}
            {tabCounts[tab.value] > 0 && (
              <span
                style={{
                  marginLeft: 6,
                  fontSize: 11,
                  fontWeight: 600,
                  color: activeTab === tab.value ? '#6B6B6B' : '#6B6B6B',
                }}
              >
                {tabCounts[tab.value]}
              </span>
            )}
          </button>
        ))}
      </motion.div>

      {/* List */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3, 4].map((k) => (
            <AppointmentSkeleton key={k} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '60px 24px' }}>
          <Calendar size={36} color="#E8E8E8" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: '#6B6B6B', fontSize: 14, fontWeight: 500 }}>
            No {activeTab === 'All' ? '' : activeTab.toLowerCase()} appointments found
          </p>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((a, i) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
            >
              <Card>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    flexWrap: 'wrap',
                  }}
                >
                  {/* Avatar */}
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: '50%',
                      background: '#F5F5F5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 16,
                      fontWeight: 700,
                      color: '#0A0A0A',
                      flexShrink: 0,
                    }}
                  >
                    {a.clientName?.[0] ?? '?'}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: '#0A0A0A',
                        marginBottom: 4,
                      }}
                    >
                      {a.clientName}
                    </div>
                    <div style={{ fontSize: 13, color: '#6B6B6B' }}>{formatDate(a.scheduledAt)}</div>
                  </div>

                  {/* Details */}
                  <div
                    style={{
                      display: 'flex',
                      gap: 20,
                      fontSize: 13,
                      color: '#6B6B6B',
                      flexWrap: 'wrap',
                    }}
                  >
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <span
                        style={{
                          padding: '3px 10px',
                          borderRadius: 100,
                          fontSize: 12,
                          fontWeight: 500,
                          background: a.type === 'Online' ? '#EFF6FF' : '#F0FDF4',
                          color: a.type === 'Online' ? '#1D4ED8' : '#15803D',
                        }}
                      >
                        {a.type}
                      </span>
                    </span>
                    <span>⏱ {a.durationMinutes} min</span>
                    <span>💰 ${a.price}</span>
                  </div>

                  {/* Badge */}
                  <Badge status={a.status} />

                  {/* Actions */}
                  {a.status === 'Pending' && (
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
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
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

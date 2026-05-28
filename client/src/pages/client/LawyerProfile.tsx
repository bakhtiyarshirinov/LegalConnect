import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  MapPin, Star, Briefcase, BadgeCheck, ArrowLeft, MessageSquare,
  Calendar, Clock, DollarSign, FileText
} from 'lucide-react'
import { lawyersApi } from '../../api/lawyers'
import { reviewsApi } from '../../api/reviews'
import { appointmentsApi } from '../../api/appointments'
import { chatsApi } from '../../api/chats'
import { useAuthStore } from '../../store/authStore'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Skeleton } from '../../components/ui/Skeleton'

const pageVariant = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
}

export default function LawyerProfile() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const qc = useQueryClient()
  const [bookOpen, setBookOpen] = useState(false)
  const [form, setForm] = useState({
    date: '', time: '', duration: 60, type: 1, notes: '',
  })

  const { data: lawyer, isLoading } = useQuery({
    queryKey: ['lawyer', id],
    queryFn: () => lawyersApi.getById(id!),
    enabled: !!id,
  })

  const { data: reviews = [] } = useQuery({
    queryKey: ['reviews', id],
    queryFn: () => reviewsApi.getByLawyer(id!),
    enabled: !!id,
  })

  const bookMutation = useMutation({
    mutationFn: () => {
      if (!user || !lawyer) throw new Error('Not authenticated')
      const scheduledAt = new Date(`${form.date}T${form.time}`).toISOString()
      return appointmentsApi.create({
        clientId: user.userId,
        lawyerId: lawyer.id,
        scheduledAt,
        durationMinutes: form.duration,
        type: form.type,
        notes: form.notes || undefined,
      })
    },
    onSuccess: () => {
      toast.success('Appointment booked!')
      qc.invalidateQueries({ queryKey: ['appointments', user?.userId] })
      setBookOpen(false)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const chatMutation = useMutation({
    mutationFn: () => {
      if (!user || !lawyer) throw new Error('Not authenticated')
      return chatsApi.create(user.userId, lawyer.id)
    },
    onSuccess: (data) => {
      navigate('/chat', { state: { chatId: data.chatId } })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const price = lawyer ? (lawyer.hourlyRate * form.duration) / 60 : 0

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })

  if (isLoading) {
    return (
      <div style={{ padding: '32px 36px', background: '#F5F5F5', minHeight: 'calc(100vh - 64px)' }}>
        <Skeleton height={200} borderRadius={16} style={{ marginBottom: 24 }} />
        <Skeleton height={120} borderRadius={16} style={{ marginBottom: 16 }} />
        <Skeleton height={80} borderRadius={16} />
      </div>
    )
  }

  if (!lawyer) return null

  return (
    <motion.div
      initial="hidden" animate="visible" variants={pageVariant}
      style={{ padding: '32px 36px', background: '#F5F5F5', minHeight: 'calc(100vh - 64px)' }}
    >
      <button
        onClick={() => navigate('/lawyers')}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#6B6B6B', fontSize: 14, fontWeight: 500, marginBottom: 24,
          fontFamily: 'Inter, sans-serif', padding: 0,
        }}
      >
        <ArrowLeft size={16} /> Back to lawyers
      </button>

      {/* Header */}
      <div style={{
        background: '#FFFFFF', border: '1px solid #E8E8E8', borderRadius: 20,
        padding: '32px', marginBottom: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20 }}>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            <div style={{
              width: 72, height: 72, background: '#0A0A0A', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, fontWeight: 800, color: '#fff', flexShrink: 0,
            }}>
              {lawyer.fullName[0]}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0A0A0A', letterSpacing: '-0.02em' }}>{lawyer.fullName}</h1>
                {lawyer.isVerified && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe',
                    borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600,
                  }}>
                    <BadgeCheck size={12} /> Verified
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#6B6B6B', fontSize: 13 }}>
                  <MapPin size={13} /> {lawyer.city}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13 }}>
                  <Star size={13} color="#f59e0b" fill="#f59e0b" />
                  <strong style={{ color: '#0A0A0A' }}>{lawyer.rating.toFixed(1)}</strong>
                  <span style={{ color: '#6B6B6B' }}>({reviews.length} reviews)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#6B6B6B', fontSize: 13 }}>
                  <Briefcase size={13} /> {lawyer.experienceYears} years experience
                </div>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
            <Button variant="secondary" onClick={() => chatMutation.mutate()} loading={chatMutation.isPending}>
              <MessageSquare size={15} /> Message
            </Button>
            <Button onClick={() => setBookOpen(true)}>
              <Calendar size={15} /> Book Appointment
            </Button>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Bio */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E8E8E8', borderRadius: 16, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0A0A0A', marginBottom: 12 }}>About</h2>
            <p style={{ color: '#6B6B6B', fontSize: 14, lineHeight: 1.7 }}>{lawyer.bio}</p>
          </div>

          {/* Reviews */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E8E8E8', borderRadius: 16, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0A0A0A', marginBottom: 16 }}>
              Reviews ({reviews.length})
            </h2>
            {reviews.length === 0 ? (
              <p style={{ color: '#A3A3A3', fontSize: 14 }}>No reviews yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {reviews.map((r) => (
                  <div key={r.id} style={{
                    padding: 16, background: '#F5F5F5', borderRadius: 12, border: '1px solid #E8E8E8',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontWeight: 600, fontSize: 14, color: '#0A0A0A' }}>{r.clientFullName}</span>
                      <div style={{ display: 'flex', gap: 2 }}>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} size={12} color="#f59e0b" fill={i < r.rating ? '#f59e0b' : 'none'} />
                        ))}
                      </div>
                    </div>
                    {r.comment && <p style={{ fontSize: 13, color: '#6B6B6B', lineHeight: 1.5 }}>{r.comment}</p>}
                    <div style={{ fontSize: 11, color: '#A3A3A3', marginTop: 8 }}>{formatDate(r.createdAt)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Rate */}
          <div style={{
            background: '#0A0A0A', border: '1px solid #0A0A0A', borderRadius: 16, padding: 24, color: '#fff',
          }}>
            <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 4 }}>
              ${lawyer.hourlyRate}
            </div>
            <div style={{ color: '#A3A3A3', fontSize: 14, marginBottom: 20 }}>per hour</div>
            <Button fullWidth style={{ background: '#FFFFFF', color: '#0A0A0A' }} onClick={() => setBookOpen(true)}>
              Book Now
            </Button>
          </div>

          {/* Specializations */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E8E8E8', borderRadius: 16, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0A0A0A', marginBottom: 12 }}>Specializations</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {lawyer.specializations.map((s) => (
                <Badge key={s} variant="info">{s}</Badge>
              ))}
            </div>
          </div>

          {/* Availability */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E8E8E8', borderRadius: 16, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0A0A0A', marginBottom: 12 }}>Details</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: '#6B6B6B' }}>Experience</span>
                <span style={{ fontWeight: 600, color: '#0A0A0A' }}>{lawyer.experienceYears} years</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: '#6B6B6B' }}>Rating</span>
                <span style={{ fontWeight: 600, color: '#0A0A0A' }}>{lawyer.rating.toFixed(1)} ⭐</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: '#6B6B6B' }}>Availability</span>
                <Badge variant={lawyer.isAvailable ? 'success' : 'error'}>
                  {lawyer.isAvailable ? 'Available' : 'Unavailable'}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      <Modal open={bookOpen} onClose={() => setBookOpen(false)} title="Book Appointment" width={520}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#0A0A0A', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Calendar size={13} /> Date
              </label>
              <input
                type="date"
                value={form.date}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                style={{
                  border: '1px solid #E8E8E8', borderRadius: 10, padding: '10px 14px',
                  fontSize: 14, outline: 'none', fontFamily: 'Inter, sans-serif',
                  background: '#FFFFFF', color: '#0A0A0A',
                }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#0A0A0A', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={13} /> Time
              </label>
              <input
                type="time"
                value={form.time}
                onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                style={{
                  border: '1px solid #E8E8E8', borderRadius: 10, padding: '10px 14px',
                  fontSize: 14, outline: 'none', fontFamily: 'Inter, sans-serif',
                  background: '#FFFFFF', color: '#0A0A0A',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#0A0A0A' }}>Duration</label>
              <select
                value={form.duration}
                onChange={(e) => setForm((f) => ({ ...f, duration: parseInt(e.target.value) }))}
                style={{
                  border: '1px solid #E8E8E8', borderRadius: 10, padding: '11px 14px',
                  fontSize: 14, cursor: 'pointer', outline: 'none',
                  fontFamily: 'Inter, sans-serif', background: '#FFFFFF', color: '#0A0A0A',
                }}
              >
                <option value={30}>30 minutes</option>
                <option value={60}>60 minutes</option>
                <option value={90}>90 minutes</option>
                <option value={120}>120 minutes</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#0A0A0A' }}>Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: parseInt(e.target.value) }))}
                style={{
                  border: '1px solid #E8E8E8', borderRadius: 10, padding: '11px 14px',
                  fontSize: 14, cursor: 'pointer', outline: 'none',
                  fontFamily: 'Inter, sans-serif', background: '#FFFFFF', color: '#0A0A0A',
                }}
              >
                <option value={1}>Online</option>
                <option value={2}>Offline</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: '#0A0A0A', display: 'flex', alignItems: 'center', gap: 6 }}>
              <FileText size={13} /> Notes (optional)
            </label>
            <textarea
              placeholder="Describe your legal issue..."
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={3}
              style={{
                border: '1px solid #E8E8E8', borderRadius: 10, padding: '11px 14px',
                fontSize: 14, outline: 'none', resize: 'vertical',
                fontFamily: 'Inter, sans-serif', background: '#FFFFFF', color: '#0A0A0A',
              }}
            />
          </div>

          {/* Price summary */}
          <div style={{
            background: '#F5F5F5', border: '1px solid #E8E8E8', borderRadius: 12,
            padding: '16px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6B6B6B', fontSize: 14 }}>
              <DollarSign size={15} /> Total price
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#0A0A0A' }}>
              ${price.toFixed(2)}
            </div>
          </div>

          <Button
            fullWidth size="lg"
            loading={bookMutation.isPending}
            disabled={!form.date || !form.time}
            onClick={() => bookMutation.mutate()}
          >
            Confirm Booking
          </Button>
        </div>
      </Modal>
    </motion.div>
  )
}

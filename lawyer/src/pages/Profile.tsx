import { useState, useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  User, Briefcase, MapPin, DollarSign, Clock, ToggleLeft, ToggleRight,
  Users, Calendar, CheckCircle, Star, Camera, BarChart2, History,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'
import {
  getMyLawyerProfile, updateProfile, getLawyerStats, updateSpecializations,
  uploadAvatar, type UpdateProfileData,
} from '../api/profile'
import { getAllSpecializations } from '../api/specializations'
import { getByLawyer, type Appointment } from '../api/appointments'
import { Card } from '../components/ui/Card'
import { Input, Textarea } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Skeleton } from '../components/ui/Skeleton'

type Tab = 'profile' | 'statistics' | 'history'
type HistoryFilter = 'All' | 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled'

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  Pending:   { bg: '#FFF7ED', color: '#C2410C' },
  Confirmed: { bg: '#EFF6FF', color: '#1D4ED8' },
  Completed: { bg: '#F0FDF4', color: '#15803D' },
  Cancelled: { bg: '#FEF2F2', color: '#B91C1C' },
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatCurrency(n: number) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={14}
          fill={i <= Math.round(rating) ? '#FBBF24' : 'none'}
          color={i <= Math.round(rating) ? '#FBBF24' : '#D1D5DB'}
        />
      ))}
    </div>
  )
}

export default function Profile() {
  const { user, lawyerId } = useAuthStore()
  const qc = useQueryClient()
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const [activeTab, setActiveTab] = useState<Tab>('profile')
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>('All')
  const [selectedSpecIds, setSelectedSpecIds] = useState<number[]>([])

  const [form, setForm] = useState<UpdateProfileData>({
    bio: '',
    city: '',
    hourlyRate: 0,
    experienceYears: 0,
    isAvailable: true,
  })

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile-page', user?.userId],
    queryFn: getMyLawyerProfile,
    enabled: !!user,
  })

  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['lawyer-stats', lawyerId],
    queryFn: () => getLawyerStats(lawyerId!),
    enabled: !!lawyerId && activeTab === 'statistics',
  })

  const { data: history = [], isLoading: loadingHistory } = useQuery({
    queryKey: ['lawyer-history', lawyerId],
    queryFn: () => getByLawyer(lawyerId!),
    enabled: !!lawyerId && activeTab === 'history',
  })

  const { data: allSpecs = [] } = useQuery({
    queryKey: ['specializations'],
    queryFn: getAllSpecializations,
  })

  useEffect(() => {
    if (profile) {
      setForm({
        bio: profile.bio ?? '',
        city: profile.city ?? '',
        hourlyRate: profile.hourlyRate,
        experienceYears: profile.experienceYears,
        isAvailable: profile.isAvailable,
      })
      setSelectedSpecIds(profile.specializationIds ?? [])
    }
  }, [profile])

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingAvatar(true)
    try {
      await uploadAvatar(file)
      toast.success('Photo updated!')
      qc.invalidateQueries({ queryKey: ['profile-page'] })
    } catch {
      toast.error('Failed to upload photo')
    } finally {
      setUploadingAvatar(false)
      if (avatarInputRef.current) avatarInputRef.current.value = ''
    }
  }

  const toggleSpec = (id: number) => {
    setSelectedSpecIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateProfile(form)
      await updateSpecializations(selectedSpecIds)
      toast.success('Profile updated!')
      qc.invalidateQueries({ queryKey: ['profile-page'] })
    } catch {
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const filteredHistory: Appointment[] =
    historyFilter === 'All'
      ? history
      : history.filter((a) => a.status === historyFilter)

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'profile', label: 'Profile', icon: <User size={14} /> },
    { key: 'statistics', label: 'Statistics', icon: <BarChart2 size={14} /> },
    { key: 'history', label: 'History', icon: <History size={14} /> },
  ]

  const fieldSkeleton = <Skeleton height={42} borderRadius={10} />

  const avatarUrl = profile?.avatarUrl
  const initials = (profile?.fullName ?? user?.fullName ?? '?')[0]?.toUpperCase()

  return (
    <div style={{ padding: 32, maxWidth: 860 }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#0A0A0A' }}>Profile</h1>
        <p style={{ fontSize: 14, color: '#6B6B6B', marginTop: 4 }}>
          Manage your profile, statistics and appointment history
        </p>
      </motion.div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid #F0F0F0', paddingBottom: 0 }}>
        {tabs.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', background: 'none', border: 'none',
              cursor: 'pointer', fontSize: 13, fontWeight: 600,
              color: activeTab === key ? '#0A0A0A' : '#6B6B6B',
              borderBottom: activeTab === key ? '2px solid #0A0A0A' : '2px solid transparent',
              marginBottom: -1, transition: 'all 0.15s',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            {icon}{label}
          </button>
        ))}
      </div>

      {/* ── PROFILE TAB ── */}
      {activeTab === 'profile' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Avatar + Personal Info */}
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
              {/* Avatar */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleAvatarChange}
                />
                <div
                  style={{ position: 'relative', width: 80, height: 80, borderRadius: '50%', cursor: 'pointer', overflow: 'hidden' }}
                  onClick={() => !uploadingAvatar && avatarInputRef.current?.click()}
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: '#0A0A0A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800, color: '#fff' }}>
                      {uploadingAvatar ? '...' : initials}
                    </div>
                  )}
                  {/* Hover overlay */}
                  <div style={{
                    position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', gap: 2, opacity: uploadingAvatar ? 1 : 0,
                    transition: 'opacity 0.2s', borderRadius: '50%',
                  }}
                    className="avatar-overlay"
                    onMouseEnter={(e) => { if (!uploadingAvatar) (e.currentTarget as HTMLElement).style.opacity = '1' }}
                    onMouseLeave={(e) => { if (!uploadingAvatar) (e.currentTarget as HTMLElement).style.opacity = '0' }}
                  >
                    <Camera size={18} color="#fff" />
                    <span style={{ fontSize: 10, color: '#fff', fontWeight: 600 }}>Change</span>
                  </div>
                </div>
              </div>

              {/* Personal info */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, flex: 1 }}>
                {[
                  { label: 'Full Name', value: profile?.fullName },
                  { label: 'Email', value: profile?.email },
                  { label: 'Phone', value: profile?.phone || '—' },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div style={{ fontSize: 11, color: '#6B6B6B', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
                    {isLoading ? <Skeleton height={18} width="80%" /> : (
                      <div style={{ fontSize: 14, fontWeight: 500, color: '#0A0A0A' }}>{value}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Lawyer Profile (editable) */}
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#F5F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Briefcase size={16} color="#6B6B6B" />
              </div>
              <h2 style={{ fontSize: 15, fontWeight: 600, color: '#0A0A0A' }}>Lawyer Profile</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Bio */}
              <div>
                {isLoading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <Skeleton height={14} width={40} />
                    <Skeleton height={90} />
                  </div>
                ) : (
                  <Textarea
                    label="Bio"
                    placeholder="Tell clients about yourself and your expertise..."
                    value={form.bio}
                    onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                    rows={4}
                  />
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                <div>
                  {isLoading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <Skeleton height={14} width={30} />
                      {fieldSkeleton}
                    </div>
                  ) : (
                    <Input label="City" placeholder="e.g. New York" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
                  )}
                </div>
                <div>
                  {isLoading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <Skeleton height={14} width={70} />
                      {fieldSkeleton}
                    </div>
                  ) : (
                    <Input label="Hourly Rate ($)" type="number" placeholder="100" value={form.hourlyRate} onChange={(e) => setForm((f) => ({ ...f, hourlyRate: parseFloat(e.target.value) || 0 }))} />
                  )}
                </div>
                <div>
                  {isLoading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <Skeleton height={14} width={110} />
                      {fieldSkeleton}
                    </div>
                  ) : (
                    <Input label="Years of Experience" type="number" placeholder="5" value={form.experienceYears} onChange={(e) => setForm((f) => ({ ...f, experienceYears: parseInt(e.target.value) || 0 }))} />
                  )}
                </div>
              </div>

              {/* Stats row */}
              {!isLoading && profile && (
                <div style={{ display: 'flex', gap: 20, padding: '16px 0', borderTop: '1px solid #F0F0F0', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <DollarSign size={14} color="#6B6B6B" />
                    <span style={{ fontSize: 13, color: '#6B6B6B' }}>Rate: <strong style={{ color: '#0A0A0A' }}>${form.hourlyRate}/hr</strong></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Clock size={14} color="#6B6B6B" />
                    <span style={{ fontSize: 13, color: '#6B6B6B' }}>Experience: <strong style={{ color: '#0A0A0A' }}>{form.experienceYears} yrs</strong></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <MapPin size={14} color="#6B6B6B" />
                    <span style={{ fontSize: 13, color: '#6B6B6B' }}>City: <strong style={{ color: '#0A0A0A' }}>{form.city || '—'}</strong></span>
                  </div>
                </div>
              )}

              {/* Specializations */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0A0A0A', marginBottom: 10 }}>Specializations</div>
                {allSpecs.length === 0 ? (
                  <Skeleton height={36} borderRadius={20} width={200} />
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {allSpecs.map((spec) => {
                      const selected = selectedSpecIds.includes(spec.id)
                      return (
                        <button
                          key={spec.id}
                          onClick={() => toggleSpec(spec.id)}
                          style={{
                            padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 500,
                            cursor: 'pointer', border: '1px solid',
                            background: selected ? '#0A0A0A' : '#F5F5F5',
                            color: selected ? '#fff' : '#0A0A0A',
                            borderColor: selected ? '#0A0A0A' : '#E8E8E8',
                            transition: 'all 0.15s',
                            fontFamily: 'Inter, sans-serif',
                          }}
                        >
                          {spec.name}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Availability toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: '#F5F5F5', borderRadius: 10 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#0A0A0A' }}>Available for bookings</div>
                  <div style={{ fontSize: 12, color: '#6B6B6B', marginTop: 2 }}>Toggle to show or hide your profile from clients</div>
                </div>
                <button
                  onClick={() => setForm((f) => ({ ...f, isAvailable: !f.isAvailable }))}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: form.isAvailable ? '#16A34A' : '#6B6B6B' }}
                >
                  {form.isAvailable ? <ToggleRight size={36} strokeWidth={1.5} /> : <ToggleLeft size={36} strokeWidth={1.5} />}
                </button>
              </div>

              {/* Save */}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="primary" size="md" loading={saving} onClick={handleSave}>
                  Save Changes
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* ── STATISTICS TAB ── */}
      {activeTab === 'statistics' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          {loadingStats ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} height={110} borderRadius={12} />)}
            </div>
          ) : stats ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              {[
                { label: 'Total Clients', value: stats.totalClients, icon: <Users size={20} />, color: '#6366F1' },
                { label: 'Total Appointments', value: stats.totalAppointments, icon: <Calendar size={20} />, color: '#0EA5E9' },
                { label: 'Completed', value: stats.completedAppointments, icon: <CheckCircle size={20} />, color: '#16A34A' },
                { label: 'Hours Worked', value: stats.totalHoursWorked, icon: <Clock size={20} />, color: '#F59E0B' },
                { label: 'Total Earned', value: formatCurrency(stats.totalEarned), icon: <DollarSign size={20} />, color: '#10B981', raw: true },
                { label: 'Average Rating', value: stats.averageRating.toFixed(1), icon: <Star size={20} />, color: '#FBBF24', extra: <StarRating rating={stats.averageRating} />, raw: true },
              ].map(({ label, value, icon, color, extra, raw }) => (
                <Card key={label} padding={24}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
                      {icon}
                    </div>
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#0A0A0A', letterSpacing: '-0.03em', lineHeight: 1 }}>
                    {raw ? value : value}
                  </div>
                  <div style={{ fontSize: 12, color: '#6B6B6B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 6 }}>{label}</div>
                  {extra && <div style={{ marginTop: 6 }}>{extra}</div>}
                </Card>
              ))}
            </div>
          ) : (
            <Card padding={40} style={{ textAlign: 'center' }}>
              <p style={{ color: '#6B6B6B', fontSize: 14 }}>No stats available yet</p>
            </Card>
          )}
        </motion.div>
      )}

      {/* ── HISTORY TAB ── */}
      {activeTab === 'history' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          {/* Filter */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {(['All', 'Pending', 'Confirmed', 'Completed', 'Cancelled'] as HistoryFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setHistoryFilter(f)}
                style={{
                  padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                  cursor: 'pointer', border: '1px solid',
                  background: historyFilter === f ? '#0A0A0A' : '#F5F5F5',
                  color: historyFilter === f ? '#fff' : '#6B6B6B',
                  borderColor: historyFilter === f ? '#0A0A0A' : '#E8E8E8',
                  transition: 'all 0.15s', fontFamily: 'Inter, sans-serif',
                }}
              >
                {f}
              </button>
            ))}
          </div>

          <Card padding={0}>
            {loadingHistory ? (
              <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={52} borderRadius={8} />)}
              </div>
            ) : filteredHistory.length === 0 ? (
              <div style={{ padding: 48, textAlign: 'center', color: '#6B6B6B', fontSize: 14 }}>
                No appointments {historyFilter !== 'All' ? `with status "${historyFilter}"` : ''}
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #F0F0F0' }}>
                    {['Client', 'Date', 'Duration', 'Type', 'Status', 'Price'].map((h) => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#6B6B6B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.map((a) => {
                    const sc = STATUS_COLORS[a.status] ?? { bg: '#F5F5F5', color: '#6B6B6B' }
                    return (
                      <tr key={a.id} style={{ borderBottom: '1px solid #F9F9F9', transition: 'background 0.1s' }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#FAFAFA' }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                      >
                        <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: '#0A0A0A' }}>
                          {(a as any).clientFullName ?? (a as any).clientName ?? '—'}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 13, color: '#6B6B6B' }}>{formatDate(a.scheduledAt)}</td>
                        <td style={{ padding: '12px 16px', fontSize: 13, color: '#6B6B6B' }}>{a.durationMinutes} min</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ background: '#F5F5F5', color: '#6B6B6B', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>
                            {a.type}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ background: sc.bg, color: sc.color, borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 700 }}>
                            {a.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: '#0A0A0A' }}>
                          ${a.price.toLocaleString()}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </Card>
        </motion.div>
      )}
    </div>
  )
}

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { User, BadgeCheck, Calendar, CheckCircle, Clock, Camera } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { usersApi } from '../../api/users'
import { appointmentsApi } from '../../api/appointments'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Skeleton } from '../../components/ui/Skeleton'
import { Badge } from '../../components/ui/Badge'

const pageVariant = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function formatShort(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function ClientProfile() {
  const user = useAuthStore((s) => s.user)!
  const updateUser = useAuthStore((s) => s.updateUser)
  const qc = useQueryClient()
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ['myProfile', user.userId],
    queryFn: usersApi.getMe,
  })

  const { data: appointments = [] } = useQuery({
    queryKey: ['appointments', user.userId],
    queryFn: () => appointmentsApi.getByClient(user.userId),
  })

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName)
      setPhone(profile.phone ?? '')
    }
  }, [profile])

  const saveMutation = useMutation({
    mutationFn: () => usersApi.updateMe({ fullName: fullName.trim(), phone: phone.trim() || undefined }),
    onSuccess: () => {
      toast.success('Profil yeniləndi!')
      updateUser({ fullName: fullName.trim() })
      qc.invalidateQueries({ queryKey: ['myProfile', user.userId] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingAvatar(true)
    try {
      await usersApi.uploadAvatar(file)
      toast.success('Şəkil yeniləndi!')
      qc.invalidateQueries({ queryKey: ['myProfile', user.userId] })
    } catch {
      toast.error('Şəkil yüklənə bilmədi')
    } finally {
      setUploadingAvatar(false)
      if (avatarInputRef.current) avatarInputRef.current.value = ''
    }
  }

  const totalAppts = appointments.length
  const completed = appointments.filter((a) => a.status === 'Completed').length
  const pending = appointments.filter((a) => a.status === 'Pending' || a.status === 'Confirmed').length
  const recent = [...appointments]
    .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
    .slice(0, 3)

  const stats = [
    { label: 'Cəmi', value: totalAppts, icon: <Calendar size={16} /> },
    { label: 'Tamamlandı', value: completed, icon: <CheckCircle size={16} /> },
    { label: 'Gələcək', value: pending, icon: <Clock size={16} /> },
  ]

  return (
    <motion.div
      initial="hidden" animate="visible" variants={pageVariant}
      style={{ padding: '32px 36px', background: '#F5F5F5', minHeight: 'calc(100vh - 64px)' }}
    >
      <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0A0A0A', letterSpacing: '-0.03em', marginBottom: 28 }}>
        Profil
      </h1>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 28 }}>
        {stats.map((s) => (
          <Card key={s.label} padding={20}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ color: '#6B6B6B' }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: 26, fontWeight: 700, color: '#0A0A0A', letterSpacing: '-0.03em' }}>{s.value}</div>
                <div style={{ fontSize: 11, color: '#6B6B6B', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{s.label}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24 }}>
        {/* Left — avatar + info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card padding={28} style={{ textAlign: 'center' }}>
            {loadingProfile ? (
              <>
                <Skeleton width={80} height={80} borderRadius="50%" style={{ margin: '0 auto 16px' }} />
                <Skeleton height={20} width="70%" style={{ margin: '0 auto 8px' }} />
                <Skeleton height={14} width="40%" style={{ margin: '0 auto' }} />
              </>
            ) : (
              <>
                <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
                <div
                  style={{ position: 'relative', width: 80, height: 80, margin: '0 auto 16px', cursor: 'pointer' }}
                  onClick={() => !uploadingAvatar && avatarInputRef.current?.click()}
                >
                  {profile?.avatarUrl ? (
                    <img src={profile.avatarUrl} alt="Avatar" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: 80, height: 80, background: '#0A0A0A', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 800, color: '#fff' }}>
                      {uploadingAvatar ? '...' : (profile?.fullName?.[0]?.toUpperCase() ?? user.fullName[0])}
                    </div>
                  )}
                  <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(0,0,0,0.45)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, opacity: 0, transition: 'opacity 0.2s' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0' }}
                  >
                    <Camera size={18} color="#fff" />
                    <span style={{ fontSize: 10, color: '#fff', fontWeight: 600 }}>Şəkli dəyiş</span>
                  </div>
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#0A0A0A', marginBottom: 6 }}>{profile?.fullName ?? user.fullName}</div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                  <span style={{ background: '#F5F5F5', color: '#6B6B6B', border: '1px solid #E8E8E8', borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <User size={11} /> Müştəri
                  </span>
                  {profile?.isVerified && (
                    <span style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <BadgeCheck size={11} /> Təsdiqlənmiş
                    </span>
                  )}
                </div>
                {profile?.createdAt && (
                  <div style={{ fontSize: 12, color: '#A3A3A3' }}>
                    Üzv olma tarixi {formatDate(profile.createdAt)}
                  </div>
                )}
              </>
            )}
          </Card>

          {recent.length > 0 && (
            <Card padding={20}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0A0A0A', marginBottom: 14 }}>Son fəaliyyət</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {recent.map((a) => (
                  <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#0A0A0A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.lawyerFullName}</div>
                      <div style={{ fontSize: 11, color: '#A3A3A3' }}>{formatShort(a.scheduledAt)}</div>
                    </div>
                    <Badge>{a.status}</Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right — edit form */}
        <Card padding={28}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0A0A0A', marginBottom: 20 }}>Profili redaktə et</h2>
          {loadingProfile ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[1, 2, 3].map((i) => <Skeleton key={i} height={46} borderRadius={10} />)}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#0A0A0A' }}>Ad Soyad</label>
                <input value={fullName} onChange={(e) => setFullName(e.target.value)}
                  style={{ border: '1px solid #E8E8E8', borderRadius: 10, padding: '11px 14px', fontSize: 14, outline: 'none', fontFamily: 'Inter, sans-serif', background: '#FFFFFF', color: '#0A0A0A', transition: 'border-color 0.15s' }}
                  onFocus={(e) => { e.target.style.borderColor = '#0A0A0A' }}
                  onBlur={(e) => { e.target.style.borderColor = '#E8E8E8' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#0A0A0A' }}>
                  E-poçt <span style={{ color: '#A3A3A3', fontWeight: 400 }}>(dəyişdirilə bilməz)</span>
                </label>
                <input value={profile?.email ?? user.email} disabled
                  style={{ border: '1px solid #E8E8E8', borderRadius: 10, padding: '11px 14px', fontSize: 14, fontFamily: 'Inter, sans-serif', background: '#F5F5F5', color: '#6B6B6B', cursor: 'not-allowed' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#0A0A0A' }}>Telefon</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+994 XX XXX XX XX"
                  style={{ border: '1px solid #E8E8E8', borderRadius: 10, padding: '11px 14px', fontSize: 14, outline: 'none', fontFamily: 'Inter, sans-serif', background: '#FFFFFF', color: '#0A0A0A', transition: 'border-color 0.15s' }}
                  onFocus={(e) => { e.target.style.borderColor = '#0A0A0A' }}
                  onBlur={(e) => { e.target.style.borderColor = '#E8E8E8' }}
                />
              </div>

              <Button loading={saveMutation.isPending} disabled={!fullName.trim()} onClick={() => saveMutation.mutate()} style={{ alignSelf: 'flex-start', minWidth: 160 }}>
                Dəyişiklikləri saxla
              </Button>
            </div>
          )}
        </Card>
      </div>
    </motion.div>
  )
}

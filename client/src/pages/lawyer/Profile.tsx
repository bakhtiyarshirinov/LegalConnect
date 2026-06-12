import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Save, Star, MapPin, Briefcase, DollarSign, CheckCircle } from 'lucide-react'
import { lawyersApi } from '../../api/lawyers'
import { useAuthStore } from '../../store/authStore'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'

export default function LawyerProfile() {
  const user = useAuthStore((s) => s.user)!
  const qc = useQueryClient()

  const { data: profile, isLoading } = useQuery({
    queryKey: ['my-lawyer-profile', user.userId],
    queryFn: lawyersApi.getMyProfile,
  })

  const [form, setForm] = useState({
    bio: '',
    city: '',
    hourlyRate: '',
    experienceYears: '',
    isAvailable: true,
  })
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    if (profile) {
      setForm({
        bio: profile.bio,
        city: profile.city,
        hourlyRate: String(profile.hourlyRate),
        experienceYears: String(profile.experienceYears),
        isAvailable: profile.isAvailable,
      })
    }
  }, [profile])

  const { mutate: updateProfile, isPending } = useMutation({
    mutationFn: () =>
      lawyersApi.updateMyProfile({
        bio: form.bio,
        city: form.city,
        hourlyRate: parseFloat(form.hourlyRate),
        experienceYears: parseInt(form.experienceYears),
        isAvailable: form.isAvailable,
      }),
    onSuccess: () => {
      toast.success('Profil yeniləndi!')
      setIsEditing(false)
      qc.invalidateQueries({ queryKey: ['my-lawyer-profile'] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: (e.target as HTMLInputElement).value }))

  if (isLoading) {
    return (
      <div style={{ padding: '32px 28px' }}>
        <div style={{ height: 200, background: '#FFFFFF', borderRadius: 12 }} className="skeleton" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div style={{ padding: '32px 28px', color: '#6B6B6B' }}>
        Profil tapılmadı. Dəstəklə əlaqə saxlayın.
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{ padding: '32px 28px', maxWidth: 700 }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#0A0A0A', letterSpacing: '-0.5px' }}>Mənim profilim</h1>
          <p style={{ color: '#6B6B6B', marginTop: 4 }}>İctimai vəkil profilinizi idarə edin</p>
        </div>
        <Button
          variant={isEditing ? 'secondary' : 'primary'}
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? 'Ləğv et' : 'Profili redaktə et'}
        </Button>
      </div>

      {/* Profile Overview */}
      <Card padding={28} style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
          <div
            style={{
              width: 70, height: 70, background: '#E8E8E8', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 26, fontWeight: 700, color: '#0A0A0A', flexShrink: 0,
            }}
          >
            {profile.fullName[0]}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0A0A0A' }}>{profile.fullName}</h2>
              {profile.isVerified && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#4ade80', fontSize: 13 }}>
                  <CheckCircle size={14} /> Təsdiqləndi
                </span>
              )}
              <Badge variant={profile.isAvailable ? 'success' : 'error'}>
                {profile.isAvailable ? 'Mövcuddur' : 'Mövcud deyil'}
              </Badge>
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 10, flexWrap: 'wrap', color: '#6B6B6B', fontSize: 13 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><MapPin size={13} /> {profile.city}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Briefcase size={13} /> {profile.experienceYears}y exp</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><DollarSign size={13} /> ${profile.hourlyRate}/hr</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Star size={13} color="#fbbf24" fill="#fbbf24" /> {profile.rating.toFixed(1)} ({profile.reviewCount} reviews)</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
              {profile.specializations.map((s) => <Badge key={s}>{s}</Badge>)}
            </div>
          </div>
        </div>
      </Card>

      {/* Edit Form */}
      {isEditing && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <Card padding={28}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, color: '#0A0A0A' }}>Profili redaktə et</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label style={{ fontSize: 12, color: '#6B6B6B', fontWeight: 500, display: 'block', marginBottom: 6 }}>
                  Haqqında
                </label>
                <textarea
                  value={form.bio}
                  onChange={set('bio')}
                  rows={4}
                  placeholder="Müştərilərə özünüz haqqında məlumat verin..."
                  style={{
                    background: '#F5F5F5', border: '1px solid #E8E8E8', borderRadius: 8,
                    padding: '11px 14px', color: '#0A0A0A', fontSize: 14, width: '100%',
                    outline: 'none', resize: 'vertical', fontFamily: 'Inter, sans-serif',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Input label="Şəhər" value={form.city} onChange={set('city')} icon={<MapPin size={14} />} />
                <Input label="Saatlıq qiymət ($)" type="number" value={form.hourlyRate} onChange={set('hourlyRate')} icon={<DollarSign size={14} />} />
                <Input label="Təcrübə (il)" type="number" value={form.experienceYears} onChange={set('experienceYears')} icon={<Briefcase size={14} />} />
              </div>

              {/* Availability toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#F5F5F5', borderRadius: 8, border: '1px solid #E8E8E8' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#0A0A0A' }}>Yeni müştərilər üçün mövcuddur</div>
                  <div style={{ color: '#6B6B6B', fontSize: 12, marginTop: 2 }}>Yeni görüş qəbulunu dayandırmaq üçün söndürün</div>
                </div>
                <button
                  onClick={() => setForm((f) => ({ ...f, isAvailable: !f.isAvailable }))}
                  style={{
                    width: 48, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer',
                    background: form.isAvailable ? '#ffffff' : '#262626',
                    position: 'relative', transition: 'background 0.2s',
                  }}
                >
                  <div
                    style={{
                      width: 20, height: 20, borderRadius: '50%',
                      background: form.isAvailable ? '#000' : '#525252',
                      position: 'absolute', top: 3,
                      left: form.isAvailable ? 25 : 3,
                      transition: 'left 0.2s, background 0.2s',
                    }}
                  />
                </button>
              </div>

              <Button
                fullWidth
                loading={isPending}
                onClick={() => updateProfile()}
              >
                <Save size={14} /> Dəyişiklikləri saxla
              </Button>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Bio display (when not editing) */}
      {!isEditing && (
        <Card padding={24}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: '#0A0A0A' }}>Haqqında</h3>
          <p style={{ color: '#6B6B6B', lineHeight: 1.7, fontSize: 14 }}>{profile.bio}</p>
          <div style={{ marginTop: 16, padding: '12px 16px', background: '#0A0A0A', borderRadius: 8, fontSize: 13, color: '#6B6B6B' }}>
            <span style={{ color: '#6B6B6B' }}>Lisenziya: </span>
            <span style={{ color: '#0A0A0A', fontWeight: 500 }}>{profile.licenseNumber}</span>
          </div>
        </Card>
      )}
    </motion.div>
  )
}

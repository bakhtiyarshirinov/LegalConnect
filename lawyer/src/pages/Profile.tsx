import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { User, Briefcase, MapPin, DollarSign, Clock, ToggleLeft, ToggleRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'
import { getMyLawyerProfile, updateProfile, type UpdateProfileData } from '../api/profile'
import { Card } from '../components/ui/Card'
import { Input, Textarea } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Skeleton } from '../components/ui/Skeleton'

export default function Profile() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [saving, setSaving] = useState(false)

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

  useEffect(() => {
    if (profile) {
      setForm({
        bio: profile.bio ?? '',
        city: profile.city ?? '',
        hourlyRate: profile.hourlyRate,
        experienceYears: profile.experienceYears,
        isAvailable: profile.isAvailable,
      })
    }
  }, [profile])

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateProfile(form)
      toast.success('Profile updated successfully!')
      qc.invalidateQueries({ queryKey: ['profile-page'] })
    } catch {
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const fieldSkeleton = <Skeleton height={42} borderRadius={10} />

  return (
    <div style={{ padding: 32, maxWidth: 800 }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 28 }}
      >
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#0A0A0A' }}>Profile</h1>
        <p style={{ fontSize: 14, color: '#6B6B6B', marginTop: 4 }}>
          View your account details and manage your lawyer profile
        </p>
      </motion.div>

      {/* Personal info (read-only) */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card style={{ marginBottom: 20 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 20,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: '#F5F5F5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <User size={16} color="#6B6B6B" />
            </div>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: '#0A0A0A' }}>
              Personal Information
            </h2>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 16,
            }}
          >
            {[
              { label: 'Full Name', value: profile?.fullName },
              { label: 'Email', value: profile?.email },
              { label: 'Phone', value: profile?.phone || '—' },
            ].map(({ label, value }) => (
              <div key={label}>
                <div style={{ fontSize: 12, color: '#6B6B6B', marginBottom: 6, fontWeight: 500 }}>
                  {label}
                </div>
                {isLoading ? (
                  <Skeleton height={20} width="80%" />
                ) : (
                  <div style={{ fontSize: 14, fontWeight: 500, color: '#0A0A0A' }}>{value}</div>
                )}
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Lawyer profile (editable) */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 24,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: '#F5F5F5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Briefcase size={16} color="#6B6B6B" />
            </div>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: '#0A0A0A' }}>
              Lawyer Profile
            </h2>
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

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 16,
              }}
            >
              {/* City */}
              <div>
                {isLoading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <Skeleton height={14} width={30} />
                    {fieldSkeleton}
                  </div>
                ) : (
                  <Input
                    label="City"
                    placeholder="e.g. New York"
                    value={form.city}
                    onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                  />
                )}
              </div>

              {/* Hourly Rate */}
              <div>
                {isLoading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <Skeleton height={14} width={70} />
                    {fieldSkeleton}
                  </div>
                ) : (
                  <Input
                    label="Hourly Rate ($)"
                    type="number"
                    placeholder="100"
                    value={form.hourlyRate}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, hourlyRate: parseFloat(e.target.value) || 0 }))
                    }
                  />
                )}
              </div>

              {/* Experience */}
              <div>
                {isLoading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <Skeleton height={14} width={110} />
                    {fieldSkeleton}
                  </div>
                ) : (
                  <Input
                    label="Years of Experience"
                    type="number"
                    placeholder="5"
                    value={form.experienceYears}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        experienceYears: parseInt(e.target.value) || 0,
                      }))
                    }
                  />
                )}
              </div>
            </div>

            {/* Stats row */}
            {!isLoading && profile && (
              <div
                style={{
                  display: 'flex',
                  gap: 20,
                  padding: '16px 0',
                  borderTop: '1px solid #F0F0F0',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <DollarSign size={14} color="#6B6B6B" />
                  <span style={{ fontSize: 13, color: '#6B6B6B' }}>
                    Rate:{' '}
                    <strong style={{ color: '#0A0A0A' }}>${form.hourlyRate}/hr</strong>
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Clock size={14} color="#6B6B6B" />
                  <span style={{ fontSize: 13, color: '#6B6B6B' }}>
                    Experience:{' '}
                    <strong style={{ color: '#0A0A0A' }}>{form.experienceYears} yrs</strong>
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <MapPin size={14} color="#6B6B6B" />
                  <span style={{ fontSize: 13, color: '#6B6B6B' }}>
                    City: <strong style={{ color: '#0A0A0A' }}>{form.city || '—'}</strong>
                  </span>
                </div>
              </div>
            )}

            {/* Availability toggle */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                background: '#F5F5F5',
                borderRadius: 10,
              }}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#0A0A0A' }}>
                  Available for bookings
                </div>
                <div style={{ fontSize: 12, color: '#6B6B6B', marginTop: 2 }}>
                  Toggle to show or hide your profile from clients
                </div>
              </div>
              <button
                onClick={() => setForm((f) => ({ ...f, isAvailable: !f.isAvailable }))}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  color: form.isAvailable ? '#16A34A' : '#6B6B6B',
                }}
              >
                {form.isAvailable ? (
                  <ToggleRight size={36} strokeWidth={1.5} />
                ) : (
                  <ToggleLeft size={36} strokeWidth={1.5} />
                )}
              </button>
            </div>

            {/* Save button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="primary"
                size="md"
                loading={saving}
                onClick={handleSave}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}

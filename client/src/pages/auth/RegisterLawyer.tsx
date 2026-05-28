import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useMutation, useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { User, Mail, Lock, Phone, Scale, FileText, MapPin, DollarSign, Briefcase, CheckCircle } from 'lucide-react'
import { authApi } from '../../api/auth'
import { specializationsApi } from '../../api/specializations'
import { useAuthStore } from '../../store/authStore'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'

export default function RegisterLawyer() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  const [step, setStep] = useState<1 | 2>(1)
  const [form, setForm] = useState({
    fullName: '', email: '', password: '', confirmPassword: '', phone: '',
    bio: '', city: '', licenseNumber: '', experienceYears: '', hourlyRate: '',
  })
  const [selectedSpecs, setSelectedSpecs] = useState<number[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { data: specializations = [] } = useQuery({
    queryKey: ['specializations'],
    queryFn: specializationsApi.getAll,
  })

  const { mutate, isPending } = useMutation({
    mutationFn: authApi.registerLawyer,
    onSuccess: (data) => {
      setAuth(data)
      toast.success('Registration successful! Please verify your email.')
      navigate('/verify-otp', { state: { email: data.email } })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const validateStep1 = () => {
    const e: Record<string, string> = {}
    if (!form.fullName.trim()) e.fullName = 'Required'
    if (!form.email) e.email = 'Required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email'
    if (!form.password) e.password = 'Required'
    else if (form.password.length < 6) e.password = 'At least 6 characters'
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const validateStep2 = () => {
    const e: Record<string, string> = {}
    if (!form.bio.trim()) e.bio = 'Required'
    if (!form.city.trim()) e.city = 'Required'
    if (!form.licenseNumber.trim()) e.licenseNumber = 'Required'
    if (!form.experienceYears) e.experienceYears = 'Required'
    if (!form.hourlyRate) e.hourlyRate = 'Required'
    if (selectedSpecs.length === 0) e.specs = 'Select at least one specialization'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleNext = () => { if (validateStep1()) setStep(2) }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateStep2()) return
    mutate({
      fullName: form.fullName,
      email: form.email,
      password: form.password,
      phone: form.phone || undefined,
      bio: form.bio,
      city: form.city,
      licenseNumber: form.licenseNumber,
      experienceYears: parseInt(form.experienceYears),
      hourlyRate: parseFloat(form.hourlyRate),
      specializationIds: selectedSpecs,
    })
  }

  const toggleSpec = (id: number) =>
    setSelectedSpecs((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      {/* Left dark panel */}
      <div
        style={{
          width: '42%',
          background: '#0A0A0A',
          padding: '56px 64px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 64 }}>
          <div
            style={{
              width: 36,
              height: 36,
              background: '#FFFFFF',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Scale size={18} color="#0A0A0A" />
          </div>
          <span style={{ fontWeight: 700, fontSize: 18, color: '#FFFFFF', letterSpacing: '-0.3px' }}>
            LegalConnect
          </span>
        </div>

        <h2
          style={{
            fontSize: 34,
            fontWeight: 800,
            color: '#FFFFFF',
            letterSpacing: '-0.04em',
            lineHeight: 1.15,
            marginBottom: 16,
          }}
        >
          Grow Your<br />Legal Practice
        </h2>
        <p style={{ color: '#A3A3A3', fontSize: 15, lineHeight: 1.65, marginBottom: 48 }}>
          Join hundreds of verified lawyers who trust LegalConnect to connect with clients.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            'Reach clients actively seeking legal help',
            'Manage appointments effortlessly',
            'Build your reputation with client reviews',
          ].map((item) => (
            <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <CheckCircle size={15} color="#6B6B6B" style={{ flexShrink: 0 }} />
              <span style={{ color: '#D4D4D4', fontSize: 14 }}>{item}</span>
            </div>
          ))}
        </div>

        {/* Step indicator */}
        <div style={{ marginTop: 64 }}>
          <div style={{ fontSize: 11, color: '#6B6B6B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
            Step {step} of 2
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[1, 2].map((s) => (
              <div
                key={s}
                style={{
                  flex: 1,
                  height: 3,
                  borderRadius: 2,
                  background: s <= step ? '#FFFFFF' : '#262626',
                  transition: 'background 0.3s',
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Right white panel */}
      <div
        style={{
          flex: 1,
          background: '#FAFAFA',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px',
          overflowY: 'auto',
        }}
      >
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          style={{ width: '100%', maxWidth: 420 }}
        >
          <div style={{ marginBottom: 28 }}>
            <h1
              style={{
                fontSize: 28,
                fontWeight: 800,
                color: '#0A0A0A',
                letterSpacing: '-0.5px',
                marginBottom: 6,
              }}
            >
              {step === 1 ? 'Create your account' : 'Professional details'}
            </h1>
            <p style={{ color: '#6B6B6B', fontSize: 14 }}>
              {step === 1 ? 'Start with your personal information' : 'Tell clients about your expertise'}
            </p>
          </div>

          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
            >
              <Input label="Full Name" placeholder="Jane Smith" value={form.fullName} onChange={set('fullName')} error={errors.fullName} icon={<User size={14} />} />
              <Input label="Email" type="email" placeholder="jane@lawfirm.com" value={form.email} onChange={set('email')} error={errors.email} icon={<Mail size={14} />} />
              <Input label="Phone" type="tel" placeholder="+994 XX XXX XX XX" value={form.phone} onChange={set('phone')} icon={<Phone size={14} />} />
              <Input label="Password" type="password" placeholder="••••••••" value={form.password} onChange={set('password')} error={errors.password} icon={<Lock size={14} />} />
              <Input label="Confirm Password" type="password" placeholder="••••••••" value={form.confirmPassword} onChange={set('confirmPassword')} error={errors.confirmPassword} icon={<Lock size={14} />} />
              <Button fullWidth size="lg" onClick={handleNext} style={{ marginTop: 4 }} type="button">
                Continue →
              </Button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.form
              key="step2"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              onSubmit={handleSubmit}
              style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#0A0A0A' }}>Bio / About you</label>
                <textarea
                  placeholder="Describe your experience and expertise..."
                  value={form.bio}
                  onChange={set('bio')}
                  rows={3}
                  style={{
                    border: `1px solid ${errors.bio ? '#fca5a5' : '#E8E8E8'}`,
                    borderRadius: 10,
                    padding: '10px 14px',
                    color: '#0A0A0A',
                    fontSize: 14,
                    width: '100%',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'Inter, sans-serif',
                    background: '#FFFFFF',
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#0A0A0A' }}
                  onBlur={(e) => { e.target.style.borderColor = errors.bio ? '#fca5a5' : '#E8E8E8' }}
                />
                {errors.bio && <span style={{ fontSize: 12, color: '#ef4444' }}>{errors.bio}</span>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Input label="City" placeholder="Baku" value={form.city} onChange={set('city')} error={errors.city} icon={<MapPin size={14} />} />
                <Input label="License Number" placeholder="AZ-12345" value={form.licenseNumber} onChange={set('licenseNumber')} error={errors.licenseNumber} icon={<FileText size={14} />} />
                <Input label="Experience (years)" type="number" placeholder="5" value={form.experienceYears} onChange={set('experienceYears')} error={errors.experienceYears} icon={<Briefcase size={14} />} />
                <Input label="Hourly Rate ($)" type="number" placeholder="100" value={form.hourlyRate} onChange={set('hourlyRate')} error={errors.hourlyRate} icon={<DollarSign size={14} />} />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#0A0A0A', display: 'block', marginBottom: 8 }}>
                  Specializations
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {specializations.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleSpec(s.id)}
                      style={{
                        padding: '5px 12px',
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: 'pointer',
                        border: selectedSpecs.includes(s.id) ? '1px solid #0A0A0A' : '1px solid #E8E8E8',
                        background: selectedSpecs.includes(s.id) ? '#0A0A0A' : '#FFFFFF',
                        color: selectedSpecs.includes(s.id) ? '#FFFFFF' : '#6B6B6B',
                        transition: 'all 0.15s',
                        fontFamily: 'Inter, sans-serif',
                      }}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
                {errors.specs && <span style={{ fontSize: 12, color: '#ef4444', marginTop: 4, display: 'block' }}>{errors.specs}</span>}
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <Button type="button" variant="secondary" onClick={() => setStep(1)} style={{ flex: 1 }}>
                  ← Back
                </Button>
                <Button type="submit" loading={isPending} style={{ flex: 2 }}>
                  Register as Lawyer
                </Button>
              </div>
            </motion.form>
          )}

          <p style={{ textAlign: 'center', color: '#6B6B6B', marginTop: 24, fontSize: 14 }}>
            Already have an account?{' '}
            <Link
              to="/login"
              style={{
                color: '#0A0A0A',
                fontWeight: 600,
                textDecoration: 'underline',
                textUnderlineOffset: 3,
              }}
            >
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}

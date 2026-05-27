import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useMutation, useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { User, Mail, Lock, Phone, Scale, FileText, MapPin, DollarSign, Briefcase } from 'lucide-react'
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

  const handleNext = () => {
    if (validateStep1()) setStep(2)
  }

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
    <div
      style={{
        minHeight: '100vh',
        background: '#0A0A0A',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        style={{ width: '100%', maxWidth: 480 }}
      >
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <Link to="/">
            <div style={{ width: 40, height: 40, background: '#fff', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <Scale size={20} color="#000" />
            </div>
          </Link>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff', letterSpacing: '-0.5px' }}>
            Join as a Lawyer
          </h1>
          <p style={{ color: '#A3A3A3', marginTop: 6, fontSize: 13 }}>Step {step} of 2</p>
        </div>

        {/* Progress */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {[1, 2].map((s) => (
            <div
              key={s}
              style={{
                flex: 1,
                height: 3,
                borderRadius: 2,
                background: s <= step ? '#fff' : '#262626',
                transition: 'background 0.3s',
              }}
            />
          ))}
        </div>

        <div style={{ background: '#141414', border: '1px solid #262626', borderRadius: 14, padding: 28 }}>
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
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
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              onSubmit={handleSubmit}
              style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
            >
              <div>
                <label style={{ fontSize: 12, color: '#A3A3A3', fontWeight: 500, display: 'block', marginBottom: 6 }}>
                  Bio / About you
                </label>
                <textarea
                  placeholder="Describe your experience and expertise..."
                  value={form.bio}
                  onChange={set('bio')}
                  rows={3}
                  style={{
                    background: '#1C1C1C',
                    border: `1px solid ${errors.bio ? '#ef444480' : '#262626'}`,
                    borderRadius: 8,
                    padding: '11px 14px',
                    color: '#fff',
                    fontSize: 14,
                    width: '100%',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'Inter, sans-serif',
                  }}
                />
                {errors.bio && <span style={{ fontSize: 12, color: '#ef4444' }}>{errors.bio}</span>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Input label="City" placeholder="Baku" value={form.city} onChange={set('city')} error={errors.city} icon={<MapPin size={14} />} />
                <Input label="License Number" placeholder="AZ-12345" value={form.licenseNumber} onChange={set('licenseNumber')} error={errors.licenseNumber} icon={<FileText size={14} />} />
                <Input label="Experience (years)" type="number" placeholder="5" value={form.experienceYears} onChange={set('experienceYears')} error={errors.experienceYears} icon={<Briefcase size={14} />} />
                <Input label="Hourly Rate ($)" type="number" placeholder="100" value={form.hourlyRate} onChange={set('hourlyRate')} error={errors.hourlyRate} icon={<DollarSign size={14} />} />
              </div>

              {/* Specializations */}
              <div>
                <label style={{ fontSize: 12, color: '#A3A3A3', fontWeight: 500, display: 'block', marginBottom: 8 }}>
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
                        border: selectedSpecs.includes(s.id) ? '1px solid #fff' : '1px solid #262626',
                        background: selectedSpecs.includes(s.id) ? '#fff' : 'transparent',
                        color: selectedSpecs.includes(s.id) ? '#000' : '#A3A3A3',
                        transition: 'all 0.15s',
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
        </div>

        <p style={{ textAlign: 'center', color: '#A3A3A3', marginTop: 20, fontSize: 14 }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#fff', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 3 }}>
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  )
}

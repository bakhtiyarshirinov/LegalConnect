import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { User, Mail, Lock, Phone, Scale } from 'lucide-react'
import { authApi } from '../../api/auth'
import { useAuthStore } from '../../store/authStore'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'

export default function RegisterClient() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  const [form, setForm] = useState({
    fullName: '', email: '', password: '', confirmPassword: '', phone: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { mutate, isPending } = useMutation({
    mutationFn: authApi.registerClient,
    onSuccess: (data) => {
      setAuth(data)
      toast.success('Account created! Please verify your email.')
      navigate('/verify-otp', { state: { email: data.email } })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.fullName.trim()) e.fullName = 'Full name is required'
    if (!form.email) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email'
    if (!form.password) e.password = 'Password is required'
    else if (form.password.length < 6) e.password = 'At least 6 characters'
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    mutate({ fullName: form.fullName, email: form.email, password: form.password, phone: form.phone || undefined })
  }

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
        style={{ width: '100%', maxWidth: 420 }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link to="/">
            <div style={{ width: 40, height: 40, background: '#fff', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <Scale size={20} color="#000" />
            </div>
          </Link>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#fff', letterSpacing: '-0.5px' }}>Create account</h1>
          <p style={{ color: '#A3A3A3', marginTop: 6, fontSize: 14 }}>Find your legal expert today</p>
        </div>

        <div style={{ background: '#141414', border: '1px solid #262626', borderRadius: 14, padding: 28 }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Input label="Full Name" placeholder="John Smith" value={form.fullName} onChange={set('fullName')} error={errors.fullName} icon={<User size={14} />} />
            <Input label="Email" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} error={errors.email} icon={<Mail size={14} />} />
            <Input label="Phone (optional)" type="tel" placeholder="+994 XX XXX XX XX" value={form.phone} onChange={set('phone')} icon={<Phone size={14} />} />
            <Input label="Password" type="password" placeholder="••••••••" value={form.password} onChange={set('password')} error={errors.password} icon={<Lock size={14} />} />
            <Input label="Confirm Password" type="password" placeholder="••••••••" value={form.confirmPassword} onChange={set('confirmPassword')} error={errors.confirmPassword} icon={<Lock size={14} />} />
            <Button type="submit" fullWidth loading={isPending} size="lg" style={{ marginTop: 4 }}>
              Create Account
            </Button>
          </form>
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

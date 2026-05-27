import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { User, Mail, Lock, Phone, Scale } from 'lucide-react'
import { authApi } from '../../api/auth'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'

export default function Register() {
  const navigate = useNavigate()

  const [form, setForm] = useState({ fullName: '', email: '', password: '', phone: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { mutate, isPending } = useMutation({
    mutationFn: () => authApi.registerClient({ ...form }),
    onSuccess: () => {
      toast.success('Account created! Check your email for OTP.')
      navigate('/verify-otp', { state: { email: form.email } })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.fullName.trim()) e.fullName = 'Full name is required'
    if (!form.email) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email'
    if (!form.password) e.password = 'Password is required'
    else if (form.password.length < 6) e.password = 'At least 6 characters'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    mutate()
  }

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  return (
    <div style={{
      minHeight: '100vh', background: '#F5F5F5',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, fontFamily: 'Inter, sans-serif',
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        style={{ width: '100%', maxWidth: 420 }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <div style={{
              width: 44, height: 44, background: '#0A0A0A', borderRadius: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
            }}>
              <Scale size={20} color="#fff" />
            </div>
          </Link>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0A0A0A', letterSpacing: '-0.5px', marginBottom: 6 }}>
            Create account
          </h1>
          <p style={{ color: '#6B6B6B', fontSize: 14 }}>Join LegalConnect as a client</p>
        </div>

        <div style={{
          background: '#FFFFFF', border: '1px solid #E8E8E8', borderRadius: 16,
          padding: 28, boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Input
              label="Full Name" placeholder="John Doe"
              value={form.fullName} onChange={set('fullName')}
              error={errors.fullName} icon={<User size={14} />}
            />
            <Input
              label="Email address" type="email" placeholder="you@example.com"
              value={form.email} onChange={set('email')}
              error={errors.email} icon={<Mail size={14} />} autoComplete="email"
            />
            <Input
              label="Password" type="password" placeholder="Min. 6 characters"
              value={form.password} onChange={set('password')}
              error={errors.password} icon={<Lock size={14} />}
            />
            <Input
              label="Phone (optional)" type="tel" placeholder="+994 50 000 0000"
              value={form.phone} onChange={set('phone')}
              icon={<Phone size={14} />}
            />
            <Button type="submit" fullWidth loading={isPending} size="lg" style={{ marginTop: 4 }}>
              Create Account
            </Button>
          </form>
        </div>

        <p style={{ textAlign: 'center', color: '#6B6B6B', marginTop: 20, fontSize: 14 }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#0A0A0A', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 3 }}>
            Sign in
          </Link>
        </p>
        <p style={{ textAlign: 'center', color: '#6B6B6B', marginTop: 8, fontSize: 13 }}>
          Are you a lawyer?{' '}
          <a href="http://localhost:5174" style={{ color: '#0A0A0A', fontWeight: 500, textDecoration: 'underline', textUnderlineOffset: 3 }}>
            Register as lawyer
          </a>
        </p>
      </motion.div>
    </div>
  )
}

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Mail, Lock, Scale } from 'lucide-react'
import { authApi } from '../../api/auth'
import { useAuthStore } from '../../store/authStore'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'

export default function Login() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { mutate, isPending } = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setAuth(data)
      toast.success(`Welcome back, ${data.fullName}!`)
      if (data.role === 'Admin') window.location.href = 'http://localhost:5175'
      else if (data.role === 'Lawyer') window.location.href = 'http://localhost:5174'
      else navigate('/dashboard')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const validate = () => {
    const e: Record<string, string> = {}
    if (!email) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Invalid email'
    if (!password) e.password = 'Password is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    mutate({ email, password })
  }

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
        style={{ width: '100%', maxWidth: 400 }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
            <div style={{
              width: 44, height: 44, background: '#0A0A0A', borderRadius: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
            }}>
              <Scale size={20} color="#fff" />
            </div>
          </Link>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0A0A0A', letterSpacing: '-0.5px', marginBottom: 6 }}>
            Welcome back
          </h1>
          <p style={{ color: '#6B6B6B', fontSize: 14 }}>Sign in to your LegalConnect account</p>
        </div>

        {/* Card */}
        <div style={{
          background: '#FFFFFF', border: '1px solid #E8E8E8', borderRadius: 16,
          padding: 28, boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Input
              label="Email address" type="email" placeholder="you@example.com"
              value={email} onChange={(e) => setEmail(e.target.value)}
              error={errors.email} icon={<Mail size={14} />} autoComplete="email"
            />
            <Input
              label="Password" type="password" placeholder="••••••••"
              value={password} onChange={(e) => setPassword(e.target.value)}
              error={errors.password} icon={<Lock size={14} />} autoComplete="current-password"
            />
            <Button type="submit" fullWidth loading={isPending} size="lg" style={{ marginTop: 4 }}>
              Sign In
            </Button>
          </form>
        </div>

        <p style={{ textAlign: 'center', color: '#6B6B6B', marginTop: 20, fontSize: 14 }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#0A0A0A', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 3 }}>
            Create account
          </Link>
        </p>
      </motion.div>
    </div>
  )
}

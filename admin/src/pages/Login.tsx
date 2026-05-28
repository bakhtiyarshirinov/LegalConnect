import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { ShieldCheck, Mail, Lock, CheckCircle } from 'lucide-react'
import { login } from '../api/auth'
import { useAuthStore } from '../store/authStore'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'

export const Login: React.FC = () => {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})

  const validate = () => {
    const e: typeof errors = {}
    if (!email) e.email = 'Email is required'
    if (!password) e.password = 'Password is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      const data = await login(email, password)

      if (data.role !== 'Admin') {
        toast.error('Access denied. Admin only.')
        return
      }

      setAuth(
        {
          id: data.userId,
          email: data.email,
          fullName: data.fullName,
          role: data.role,
          token: data.token,
        },
        data.token
      )

      toast.success('Welcome back!')
      navigate('/dashboard')
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Invalid credentials'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left dark panel */}
      <div className="hidden lg:flex w-[42%] bg-[#0A0A0A] flex-col justify-center px-16 py-14">
        <div className="flex items-center gap-2.5 mb-16">
          <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-5 h-5 text-[#0A0A0A]" />
          </div>
          <div>
            <div className="font-bold text-lg text-white tracking-tight leading-none">LegalConnect</div>
            <div className="text-[10px] font-semibold text-[#6B6B6B] uppercase tracking-widest mt-0.5">Admin</div>
          </div>
        </div>

        <h2 className="text-[34px] font-extrabold text-white leading-tight tracking-tighter mb-4">
          Platform<br />Administration
        </h2>
        <p className="text-[#A3A3A3] text-[15px] leading-relaxed mb-12">
          Manage and monitor the LegalConnect platform with full administrative control.
        </p>

        <div className="flex flex-col gap-4">
          {[
            'Verify and approve new lawyers',
            'Monitor all platform users',
            'Maintain platform integrity',
          ].map((item) => (
            <div key={item} className="flex items-center gap-3">
              <CheckCircle className="w-[15px] h-[15px] text-[#6B6B6B] flex-shrink-0" />
              <span className="text-[#D4D4D4] text-sm">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right white panel */}
      <div className="flex-1 bg-[#FAFAFA] flex items-center justify-center p-12">
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="w-full max-w-[360px]"
        >
          <div className="mb-8">
            <h1 className="text-[28px] font-extrabold text-[#0A0A0A] tracking-tight mb-1.5">
              Admin Portal
            </h1>
            <p className="text-sm text-[#6B6B6B]">Sign in to your administrator account</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Email"
              type="email"
              placeholder="admin@legalconnect.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              icon={<Mail className="w-4 h-4" />}
              autoComplete="email"
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              icon={<Lock className="w-4 h-4" />}
              autoComplete="current-password"
            />
            <Button
              type="submit"
              loading={loading}
              className="w-full mt-2 py-3"
            >
              Sign in
            </Button>
          </form>

          <p className="text-center text-xs text-[#6B6B6B] mt-6">
            Access restricted to administrators only
          </p>
        </motion.div>
      </div>
    </div>
  )
}

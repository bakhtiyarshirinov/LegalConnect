import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { ShieldCheck, Mail, Lock } from 'lucide-react'
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
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        <div className="bg-white border border-[#E8E8E8] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-10">
          {/* Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 bg-[#0A0A0A] rounded-2xl flex items-center justify-center mb-4 shadow-[0_4px_12px_rgba(0,0,0,0.15)]">
              <ShieldCheck className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-[#0A0A0A] mb-1">Admin Portal</h1>
            <p className="text-sm text-[#6B6B6B]">LegalConnect administration</p>
          </div>

          {/* Form */}
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
        </div>
      </motion.div>
    </div>
  )
}

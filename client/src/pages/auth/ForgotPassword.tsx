import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Mail, Lock, Scale, ArrowLeft } from 'lucide-react'
import { authApi } from '../../api/auth'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [step, setStep] = useState<'email' | 'reset'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const sendMutation = useMutation({
    mutationFn: () => authApi.forgotPassword(email),
    onSuccess: () => {
      toast.success('Reset code sent! Check your email.')
      setStep('reset')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const resetMutation = useMutation({
    mutationFn: () => authApi.resetPassword({ email, code, newPassword }),
    onSuccess: () => {
      toast.success('Password reset! You can now log in.')
      navigate('/login')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const validateEmail = () => {
    const e: Record<string, string> = {}
    if (!email) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Invalid email'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const validateReset = () => {
    const e: Record<string, string> = {}
    if (!code || code.length !== 6) e.code = '6-digit code required'
    if (!newPassword || newPassword.length < 6) e.newPassword = 'Minimum 6 characters'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      {/* Left dark panel */}
      <div style={{
        width: '42%', background: '#0A0A0A', padding: '56px 64px',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 64 }}>
          <div style={{
            width: 36, height: 36, background: '#FFFFFF', borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Scale size={18} color="#0A0A0A" />
          </div>
          <span style={{ fontWeight: 700, fontSize: 18, color: '#FFFFFF', letterSpacing: '-0.3px' }}>
            LegalConnect
          </span>
        </div>
        <h2 style={{
          fontSize: 34, fontWeight: 800, color: '#FFFFFF',
          letterSpacing: '-0.04em', lineHeight: 1.15, marginBottom: 16,
        }}>
          Reset your<br />password
        </h2>
        <p style={{ color: '#A3A3A3', fontSize: 15, lineHeight: 1.65 }}>
          We'll send a 6-digit code to your email. Use it to set a new password.
        </p>
      </div>

      {/* Right white panel */}
      <div style={{
        flex: 1, background: '#FAFAFA',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px',
      }}>
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          style={{ width: '100%', maxWidth: 380 }}
        >
          <Link
            to="/login"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              color: '#6B6B6B', fontSize: 13, textDecoration: 'none', marginBottom: 24,
            }}
          >
            <ArrowLeft size={14} /> Back to login
          </Link>

          {step === 'email' ? (
            <>
              <div style={{ marginBottom: 28 }}>
                <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0A0A0A', letterSpacing: '-0.5px', marginBottom: 6 }}>
                  Forgot password?
                </h1>
                <p style={{ color: '#6B6B6B', fontSize: 14 }}>
                  Enter your email and we'll send a reset code.
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Input
                  label="Email address"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={errors.email}
                  icon={<Mail size={14} />}
                  autoComplete="email"
                />
                <Button
                  fullWidth size="lg"
                  loading={sendMutation.isPending}
                  onClick={() => { if (validateEmail()) sendMutation.mutate() }}
                  style={{ marginTop: 4 }}
                >
                  Send Reset Code
                </Button>
              </div>
            </>
          ) : (
            <>
              <div style={{ marginBottom: 28 }}>
                <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0A0A0A', letterSpacing: '-0.5px', marginBottom: 6 }}>
                  Enter reset code
                </h1>
                <p style={{ color: '#6B6B6B', fontSize: 14 }}>
                  Code sent to <strong>{email}</strong>. Enter it below with your new password.
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* 6-digit code input */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#0A0A0A' }}>Reset Code</label>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <input
                        key={i}
                        id={`otp-fp-${i}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={code[i] ?? ''}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '')
                          const arr = code.split('')
                          arr[i] = val
                          const next = arr.join('').slice(0, 6)
                          setCode(next)
                          if (val && i < 5) {
                            document.getElementById(`otp-fp-${i + 1}`)?.focus()
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Backspace' && !code[i] && i > 0) {
                            document.getElementById(`otp-fp-${i - 1}`)?.focus()
                          }
                        }}
                        style={{
                          width: 44, height: 52, textAlign: 'center', fontSize: 20,
                          fontWeight: 700, border: `2px solid ${code[i] ? '#0A0A0A' : '#E8E8E8'}`,
                          borderRadius: 10, outline: 'none', fontFamily: 'Inter, sans-serif',
                          color: '#0A0A0A', background: '#FFFFFF',
                        }}
                      />
                    ))}
                  </div>
                  {errors.code && <p style={{ fontSize: 12, color: '#EF4444', textAlign: 'center' }}>{errors.code}</p>}
                </div>

                <Input
                  label="New Password"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  error={errors.newPassword}
                  icon={<Lock size={14} />}
                  autoComplete="new-password"
                />

                <Button
                  fullWidth size="lg"
                  loading={resetMutation.isPending}
                  onClick={() => { if (validateReset()) resetMutation.mutate() }}
                  style={{ marginTop: 4 }}
                >
                  Reset Password
                </Button>

                <button
                  onClick={() => sendMutation.mutate()}
                  disabled={sendMutation.isPending}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#6B6B6B', fontSize: 13, textDecoration: 'underline',
                    textUnderlineOffset: 3, fontFamily: 'Inter, sans-serif',
                  }}
                >
                  Didn't receive it? Resend code
                </button>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  )
}

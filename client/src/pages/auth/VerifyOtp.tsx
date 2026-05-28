import { useState, useRef, useEffect, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Scale, Mail, RotateCcw } from 'lucide-react'
import { authApi } from '../../api/auth'
import { useAuthStore } from '../../store/authStore'
import { Button } from '../../components/ui/Button'

export default function VerifyOtp() {
  const navigate = useNavigate()
  const location = useLocation()
  const setAuth = useAuthStore((s) => s.setAuth)
  const user = useAuthStore((s) => s.user)
  const email = (location.state as { email?: string })?.email ?? user?.email ?? ''

  const [digits, setDigits] = useState<string[]>(Array(6).fill(''))
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const [timer, setTimer] = useState(60)

  useEffect(() => { inputRefs.current[0]?.focus() }, [])

  useEffect(() => {
    if (timer <= 0) return
    const t = setTimeout(() => setTimer((p) => p - 1), 1000)
    return () => clearTimeout(t)
  }, [timer])

  const { mutate: verify, isPending } = useMutation({
    mutationFn: authApi.verifyOtp,
    onSuccess: (data) => {
      setAuth(data)
      toast.success('Email verified! Welcome to LegalConnect.')
      navigate('/dashboard')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const { mutate: resend, isPending: isResending } = useMutation({
    mutationFn: () => authApi.resendOtp(email),
    onSuccess: () => { toast.success('OTP sent!'); setTimer(60) },
    onError: (err: Error) => toast.error(err.message),
  })

  const handleDigitChange = useCallback((index: number, value: string) => {
    if (value.length > 1) {
      const pasted = value.replace(/\D/g, '').slice(0, 6)
      const newDigits = Array(6).fill('')
      pasted.split('').forEach((c, i) => { newDigits[i] = c })
      setDigits(newDigits)
      inputRefs.current[Math.min(pasted.length, 5)]?.focus()
      return
    }
    if (value && !/^\d$/.test(value)) return
    const newDigits = [...digits]
    newDigits[index] = value
    setDigits(newDigits)
    if (value && index < 5) inputRefs.current[index + 1]?.focus()
  }, [digits])

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const code = digits.join('')
    if (code.length < 6) { toast.error('Enter all 6 digits'); return }
    verify({ email, code })
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#FAFAFA',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, fontFamily: 'Inter, sans-serif',
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        style={{ width: '100%', maxWidth: 380 }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, background: '#0A0A0A', borderRadius: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
          }}>
            <Mail size={24} color="#fff" />
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0A0A0A', letterSpacing: '-0.5px', marginBottom: 8 }}>
            Check your email
          </h1>
          <p style={{ color: '#6B6B6B', fontSize: 14, lineHeight: 1.6 }}>
            We sent a 6-digit code to<br />
            <strong style={{ color: '#0A0A0A' }}>{email}</strong>
          </p>
        </div>

        <div style={{
          background: '#FFFFFF', border: '1px solid #F0F0F0', borderRadius: 16,
          padding: 28, boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* OTP Inputs */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              {digits.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el }}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={digit}
                  onChange={(e) => handleDigitChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  style={{
                    width: 46, height: 54, textAlign: 'center',
                    fontSize: 22, fontWeight: 700, color: '#0A0A0A',
                    background: digit ? '#F5F5F5' : '#FFFFFF',
                    border: `2px solid ${digit ? '#0A0A0A' : '#E8E8E8'}`,
                    borderRadius: 12, outline: 'none',
                    transition: 'all 0.15s',
                    fontFamily: 'Inter, sans-serif',
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#0A0A0A'; e.target.style.boxShadow = '0 0 0 3px rgba(10,10,10,0.08)' }}
                  onBlur={(e) => { e.target.style.borderColor = digit ? '#0A0A0A' : '#E8E8E8'; e.target.style.boxShadow = 'none' }}
                />
              ))}
            </div>

            <Button type="submit" fullWidth loading={isPending} size="lg">
              Verify Email
            </Button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 20 }}>
            {timer > 0 ? (
              <p style={{ fontSize: 13, color: '#6B6B6B' }}>
                Resend code in <strong style={{ color: '#0A0A0A' }}>{timer}s</strong>
              </p>
            ) : (
              <button
                onClick={() => resend()}
                disabled={isResending}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#0A0A0A', fontSize: 13, fontWeight: 600,
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  fontFamily: 'Inter, sans-serif', textDecoration: 'underline', textUnderlineOffset: 3,
                }}
              >
                <RotateCcw size={12} /> {isResending ? 'Sending...' : 'Resend OTP'}
              </button>
            )}
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: '#A3A3A3', fontSize: 13 }}>
            <Scale size={13} /> LegalConnect
          </div>
        </div>
      </motion.div>
    </div>
  )
}

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Mail, Lock, Scale, CheckCircle } from 'lucide-react'
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
      toast.success(`Xoş gəldiniz, ${data.fullName}!`)
      if (data.role === 'Admin') window.location.href = 'http://localhost:5175'
      else if (data.role === 'Lawyer') window.location.href = 'http://localhost:5174'
      else navigate('/dashboard')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const validate = () => {
    const e: Record<string, string> = {}
    if (!email) e.email = 'E-poçt tələb olunur'
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'E-poçt düzgün deyil'
    if (!password) e.password = 'Şifrə tələb olunur'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (validate()) mutate({ email, password }) }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      {/* Left dark panel */}
      <div style={{ width: '42%', background: '#0A0A0A', padding: '56px 64px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 64 }}>
          <div style={{ width: 36, height: 36, background: '#FFFFFF', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Scale size={18} color="#0A0A0A" />
          </div>
          <span style={{ fontWeight: 700, fontSize: 18, color: '#FFFFFF', letterSpacing: '-0.3px' }}>LegalConnect</span>
        </div>
        <h2 style={{ fontSize: 34, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.04em', lineHeight: 1.15, marginBottom: 16 }}>
          Ekspert Hüquqi Yardım,<br />Dərhal
        </h2>
        <p style={{ color: '#A3A3A3', fontSize: 15, lineHeight: 1.65, marginBottom: 48 }}>
          Təsdiqlənmiş vəkillərlə əlaqə saxlayın və hüquqi məsələlərinizi inamla həll edin.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {['Azərbaycanda 500+ təsdiqlənmiş vəkil', 'Təhlükəsiz, şifrəli platforma', '2 dəqiqədən az müddətdə görüş planla'].map((item) => (
            <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <CheckCircle size={15} color="#6B6B6B" style={{ flexShrink: 0 }} />
              <span style={{ color: '#D4D4D4', fontSize: 14 }}>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div style={{ flex: 1, background: '#FAFAFA', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, ease: 'easeOut' }} style={{ width: '100%', maxWidth: 380 }}>
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0A0A0A', letterSpacing: '-0.5px', marginBottom: 6 }}>Xoş gəldiniz</h1>
            <p style={{ color: '#6B6B6B', fontSize: 14 }}>LegalConnect hesabınıza daxil olun</p>
          </div>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Input label="E-poçt ünvanı" type="email" placeholder="siz@nümunə.com" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} icon={<Mail size={14} />} autoComplete="email" />
            <Input label="Şifrə" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} icon={<Lock size={14} />} autoComplete="current-password" />
            <Button type="submit" fullWidth loading={isPending} size="lg" style={{ marginTop: 4 }}>Daxil ol</Button>
          </form>
          <p style={{ textAlign: 'right', marginTop: 12, fontSize: 13 }}>
            <Link to="/forgot-password" style={{ color: '#6B6B6B', textDecoration: 'underline', textUnderlineOffset: 3 }}>Şifrəni unutdunuz?</Link>
          </p>
          <p style={{ textAlign: 'center', color: '#6B6B6B', marginTop: 12, fontSize: 14 }}>
            Hesabınız yoxdur?{' '}
            <Link to="/register" style={{ color: '#0A0A0A', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 3 }}>Müştəri kimi qoşul</Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { User, Mail, Lock, Phone, Scale, CheckCircle } from 'lucide-react'
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
      toast.success('Hesab yaradıldı! E-poçtunuzu təsdiqləyin.')
      navigate('/verify-otp', { state: { email: data.email } })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.fullName.trim()) e.fullName = 'Ad Soyad tələb olunur'
    if (!form.email) e.email = 'E-poçt tələb olunur'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'E-poçt düzgün deyil'
    if (!form.password) e.password = 'Şifrə tələb olunur'
    else if (form.password.length < 6) e.password = 'Ən azı 6 simvol'
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Şifrələr uyğun gəlmir'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    mutate({ fullName: form.fullName, email: form.email, password: form.password, phone: form.phone || undefined })
  }

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
          Hüquq Ekspertinizi<br />Bu Gün Tapın
        </h2>
        <p style={{ color: '#A3A3A3', fontSize: 15, lineHeight: 1.65, marginBottom: 48 }}>
          LegalConnect vasitəsilə hüquqi məsələlərini həll etmiş minlərlə müştəriyə qoşulun.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            'Yalnız təsdiqlənmiş və etibarlı vəkillər',
            'Təhlükəsiz və məxfi konsultasiyalar',
            'Şəffaf qiymətlər, sürprizlər yoxdur',
          ].map((item) => (
            <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <CheckCircle size={15} color="#6B6B6B" style={{ flexShrink: 0 }} />
              <span style={{ color: '#D4D4D4', fontSize: 14 }}>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right white panel */}
      <div style={{ flex: 1, background: '#FAFAFA', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px', overflowY: 'auto' }}>
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          style={{ width: '100%', maxWidth: 380 }}
        >
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0A0A0A', letterSpacing: '-0.5px', marginBottom: 6 }}>Hesab yarat</h1>
            <p style={{ color: '#6B6B6B', fontSize: 14 }}>Hüquq ekspertinizi bu gün tapın</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Input label="Ad Soyad" placeholder="Əli Həsənov" value={form.fullName} onChange={set('fullName')} error={errors.fullName} icon={<User size={14} />} />
            <Input label="E-poçt ünvanı" type="email" placeholder="siz@nümunə.com" value={form.email} onChange={set('email')} error={errors.email} icon={<Mail size={14} />} />
            <Input label="Telefon" type="tel" placeholder="+994 XX XXX XX XX" value={form.phone} onChange={set('phone')} icon={<Phone size={14} />} />
            <Input label="Şifrə" type="password" placeholder="••••••••" value={form.password} onChange={set('password')} error={errors.password} icon={<Lock size={14} />} />
            <Input label="Şifrəni təsdiqlə" type="password" placeholder="••••••••" value={form.confirmPassword} onChange={set('confirmPassword')} error={errors.confirmPassword} icon={<Lock size={14} />} />
            <Button type="submit" fullWidth loading={isPending} size="lg" style={{ marginTop: 4 }}>
              Hesab yarat
            </Button>
          </form>

          <p style={{ textAlign: 'center', color: '#6B6B6B', marginTop: 24, fontSize: 14 }}>
            Hesabınız var?{' '}
            <Link to="/login" style={{ color: '#0A0A0A', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 3 }}>
              Daxil ol
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}

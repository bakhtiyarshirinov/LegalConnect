import { useState } from 'react'
import { motion } from 'framer-motion'
import { Scale, CheckCircle } from 'lucide-react'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { handleLogin, loading } = useAuth()

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleLogin(email, password)
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      {/* Left dark panel */}
      <div
        style={{
          width: '42%',
          background: '#0A0A0A',
          padding: '56px 64px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 64 }}>
          <div
            style={{
              width: 36,
              height: 36,
              background: '#FFFFFF',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Scale size={18} color="#0A0A0A" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#FFFFFF', letterSpacing: '-0.3px' }}>
              LegalConnect
            </div>
            <div style={{ fontSize: 10, color: '#6B6B6B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Pro
            </div>
          </div>
        </div>

        <h2
          style={{
            fontSize: 34,
            fontWeight: 800,
            color: '#FFFFFF',
            letterSpacing: '-0.04em',
            lineHeight: 1.15,
            marginBottom: 16,
          }}
        >
          Grow Your<br />Legal Practice
        </h2>
        <p style={{ color: '#A3A3A3', fontSize: 15, lineHeight: 1.65, marginBottom: 48 }}>
          Manage appointments, connect with clients, and build your reputation — all in one place.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            'Access your appointments dashboard',
            'Chat with clients in real time',
            'Manage your professional profile',
          ].map((item) => (
            <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <CheckCircle size={15} color="#6B6B6B" style={{ flexShrink: 0 }} />
              <span style={{ color: '#D4D4D4', fontSize: 14 }}>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right white panel */}
      <div
        style={{
          flex: 1,
          background: '#FAFAFA',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px',
        }}
      >
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          style={{ width: '100%', maxWidth: 360 }}
        >
          <div style={{ marginBottom: 32 }}>
            <h1
              style={{
                fontSize: 28,
                fontWeight: 800,
                color: '#0A0A0A',
                letterSpacing: '-0.5px',
                marginBottom: 6,
              }}
            >
              Lawyer Portal
            </h1>
            <p style={{ color: '#6B6B6B', fontSize: 14 }}>
              Sign in to your LegalConnect account
            </p>
          </div>

          <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Input
              label="Email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
            >
              Sign In
            </Button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 12, color: '#6B6B6B', marginTop: 24 }}>
            Access restricted to verified lawyers only
          </p>
        </motion.div>
      </div>
    </div>
  )
}

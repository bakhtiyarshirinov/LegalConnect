import { useState } from 'react'
import { motion } from 'framer-motion'
import { Scale } from 'lucide-react'
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
    <div
      style={{
        minHeight: '100vh',
        background: '#FAFAFA',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          width: '100%',
          maxWidth: 400,
          background: '#FFFFFF',
          border: '1px solid #E8E8E8',
          borderRadius: 16,
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
          padding: 40,
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
            marginBottom: 32,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              background: '#0A0A0A',
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Scale size={24} color="#FFFFFF" />
          </div>
          <div style={{ textAlign: 'center' }}>
            <h1
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: '#0A0A0A',
                marginBottom: 4,
              }}
            >
              Lawyer Portal
            </h1>
            <p style={{ fontSize: 14, color: '#6B6B6B' }}>
              Sign in to your LegalConnect account
            </p>
          </div>
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

        <p
          style={{
            textAlign: 'center',
            fontSize: 12,
            color: '#6B6B6B',
            marginTop: 24,
          }}
        >
          Access restricted to verified lawyers only
        </p>
      </motion.div>
    </div>
  )
}

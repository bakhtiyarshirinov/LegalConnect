import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Scale } from 'lucide-react'
import { Button } from '../components/ui/Button'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div style={{
      minHeight: '100vh', background: '#F5F5F5',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Inter, sans-serif',
    }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        style={{ textAlign: 'center', padding: '0 24px' }}
      >
        <div style={{
          fontSize: 100, fontWeight: 800, letterSpacing: '-6px',
          lineHeight: 1, marginBottom: 8, color: '#E8E8E8',
        }}>
          404
        </div>

        <div style={{ width: 48, height: 48, background: '#0A0A0A', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <Scale size={24} color="#fff" />
        </div>

        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0A0A0A', marginBottom: 12, letterSpacing: '-0.5px' }}>
          Page not found
        </h1>
        <p style={{ color: '#6B6B6B', fontSize: 15, marginBottom: 32 }}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Button onClick={() => navigate(-1)} variant="secondary">Go Back</Button>
          <Button onClick={() => navigate('/')}>Home</Button>
        </div>
      </motion.div>
    </div>
  )
}

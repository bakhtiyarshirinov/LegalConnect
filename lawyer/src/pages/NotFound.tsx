import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Scale } from 'lucide-react'
import { Button } from '../components/ui/Button'

export default function NotFound() {
  const navigate = useNavigate()

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
        style={{ textAlign: 'center' }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            background: '#0A0A0A',
            borderRadius: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
          }}
        >
          <Scale size={28} color="#FFFFFF" />
        </div>
        <h1
          style={{
            fontSize: 64,
            fontWeight: 800,
            color: '#0A0A0A',
            lineHeight: 1,
            marginBottom: 12,
          }}
        >
          404
        </h1>
        <p
          style={{
            fontSize: 18,
            fontWeight: 600,
            color: '#0A0A0A',
            marginBottom: 8,
          }}
        >
          Səhifə tapılmadı
        </p>
        <p
          style={{
            fontSize: 14,
            color: '#6B6B6B',
            marginBottom: 28,
          }}
        >
          Axtardığınız səhifə mövcud deyil və ya köçürülüb.
        </p>
        <Button variant="primary" size="lg" onClick={() => navigate('/dashboard')}>
          Panelə qayıt
        </Button>
      </motion.div>
    </div>
  )
}

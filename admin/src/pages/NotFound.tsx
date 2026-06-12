import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '../components/ui/Button'
import { Home } from 'lucide-react'

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center"
      >
        <p className="text-8xl font-bold text-[#E8E8E8] mb-6">404</p>
        <h1 className="text-2xl font-bold text-[#0A0A0A] mb-2">Səhifə tapılmadı</h1>
        <p className="text-[#6B6B6B] mb-8">
          Axtardığınız səhifə mövcud deyil və ya köçürülüb.
        </p>
        <Link to="/dashboard">
          <Button>
            <Home className="w-4 h-4" />
            Panelə qayıt
          </Button>
        </Link>
      </motion.div>
    </div>
  )
}

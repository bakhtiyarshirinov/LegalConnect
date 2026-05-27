import { useNavigate } from 'react-router-dom'
import { LogOut, Scale } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuthStore } from '../../store/authStore'

export function Navbar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <motion.header
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      style={{
        height: 60,
        borderBottom: '1px solid #E8E8E8',
        background: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div
          style={{
            width: 32,
            height: 32,
            background: '#0A0A0A',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Scale size={16} color="#FFFFFF" />
        </div>
        <div>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#0A0A0A' }}>LegalConnect</span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 500,
              color: '#6B6B6B',
              display: 'block',
              lineHeight: 1,
            }}
          >
            Pro
          </span>
        </div>
      </div>

      {/* User info + logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#0A0A0A' }}>
            {user?.fullName}
          </div>
          <div style={{ fontSize: 11, color: '#6B6B6B' }}>Lawyer</div>
        </div>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: '#F5F5F5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            fontWeight: 600,
            color: '#0A0A0A',
          }}
        >
          {user?.fullName?.[0] ?? '?'}
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 14px',
            borderRadius: 10,
            border: '1px solid #E8E8E8',
            background: '#FFFFFF',
            fontSize: 13,
            fontWeight: 500,
            color: '#6B6B6B',
            cursor: 'pointer',
          }}
        >
          <LogOut size={14} />
          Logout
        </motion.button>
      </div>
    </motion.header>
  )
}

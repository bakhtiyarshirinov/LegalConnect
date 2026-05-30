import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, Scale, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../../store/authStore'
import { getMyLawyerProfile } from '../../api/profile'

export function Navbar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [dropOpen, setDropOpen] = useState(false)

  const { data: profile } = useQuery({
    queryKey: ['profile-page', user?.userId],
    queryFn: getMyLawyerProfile,
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  })

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
        height: 64,
        borderBottom: '1px solid #F0F0F0',
        background: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        padding: '0 28px',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div
          style={{
            width: 32,
            height: 32,
            background: '#0A0A0A',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Scale size={16} color="#FFFFFF" />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0A0A0A', letterSpacing: '-0.3px', lineHeight: 1 }}>
            LegalConnect
          </div>
          <div
            style={{
              fontSize: 9,
              fontWeight: 600,
              color: '#A3A3A3',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            Pro
          </div>
        </div>
      </div>

      {/* User dropdown */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setDropOpen((p) => !p)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: '#F5F5F5',
            border: '1px solid #F0F0F0',
            borderRadius: 10,
            padding: '6px 12px 6px 8px',
            cursor: 'pointer',
            color: '#0A0A0A',
            fontSize: 13,
            fontWeight: 500,
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = '#EFEFEF')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = '#F5F5F5')}
        >
          <div
            style={{
              width: 26,
              height: 26,
              background: '#0A0A0A',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              fontWeight: 700,
              color: '#fff',
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            {profile?.avatarUrl ? (
              <img src={profile.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              user?.fullName?.[0]?.toUpperCase() ?? '?'
            )}
          </div>
          <span style={{ maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.fullName}
          </span>
          <ChevronDown size={14} color="#6B6B6B" />
        </button>

        <AnimatePresence>
          {dropOpen && (
            <>
              <div
                style={{ position: 'fixed', inset: 0, zIndex: 59 }}
                onClick={() => setDropOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ duration: 0.12 }}
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '110%',
                  background: '#FFFFFF',
                  border: '1px solid #F0F0F0',
                  borderRadius: 12,
                  minWidth: 180,
                  overflow: 'hidden',
                  zIndex: 60,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                }}
              >
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #F0F0F0' }}>
                  <div style={{ fontSize: 11, color: '#6B6B6B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Lawyer</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0A0A0A', marginTop: 2 }}>
                    {user?.email}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#ef4444',
                    fontSize: 13,
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    textAlign: 'left',
                    transition: 'background 0.15s',
                    fontFamily: 'Inter, sans-serif',
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = '#fef2f2')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'none')}
                >
                  <LogOut size={14} />
                  Sign out
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  )
}

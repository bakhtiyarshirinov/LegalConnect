import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, LogOut, Scale, ChevronDown } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../../store/authStore'
import { notificationsApi } from '../../api/notifications'
import { usersApi } from '../../api/users'

export function Navbar() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  const [dropOpen, setDropOpen] = useState(false)

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unread-count', user?.userId],
    queryFn: () => notificationsApi.getUnreadCount(user!.userId),
    enabled: !!user,
    refetchInterval: 60_000,
  })

  const { data: userProfile } = useQuery({
    queryKey: ['myProfile', user?.userId],
    queryFn: usersApi.getMe,
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  })

  const handleLogout = () => { if (window.confirm('Çıxmaq istədiyinizə əminsiniz?')) { logout(); navigate('/login') } }

  return (
    <nav style={{
      height: 64, background: '#FFFFFF', borderBottom: '1px solid #F0F0F0',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 28px', position: 'sticky', top: 0, zIndex: 50,
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    }}>
      <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
        <div style={{ width: 32, height: 32, background: '#0A0A0A', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Scale size={16} color="#fff" />
        </div>
        <span style={{ fontWeight: 700, fontSize: 16, color: '#0A0A0A', letterSpacing: '-0.3px' }}>LegalConnect</span>
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Link to="/notifications" style={{ position: 'relative', padding: 8, display: 'flex', alignItems: 'center', color: '#6B6B6B', borderRadius: 10, background: 'transparent', textDecoration: 'none' }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = '#F5F5F5')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
          title="Bildirişlər"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span style={{ position: 'absolute', top: 4, right: 4, minWidth: 16, height: 16, padding: '0 4px', background: '#0A0A0A', borderRadius: 8, fontSize: 9, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setDropOpen((p) => !p)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F5F5F5', border: '1px solid #E8E8E8', borderRadius: 10, padding: '6px 12px 6px 8px', cursor: 'pointer', color: '#0A0A0A', fontSize: 13, fontWeight: 500 }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = '#EFEFEF')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = '#F5F5F5')}
          >
            <div style={{ width: 26, height: 26, background: '#0A0A0A', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', overflow: 'hidden', flexShrink: 0 }}>
              {userProfile?.avatarUrl ? (
                <img src={userProfile.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                user?.fullName?.[0]?.toUpperCase() ?? '?'
              )}
            </div>
            <span style={{ maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.fullName}</span>
            <ChevronDown size={14} color="#6B6B6B" />
          </button>

          <AnimatePresence>
            {dropOpen && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 59 }} onClick={() => setDropOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.12 }}
                  style={{ position: 'absolute', right: 0, top: '110%', background: '#FFFFFF', border: '1px solid #E8E8E8', borderRadius: 12, minWidth: 180, overflow: 'hidden', zIndex: 60, boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}
                >
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid #E8E8E8' }}>
                    <div style={{ fontSize: 11, color: '#6B6B6B', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{user?.role}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#0A0A0A', marginTop: 2 }}>{user?.email}</div>
                  </div>
                  <button
                    onClick={handleLogout}
                    style={{ width: '100%', padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left' }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = '#fef2f2')}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'none')}
                  >
                    <LogOut size={14} /> Çıxış
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </nav>
  )
}

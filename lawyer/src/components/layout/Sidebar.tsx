import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Calendar, User, MessageSquare, Clock } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuthStore } from '../../store/authStore'

const links = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/appointments', icon: Calendar, label: 'Appointments' },
  { to: '/schedule', icon: Clock, label: 'Schedule' },
  { to: '/profile', icon: User, label: 'Profile' },
  { to: '/chat', icon: MessageSquare, label: 'Chat' },
]

export function Sidebar() {
  const user = useAuthStore((s) => s.user)

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      style={{
        width: 220,
        borderRight: '1px solid #F0F0F0',
        background: '#FFFFFF',
        padding: '16px 12px 80px',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        flexShrink: 0,
        position: 'relative',
        minHeight: '100%',
      }}
    >
      {links.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          style={({ isActive }) => ({
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 12px',
            borderRadius: 10,
            fontSize: 14,
            fontWeight: isActive ? 600 : 500,
            color: isActive ? '#FFFFFF' : '#6B6B6B',
            background: isActive ? '#0A0A0A' : 'transparent',
            transition: 'all 0.15s',
            textDecoration: 'none',
          })}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLElement
            if (!el.getAttribute('aria-current')) {
              el.style.background = '#F5F5F5'
              el.style.color = '#0A0A0A'
            }
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLElement
            if (!el.getAttribute('aria-current')) {
              el.style.background = 'transparent'
              el.style.color = '#6B6B6B'
            }
          }}
        >
          {({ isActive }) => (
            <>
              <Icon size={18} color={isActive ? '#FFFFFF' : '#6B6B6B'} />
              {label}
            </>
          )}
        </NavLink>
      ))}

      {/* User info at bottom */}
      {user && (
        <div
          style={{
            position: 'absolute',
            bottom: 16,
            left: 12,
            right: 12,
            padding: '12px 14px',
            background: '#F5F5F5',
            borderRadius: 12,
            border: '1px solid #F0F0F0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: '#0A0A0A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 13,
                fontWeight: 700,
                color: '#FFFFFF',
                flexShrink: 0,
              }}
            >
              {user.fullName?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#0A0A0A',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {user.fullName}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: '#6B6B6B',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  fontWeight: 600,
                  marginTop: 1,
                }}
              >
                Lawyer
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.aside>
  )
}

import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Calendar,
  UserCircle,
  ShieldCheck,
  Bell,
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

interface NavItem {
  label: string
  to: string
  icon: React.ReactNode
}

const clientNav: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard', icon: <LayoutDashboard size={16} /> },
  { label: 'Find Lawyers', to: '/lawyers', icon: <Users size={16} /> },
  { label: 'Appointments', to: '/appointments', icon: <Calendar size={16} /> },
  { label: 'Chat', to: '/chat', icon: <MessageSquare size={16} /> },
  { label: 'Notifications', to: '/notifications', icon: <Bell size={16} /> },
]

const lawyerNav: NavItem[] = [
  { label: 'Dashboard', to: '/lawyer/dashboard', icon: <LayoutDashboard size={16} /> },
  { label: 'Appointments', to: '/lawyer/appointments', icon: <Calendar size={16} /> },
  { label: 'Chat', to: '/chat', icon: <MessageSquare size={16} /> },
  { label: 'My Profile', to: '/lawyer/profile', icon: <UserCircle size={16} /> },
]

const adminNav: NavItem[] = [
  { label: 'Dashboard', to: '/admin/dashboard', icon: <LayoutDashboard size={16} /> },
  { label: 'Verify Lawyers', to: '/admin/lawyers', icon: <ShieldCheck size={16} /> },
]

export function Sidebar() {
  const user = useAuthStore((s) => s.user)
  const role = user?.role
  const navItems =
    role === 'Lawyer' ? lawyerNav : role === 'Admin' ? adminNav : clientNav

  return (
    <aside
      style={{
        width: 240,
        minHeight: 'calc(100vh - 64px)',
        background: '#FFFFFF',
        borderRight: '1px solid #F0F0F0',
        padding: '16px 12px 80px',
        flexShrink: 0,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 14px',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: isActive ? 600 : 500,
              color: isActive ? '#FFFFFF' : '#6B6B6B',
              background: isActive ? '#0A0A0A' : 'transparent',
              textDecoration: 'none',
              transition: 'all 0.15s',
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
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

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
                {user.role}
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}

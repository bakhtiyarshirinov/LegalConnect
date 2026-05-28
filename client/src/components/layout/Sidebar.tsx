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
  const role = useAuthStore((s) => s.user?.role)
  const navItems =
    role === 'Lawyer' ? lawyerNav : role === 'Admin' ? adminNav : clientNav

  return (
    <aside
      style={{
        width: 240,
        minHeight: 'calc(100vh - 64px)',
        background: '#FFFFFF',
        borderRight: '1px solid #E8E8E8',
        padding: '20px 12px',
        flexShrink: 0,
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
              color: isActive ? '#0A0A0A' : '#6B6B6B',
              background: isActive ? '#F5F5F5' : 'transparent',
              border: isActive ? '1px solid #E8E8E8' : '1px solid transparent',
              textDecoration: 'none',
              transition: 'all 0.15s',
            })}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement
              if (!el.getAttribute('aria-current')) {
                el.style.background = '#F5F5F5'
              }
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement
              if (!el.getAttribute('aria-current')) {
                el.style.background = 'transparent'
              }
            }}
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

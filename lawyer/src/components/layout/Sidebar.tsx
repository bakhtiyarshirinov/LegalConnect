import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Calendar, User, MessageSquare } from 'lucide-react'
import { motion } from 'framer-motion'

const links = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/appointments', icon: Calendar, label: 'Appointments' },
  { to: '/profile', icon: User, label: 'Profile' },
  { to: '/chat', icon: MessageSquare, label: 'Chat' },
]

export function Sidebar() {
  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      style={{
        width: 220,
        borderRight: '1px solid #E8E8E8',
        background: '#FFFFFF',
        padding: '20px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        flexShrink: 0,
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
            fontWeight: 500,
            color: isActive ? '#0A0A0A' : '#6B6B6B',
            background: isActive ? '#F5F5F5' : 'transparent',
            transition: 'background 0.15s, color 0.15s',
            textDecoration: 'none',
          })}
        >
          {({ isActive }) => (
            <>
              <Icon size={18} color={isActive ? '#0A0A0A' : '#6B6B6B'} />
              {label}
            </>
          )}
        </NavLink>
      ))}
    </motion.aside>
  )
}

import React from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, Briefcase } from 'lucide-react'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/lawyers', label: 'Lawyers', icon: Briefcase },
  { to: '/users', label: 'Users', icon: Users },
]

export const Sidebar: React.FC = () => {
  return (
    <aside className="fixed left-0 top-16 bottom-0 w-56 bg-white border-r border-[#E8E8E8] z-40">
      <nav className="p-4 flex flex-col gap-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 ${
                isActive
                  ? 'bg-[#0A0A0A] text-white'
                  : 'text-[#6B6B6B] hover:text-[#0A0A0A] hover:bg-[#F5F5F5]'
              }`
            }
          >
            <Icon className="w-4 h-4" />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

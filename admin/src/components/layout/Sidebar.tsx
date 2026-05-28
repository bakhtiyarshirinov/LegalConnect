import React from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, Briefcase } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/lawyers', label: 'Lawyers', icon: Briefcase },
  { to: '/users', label: 'Users', icon: Users },
]

export const Sidebar: React.FC = () => {
  const user = useAuthStore((s) => s.user)

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-56 bg-white border-r border-[#F0F0F0] z-40 flex flex-col">
      <nav className="p-3 flex flex-col gap-1 flex-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
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

      {/* User info */}
      {user && (
        <div className="p-3 border-t border-[#F0F0F0]">
          <div className="flex items-center gap-2.5 px-2 py-2.5 bg-[#F5F5F5] rounded-xl border border-[#F0F0F0]">
            <div className="w-8 h-8 rounded-full bg-[#0A0A0A] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {user.fullName?.charAt(0).toUpperCase() ?? '?'}
            </div>
            <div className="overflow-hidden">
              <div className="text-[13px] font-semibold text-[#0A0A0A] truncate">{user.fullName}</div>
              <div className="text-[10px] font-semibold text-[#6B6B6B] uppercase tracking-wider">Admin</div>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}

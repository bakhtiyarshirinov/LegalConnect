import React from 'react'
import { useAuthStore } from '../../store/authStore'
import { Button } from '../ui/Button'
import { useNavigate } from 'react-router-dom'
import { Scale, LogOut, User } from 'lucide-react'

export const Navbar: React.FC = () => {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-white border-b border-[#F0F0F0] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between h-full px-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[#0A0A0A] rounded-lg flex items-center justify-center">
            <Scale className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-[#0A0A0A] text-sm">LegalConnect</span>
          <span className="text-[#E8E8E8] text-sm">|</span>
          <span className="text-[#6B6B6B] text-xs font-medium uppercase tracking-wider">Admin</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#F5F5F5] rounded-xl">
            <User className="w-3.5 h-3.5 text-[#6B6B6B]" />
            <span className="text-sm font-medium text-[#0A0A0A]">{user?.fullName}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  )
}

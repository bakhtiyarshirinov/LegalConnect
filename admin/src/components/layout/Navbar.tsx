import React from 'react'
import { useAuthStore } from '../../store/authStore'
import { Button } from '../ui/Button'
import { useNavigate } from 'react-router-dom'
import { Scale, LogOut, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const LANGS = ['EN', 'AZ', 'RU'] as const

export const Navbar: React.FC = () => {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const activeLang = i18n.language?.slice(0, 2).toUpperCase()

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
          <span className="text-[#6B6B6B] text-xs font-medium uppercase tracking-wider">{t('profile.admin')}</span>
        </div>
        <div className="flex items-center gap-3">
          {/* Language switcher */}
          <div style={{ display: 'flex', alignItems: 'center', background: '#F5F5F5', borderRadius: 8, padding: 3, gap: 2 }}>
            {LANGS.map((lang) => {
              const isActive = activeLang === lang
              return (
                <button
                  key={lang}
                  onClick={() => i18n.changeLanguage(lang.toLowerCase())}
                  style={{
                    padding: '4px 8px', borderRadius: 6, border: 'none', cursor: 'pointer',
                    fontSize: 11, fontWeight: 600, letterSpacing: '0.03em',
                    background: isActive ? '#0A0A0A' : 'transparent',
                    color: isActive ? '#FFFFFF' : '#6B6B6B',
                    transition: 'all 0.15s',
                  }}
                >
                  {lang}
                </button>
              )
            })}
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#F5F5F5] rounded-xl">
            <User className="w-3.5 h-3.5 text-[#6B6B6B]" />
            <span className="text-sm font-medium text-[#0A0A0A]">{user?.fullName}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="w-3.5 h-3.5" />
            {t('auth.logout')}
          </Button>
        </div>
      </div>
    </header>
  )
}

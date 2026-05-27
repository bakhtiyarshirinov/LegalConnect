import React from 'react'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'pending' | 'success' | 'danger' | 'info' | 'admin' | 'client' | 'lawyer'
  className?: string
}

const variants = {
  default: 'bg-[#F5F5F5] text-[#6B6B6B]',
  pending: 'bg-amber-50 text-amber-700 border border-amber-200',
  success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  danger: 'bg-red-50 text-red-700 border border-red-200',
  info: 'bg-blue-50 text-blue-700 border border-blue-200',
  admin: 'bg-purple-50 text-purple-700 border border-purple-200',
  client: 'bg-sky-50 text-sky-700 border border-sky-200',
  lawyer: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', className = '' }) => {
  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
        ${variants[variant]} ${className}
      `}
    >
      {children}
    </span>
  )
}

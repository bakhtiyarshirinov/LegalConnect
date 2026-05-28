import React from 'react'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'pending' | 'success' | 'danger' | 'info' | 'admin' | 'client' | 'lawyer'
  className?: string
}

const variants = {
  default: 'bg-[#F5F5F5] text-[#6B6B6B] border border-[#F0F0F0]',
  pending: 'bg-[#FFF9DB] text-[#E67700] border border-[#FFE066]',
  success: 'bg-[#EBFBEE] text-[#2F9E44] border border-[#B2F2BB]',
  danger: 'bg-[#FFF1F0] text-[#E03131] border border-[#FFCCC7]',
  info: 'bg-[#F0F0FF] text-[#3B5BDB] border border-[#BAC8FF]',
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

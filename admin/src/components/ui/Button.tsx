import React from 'react'
import { motion } from 'framer-motion'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children: React.ReactNode
}

const variants = {
  primary: 'bg-[#0A0A0A] text-white hover:bg-[#262626]',
  secondary: 'bg-[#F5F5F5] text-[#0A0A0A] border border-[#E8E8E8] hover:bg-[#E8E8E8]',
  danger: 'bg-[#FFF1F0] text-[#E03131] border border-[#FFCCC7] hover:bg-[#FFE4E1]',
  success: 'bg-[#F0FFF4] text-[#2F9E44] border border-[#B2F2BB] hover:bg-[#DCFCE7]',
  ghost: 'text-[#6B6B6B] hover:text-[#0A0A0A] hover:bg-[#F5F5F5]',
}

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  disabled,
  className = '',
  ...props
}) => {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      className={`
        inline-flex items-center justify-center gap-2 font-medium rounded-xl
        transition-colors duration-150 select-none outline-none
        focus-visible:ring-2 focus-visible:ring-[#0A0A0A] focus-visible:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]} ${sizes[size]} ${className}
      `}
      disabled={disabled || loading}
      {...(props as React.ComponentProps<typeof motion.button>)}
    >
      {loading && (
        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      )}
      {children}
    </motion.button>
  )
}

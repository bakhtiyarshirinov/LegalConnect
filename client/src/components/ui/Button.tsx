import { motion } from 'framer-motion'
import type { ReactNode, ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children: ReactNode
  fullWidth?: boolean
}

const variantStyles: Record<string, React.CSSProperties> = {
  primary: {
    background: '#0A0A0A',
    color: '#FFFFFF',
    border: '1px solid #0A0A0A',
  },
  secondary: {
    background: '#FFFFFF',
    color: '#0A0A0A',
    border: '1px solid #E0E0E0',
  },
  ghost: {
    background: 'transparent',
    color: '#6B6B6B',
    border: '1px solid transparent',
  },
  danger: {
    background: '#FFF1F0',
    color: '#E03131',
    border: '1px solid #FFCCC7',
  },
  success: {
    background: '#F0FFF4',
    color: '#2F9E44',
    border: '1px solid #B2F2BB',
  },
}

const sizeStyles: Record<string, React.CSSProperties> = {
  sm: { padding: '6px 14px', fontSize: '12px', borderRadius: '8px' },
  md: { padding: '10px 20px', fontSize: '14px', borderRadius: '10px' },
  lg: { padding: '13px 28px', fontSize: '15px', borderRadius: '12px' },
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  fullWidth = false,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading
  return (
    <motion.button
      whileHover={isDisabled ? {} : { scale: 1.015, backgroundColor: variant === 'primary' ? '#262626' : undefined }}
      whileTap={isDisabled ? {} : { scale: 0.975 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      disabled={isDisabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        fontWeight: 600,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.55 : 1,
        fontFamily: 'Inter, sans-serif',
        transition: 'background 0.15s, color 0.15s, border-color 0.15s',
        width: fullWidth ? '100%' : undefined,
        ...variantStyles[variant],
        ...sizeStyles[size],
        ...style,
      }}
      {...(props as any)}
    >
      {loading && (
        <span
          className={variant === 'primary' ? 'spinner' : 'spinner-dark'}
          style={{ width: 14, height: 14 }}
        />
      )}
      {children}
    </motion.button>
  )
}

import { motion } from 'framer-motion'
import { type ButtonHTMLAttributes, type ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  fullWidth?: boolean
  children: ReactNode
}

const variantStyles: Record<string, React.CSSProperties> = {
  primary:   { background: '#0A0A0A', color: '#FFFFFF', border: '1px solid #0A0A0A' },
  secondary: { background: '#F5F5F5', color: '#0A0A0A', border: '1px solid #E8E8E8' },
  ghost:     { background: 'transparent', color: '#6B6B6B', border: '1px solid transparent' },
  danger:    { background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' },
  success:   { background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0' },
}

const sizeStyles: Record<string, React.CSSProperties> = {
  sm: { padding: '6px 12px', fontSize: 13 },
  md: { padding: '8px 16px', fontSize: 14 },
  lg: { padding: '12px 24px', fontSize: 15 },
}

export function Button({
  variant = 'primary', size = 'md', loading = false,
  fullWidth = false, disabled, children, style, ...props
}: ButtonProps) {
  const isDisabled = disabled || loading
  return (
    <motion.button
      whileHover={isDisabled ? {} : { scale: 1.02 }}
      whileTap={isDisabled ? {} : { scale: 0.98 }}
      {...(props as object)}
      disabled={isDisabled}
      style={{
        display: 'inline-flex', width: fullWidth ? '100%' : undefined,
        alignItems: 'center', justifyContent: 'center', gap: 6,
        borderRadius: 10, fontWeight: 500, fontFamily: 'Inter, sans-serif',
        cursor: isDisabled ? 'not-allowed' : 'pointer', opacity: isDisabled ? 0.6 : 1,
        outline: 'none', whiteSpace: 'nowrap',
        ...variantStyles[variant], ...sizeStyles[size], ...style,
      }}
    >
      {loading && (
        <span style={{ width: 14, height: 14, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
      )}
      {children}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </motion.button>
  )
}

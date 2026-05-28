import { motion } from 'framer-motion'
import { type ButtonHTMLAttributes, type ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  fullWidth?: boolean
  children: ReactNode
}

const styles: Record<string, string> = {
  primary: `
    background: #0A0A0A; color: #FFFFFF; border: 1px solid #0A0A0A;
  `,
  secondary: `
    background: #F5F5F5; color: #0A0A0A; border: 1px solid #E8E8E8;
  `,
  ghost: `
    background: transparent; color: #6B6B6B; border: 1px solid transparent;
  `,
  danger: `
    background: #FEF2F2; color: #DC2626; border: 1px solid #FECACA;
  `,
  success: `
    background: #F0FDF4; color: #16A34A; border: 1px solid #BBF7D0;
  `,
}

const sizes: Record<string, string> = {
  sm: 'padding: 6px 12px; font-size: 13px;',
  md: 'padding: 8px 16px; font-size: 14px;',
  lg: 'padding: 12px 24px; font-size: 15px;',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  children,
  style,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading

  return (
    <motion.button
      whileHover={isDisabled ? {} : { scale: 1.02 }}
      whileTap={isDisabled ? {} : { scale: 0.98 }}
      {...(props as object)}
      disabled={isDisabled}
      style={{
        display: 'inline-flex',
        width: fullWidth ? '100%' : undefined,
        alignItems: 'center',
        gap: '6px',
        borderRadius: '10px',
        fontWeight: 500,
        fontFamily: 'Inter, sans-serif',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.6 : 1,
        transition: 'background 0.15s, border-color 0.15s, color 0.15s',
        outline: 'none',
        whiteSpace: 'nowrap',
        ...Object.fromEntries(
          styles[variant]
            .split(';')
            .filter(Boolean)
            .map((s) => {
              const [k, v] = s.split(':').map((x) => x.trim())
              const camel = k.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
              return [camel, v]
            }),
        ),
        ...Object.fromEntries(
          sizes[size]
            .split(';')
            .filter(Boolean)
            .map((s) => {
              const [k, v] = s.split(':').map((x) => x.trim())
              const camel = k.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
              return [camel, v]
            }),
        ),
        ...style,
      }}
    >
      {loading && (
        <span
          style={{
            width: 14,
            height: 14,
            border: '2px solid currentColor',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.7s linear infinite',
            display: 'inline-block',
          }}
        />
      )}
      {children}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </motion.button>
  )
}

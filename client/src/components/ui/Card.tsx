import { motion } from 'framer-motion'
import type { ReactNode, HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  hover?: boolean
  padding?: number | string
}

export function Card({ children, hover = false, padding = 24, style, ...props }: CardProps) {
  const base: React.CSSProperties = {
    background: '#FFFFFF',
    border: '1px solid #E8E8E8',
    borderRadius: 12,
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    padding,
  }

  if (hover) {
    return (
      <motion.div
        whileHover={{ scale: 1.02, boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        style={{ ...base, cursor: 'pointer', ...style }}
        {...(props as any)}
      >
        {children}
      </motion.div>
    )
  }

  return (
    <div style={{ ...base, ...style }} {...props}>
      {children}
    </div>
  )
}

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
    border: '1px solid #F0F0F0',
    borderRadius: 16,
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    padding,
  }

  if (hover) {
    return (
      <motion.div
        whileHover={{ y: -2, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
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

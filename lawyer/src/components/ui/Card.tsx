import { motion } from 'framer-motion'
import { type HTMLAttributes, type ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  hover?: boolean
  padding?: string | number
}

export function Card({ children, hover = false, padding = 24, style, ...props }: CardProps) {
  return (
    <motion.div
      whileHover={hover ? { scale: 1.01, boxShadow: '0 4px 16px rgba(0,0,0,0.10)' } : {}}
      transition={{ duration: 0.15 }}
      style={{
        background: '#FFFFFF',
        border: '1px solid #E8E8E8',
        borderRadius: 12,
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        padding,
        ...style,
      }}
      {...(props as object)}
    >
      {children}
    </motion.div>
  )
}

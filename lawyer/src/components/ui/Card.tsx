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
      whileHover={hover ? { y: -2, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' } : {}}
      transition={{ duration: 0.15 }}
      style={{
        background: '#FFFFFF',
        border: '1px solid #F0F0F0',
        borderRadius: 16,
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        padding,
        ...style,
      }}
      {...(props as object)}
    >
      {children}
    </motion.div>
  )
}

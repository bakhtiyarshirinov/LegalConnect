import React from 'react'
import { motion } from 'framer-motion'

interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  padding?: 'sm' | 'md' | 'lg'
}

const paddings = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hover = false,
  padding = 'md',
}) => {
  return (
    <motion.div
      className={`
        bg-white border border-[#F0F0F0] rounded-2xl
        shadow-[0_1px_3px_rgba(0,0,0,0.06)]
        ${paddings[padding]}
        ${hover ? 'hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-shadow duration-200 cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </motion.div>
  )
}

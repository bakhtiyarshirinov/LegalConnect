import { motion, AnimatePresence } from 'framer-motion'
import type { ReactNode } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  width?: number
}

export function Modal({ open, onClose, title, children, width = 520 }: ModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.4)',
              backdropFilter: 'blur(6px)',
              zIndex: 100,
            }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width,
              maxWidth: 'calc(100vw - 32px)',
              background: '#FFFFFF',
              border: '1px solid #E8E8E8',
              borderRadius: 16,
              padding: 28,
              zIndex: 101,
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            }}
          >
            {title && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 24,
                  paddingBottom: 20,
                  borderBottom: '1px solid #E8E8E8',
                }}
              >
                <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0A0A0A' }}>{title}</h2>
                <button
                  onClick={onClose}
                  style={{
                    background: '#F5F5F5',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#6B6B6B',
                    padding: '6px',
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'background 0.15s, color 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLButtonElement
                    el.style.background = '#E8E8E8'
                    el.style.color = '#0A0A0A'
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLButtonElement
                    el.style.background = '#F5F5F5'
                    el.style.color = '#6B6B6B'
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            )}
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

import { createPortal } from 'react-dom'
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
  const modal = (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 99999, padding: 20,
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 12 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#FFFFFF', borderRadius: 20, padding: 32,
              width: '100%', maxWidth: width, maxHeight: '90vh', overflowY: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.18)', position: 'relative',
            }}
          >
            {title && (
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid #F0F0F0',
              }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0A0A0A' }}>{title}</h2>
                <button
                  onClick={onClose}
                  style={{
                    background: '#F5F5F5', border: 'none', cursor: 'pointer',
                    color: '#6B6B6B', padding: '6px', borderRadius: 8,
                    display: 'flex', alignItems: 'center', transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#E8E8E8' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#F5F5F5' }}
                >
                  <X size={16} />
                </button>
              </div>
            )}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
  return createPortal(modal, document.body)
}

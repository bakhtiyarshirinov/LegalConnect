import { type InputHTMLAttributes, type TextareaHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, style, onFocus, onBlur, ...props }, ref) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && <label style={{ fontSize: 13, fontWeight: 500, color: '#0A0A0A' }}>{label}</label>}
      <input
        ref={ref}
        style={{
          padding: '10px 14px', borderRadius: 10,
          border: `1px solid ${error ? '#FECACA' : '#E8E8E8'}`,
          background: '#FFFFFF', fontSize: 14, color: '#0A0A0A',
          outline: 'none', transition: 'border-color 0.15s', width: '100%',
          fontFamily: 'Inter, sans-serif',
          ...style,
        }}
        onFocus={(e) => { e.currentTarget.style.borderColor = '#0A0A0A'; onFocus?.(e) }}
        onBlur={(e) => { e.currentTarget.style.borderColor = error ? '#FECACA' : '#E8E8E8'; onBlur?.(e) }}
        {...props}
      />
      {error && <span style={{ fontSize: 12, color: '#DC2626' }}>{error}</span>}
    </div>
  ),
)
Input.displayName = 'Input'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, style, onFocus, onBlur, ...props }, ref) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && <label style={{ fontSize: 13, fontWeight: 500, color: '#0A0A0A' }}>{label}</label>}
      <textarea
        ref={ref}
        style={{
          padding: '10px 14px', borderRadius: 10,
          border: `1px solid ${error ? '#FECACA' : '#E8E8E8'}`,
          background: '#FFFFFF', fontSize: 14, color: '#0A0A0A',
          outline: 'none', resize: 'vertical', minHeight: 100,
          transition: 'border-color 0.15s', width: '100%',
          fontFamily: 'Inter, sans-serif',
          ...style,
        }}
        onFocus={(e) => { e.currentTarget.style.borderColor = '#0A0A0A'; onFocus?.(e) }}
        onBlur={(e) => { e.currentTarget.style.borderColor = error ? '#FECACA' : '#E8E8E8'; onBlur?.(e) }}
        {...props}
      />
      {error && <span style={{ fontSize: 12, color: '#DC2626' }}>{error}</span>}
    </div>
  ),
)
Textarea.displayName = 'Textarea'

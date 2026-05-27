import { forwardRef, type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, style, ...props }, ref) => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {label && (
          <label
            style={{ fontSize: 13, color: '#0A0A0A', fontWeight: 500, display: 'block' }}
          >
            {label}
          </label>
        )}
        <div style={{ position: 'relative' }}>
          {icon && (
            <span
              style={{
                position: 'absolute',
                left: 14,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#A3A3A3',
                display: 'flex',
                alignItems: 'center',
                pointerEvents: 'none',
              }}
            >
              {icon}
            </span>
          )}
          <input
            ref={ref}
            style={{
              background: '#FFFFFF',
              border: `1px solid ${error ? '#fca5a5' : '#E8E8E8'}`,
              borderRadius: 10,
              padding: icon ? '11px 14px 11px 42px' : '11px 14px',
              color: '#0A0A0A',
              fontSize: 14,
              width: '100%',
              outline: 'none',
              transition: 'border-color 0.15s, box-shadow 0.15s',
              fontFamily: 'Inter, sans-serif',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
              ...style,
            }}
            onFocus={(e) => {
              e.target.style.borderColor = error ? '#ef4444' : '#0A0A0A'
              e.target.style.boxShadow = '0 0 0 3px rgba(10,10,10,0.06)'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = error ? '#fca5a5' : '#E8E8E8'
              e.target.style.boxShadow = '0 1px 2px rgba(0,0,0,0.04)'
            }}
            {...props}
          />
        </div>
        {error && (
          <span style={{ fontSize: 12, color: '#ef4444' }}>{error}</span>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

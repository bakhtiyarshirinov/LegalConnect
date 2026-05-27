import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
}

export const Input: React.FC<InputProps> = ({ label, error, icon, className = '', ...props }) => {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-[#0A0A0A]">{label}</label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6B6B]">
            {icon}
          </div>
        )}
        <input
          className={`
            w-full border border-[#E8E8E8] rounded-xl bg-white text-[#0A0A0A]
            placeholder:text-[#6B6B6B] text-sm py-2.5 outline-none
            focus:border-[#0A0A0A] focus:ring-2 focus:ring-[#0A0A0A]/10
            transition-all duration-150
            ${icon ? 'pl-10 pr-4' : 'px-4'}
            ${error ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

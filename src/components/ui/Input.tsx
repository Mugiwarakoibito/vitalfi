import { cn } from '@/lib/utils'
import { forwardRef } from 'react'
import type { InputHTMLAttributes, ReactNode } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, ...props }, ref) => {
    if (icon) {
      return (
        <div className="w-full">
          {label && (
            <label className="mb-2 block text-[11px] font-bold text-gray-400 uppercase tracking-[0.15em]">
              {label}
            </label>
          )}
          <div className={cn(
            'flex items-center gap-3 bg-black/60 backdrop-blur-[12px] border border-white/5 rounded-xl px-4 py-3.5 transition-all duration-200',
            'hover:border-white/10 focus-within:border-white/10 focus-within:bg-black/50',
            error && 'border-error/50 focus-within:border-error/70'
          )}>
            <span className="text-[#A78BFA] shrink-0">{icon}</span>
            <input
              ref={ref}
              className={cn(
                'flex-1 bg-transparent text-[13px] text-white placeholder-slate-400 outline-none min-w-0',
                className
              )}
              {...props}
            />
          </div>
          {error && <p className="mt-1 text-xs text-error-light">{error}</p>}
        </div>
      )
    }

    return (
      <div className="w-full">
        {label && (
          <label className="mb-2 block text-[11px] font-bold text-gray-400 uppercase tracking-[0.15em]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            'glass-input w-full',
            error && 'border-error/50 focus:border-error/70',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-error-light">{error}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'

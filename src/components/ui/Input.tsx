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
    return (
      <div className="w-full">
        {label && (
          <label className="mb-1.5 block text-sm font-medium text-muted">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center" style={{ minWidth: '20px' }}>
              <span style={{ color: '#8B5CF6', fontSize: '18px', display: 'flex' }}>
                {icon}
              </span>
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              'glass-input w-full',
              icon && 'pl-11',
              error && 'border-error/50 focus:border-error/70',
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="mt-1 text-xs text-error-light">{error}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'

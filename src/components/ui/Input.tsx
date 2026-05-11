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
            <div className="absolute left-3 top-0 bottom-0 flex items-center pointer-events-none z-20" style={{ color: 'white' }}>
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              'glass-input w-full',
              icon && 'pl-10',
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

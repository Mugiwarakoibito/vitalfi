import { cn } from '@/lib/utils'
import { forwardRef } from 'react'
import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="mb-1.5 block text-sm font-medium text-muted">
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

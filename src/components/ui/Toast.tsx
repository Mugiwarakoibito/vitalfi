import { useToast } from '@/hooks/useToast'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

const icons = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertCircle,
}

const styles = {
  info: 'border-primary/20 bg-primary/5 text-primary-light',
  success: 'border-success/20 bg-success/5 text-success-light',
  warning: 'border-warning/20 bg-warning/5 text-warning-light',
  error: 'border-error/20 bg-error/5 text-error-light',
}

export function ToastContainer() {
  const { toasts, removeToast } = useToast()

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
      {toasts.map((toast) => {
        const Icon = icons[toast.type]
        return (
          <div
            key={toast.id}
            className={cn(
              'glass-card flex items-center gap-3 px-4 py-3 pr-3 min-w-[280px] max-w-sm animate-slide-up',
              styles[toast.type]
            )}
          >
            <Icon size={18} />
            <span className="flex-1 text-sm font-medium">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="rounded-md p-1 hover:bg-white/[0.08] transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}

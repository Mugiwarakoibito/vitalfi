import { createContext, useContext, useCallback, useState, useRef } from 'react'
import type { Toast } from '@/types'

interface ToastContextType {
  toasts: Toast[]
  addToast: (message: string, type?: Toast['type'], duration?: number) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const idCounter = useRef(0)

  const addToast = useCallback(
    (message: string, type: Toast['type'] = 'info', duration = 4000) => {
      const id = `toast-${++idCounter.current}`
      const toast: Toast = { id, message, type, duration }
      setToasts((prev) => [...prev, toast])

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, duration)
    },
    []
  )

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

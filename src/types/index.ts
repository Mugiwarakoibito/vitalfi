export interface User {
  id: string
  email: string
  name: string
  currency: string
  country: string
  fitnessGoals: string[]
  createdAt: string
}

export type ToastType = 'info' | 'success' | 'warning' | 'error'

export interface Toast {
  id: string
  message: string
  type: ToastType
  duration?: number
}

export type NavItem = {
  label: string
  path: string
  icon: string
}

export type ThemeColor = 'primary' | 'accent' | 'success' | 'warning' | 'error'

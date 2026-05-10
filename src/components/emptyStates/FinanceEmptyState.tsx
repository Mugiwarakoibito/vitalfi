import { motion } from 'framer-motion'
import { Wallet, Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface FinanceEmptyStateProps {
  onAddAccount?: () => void
}

export function FinanceEmptyState({ onAddAccount }: FinanceEmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
        <div className="relative glass-card p-6 rounded-2xl">
          <Wallet className="w-10 h-10 text-primary-light" />
        </div>
      </div>
      <h3 className="text-xl font-bold text-white mb-2">No Accounts Yet</h3>
      <p className="text-muted max-w-sm mb-6">
        Create your first account to start tracking your finances. Add a checking, savings, or credit card account.
      </p>
      <div className="flex gap-3 flex-wrap justify-center">
        <Button variant="primary" size="sm" onClick={onAddAccount}>
          <Plus size={16} /> Add Account
        </Button>
      </div>
    </motion.div>
  )
}

export function AccountsEmptyState() {
  return (
    <div className="flex flex-col items-center py-12 text-center">
      <Wallet className="w-12 h-12 text-primary/40 mb-4" />
      <p className="text-muted font-medium">No accounts yet</p>
      <p className="text-xs text-muted/60 mt-1">Create your first account to get started</p>
    </div>
  )
}

export function TransactionsEmptyState() {
  return (
    <div className="flex flex-col items-center py-12 text-center">
      <div className="w-12 h-12 rounded-full bg-white/[0.04] flex items-center justify-center mb-4">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary/40">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" strokeLinecap="round" />
        </svg>
      </div>
      <p className="text-muted font-medium">No transactions yet</p>
      <p className="text-xs text-muted/60 mt-1">Add a transaction using the form above or press N</p>
    </div>
  )
}

export function BudgetsEmptyState() {
  return (
    <div className="flex flex-col items-center py-12 text-center">
      <div className="w-12 h-12 rounded-full bg-white/[0.04] flex items-center justify-center mb-4">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary/40">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" strokeLinecap="round" />
        </svg>
      </div>
      <p className="text-muted font-medium">No budgets set</p>
      <p className="text-xs text-muted/60 mt-1">Create budget envelopes to track your spending</p>
    </div>
  )
}

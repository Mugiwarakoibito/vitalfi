import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import type { Account } from '@/lib/storage'
import { generateId } from '@/lib/utils'

const ACCOUNT_TYPES: { value: Account['type']; label: string }[] = [
  { value: 'checking', label: 'Checking' },
  { value: 'savings', label: 'Savings' },
  { value: 'credit', label: 'Credit Card' },
  { value: 'investment', label: 'Investment' },
  { value: 'cash', label: 'Cash' },
]

const ACCOUNT_COLORS = [
  '#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
  '#EC4899', '#06B6D4', '#A78BFA', '#22C55E', '#F97316',
]

interface AccountFormProps {
  isOpen: boolean
  onClose: () => void
  onSave: (account: Account) => void
  account?: Account | null
}

export function AccountForm({ isOpen, onClose, onSave, account }: AccountFormProps) {
  const [name, setName] = useState(account?.name || '')
  const [balance, setBalance] = useState(account?.balance.toString() || '')
  const [type, setType] = useState<Account['type']>(account?.type || 'checking')
  const [color, setColor] = useState(account?.color || ACCOUNT_COLORS[0])
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!name.trim()) newErrors.name = 'Account name is required'
    if (isNaN(parseFloat(balance))) newErrors.balance = 'Enter a valid balance'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    const accountData: Account = {
      id: account?.id || generateId(),
      name: name.trim(),
      type,
      balance: parseFloat(balance),
      currency: 'USD',
      color,
      isArchived: account?.isArchived || false,
      createdAt: account?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    onSave(accountData)
    resetForm()
    onClose()
  }

   const resetForm = () => {
     setName('')
     setBalance('')
     setType('checking')
     setColor(ACCOUNT_COLORS[0])
     setErrors({})
   }

  const accountExamples = ['Chase Checking', 'Bank of America Savings', 'Chase Sapphire Card', 'Fidelity Investment', 'Cash Wallet']

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={account ? 'Edit Account' : 'New Account'}
      className="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Account Name"
          placeholder={accountExamples[Math.floor(Math.random() * accountExamples.length)]}
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
        />

        <Input
          label="Current Balance"
          type="number"
          step="0.01"
          placeholder="0.00"
          value={balance}
          onChange={(e) => setBalance(e.target.value)}
          error={errors.balance}
        />

        <div>
          <label className="mb-1.5 block text-sm font-medium text-muted">Account Type</label>
          <div className="grid grid-cols-2 gap-2">
            {ACCOUNT_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setType(t.value)}
                className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  type === t.value
                    ? 'border-primary/50 bg-primary/15 text-primary-light'
                    : 'border-white/[0.08] bg-white/[0.03] text-muted hover:border-white/[0.12] hover:bg-white/[0.06]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-muted">Color</label>
          <div className="flex flex-wrap gap-2">
            {ACCOUNT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`h-8 w-8 rounded-full border-2 transition-all duration-200 ${
                  color === c ? 'border-white scale-110' : 'border-transparent hover:scale-105'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" variant="primary" className="flex-1">
            {account ? 'Update' : 'Create'} Account
          </Button>
        </div>
      </form>
    </Modal>
  )
}

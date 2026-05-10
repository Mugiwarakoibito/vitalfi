import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import type { Transaction as DBTransaction } from '@/lib/storage'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/lib/categories'
import { generateId } from '@/lib/utils'
import { useAppStore } from '@/store/useAppStore'

interface TransactionFormProps {
  isOpen: boolean
  onClose: () => void
  onSave: (transaction: DBTransaction | DBTransaction[]) => void
  accounts: { id: string; name: string }[]
  transaction?: DBTransaction | null
}

export function TransactionForm({ isOpen, onClose, onSave, accounts, transaction }: TransactionFormProps) {
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [type, setType] = useState<'income' | 'expense' | 'transfer'>('expense')
  const [category, setCategory] = useState('')
  const [subcategory, setSubcategory] = useState('')
  const [accountId, setAccountId] = useState('')
  const [date, setDate] = useState('')
  const [toAccountId, setToAccountId] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { addTransaction } = useAppStore()

  useEffect(() => {
    setCategory('')
    setSubcategory('')
  }, [type])

  useEffect(() => {
    if (transaction) {
      setDescription(transaction.description)
      setAmount(transaction.amount.toString())
      setType(transaction.type)
      setCategory(transaction.category)
      setSubcategory('')
      setAccountId(transaction.accountId)
      setDate(transaction.date)
    } else {
      resetForm()
    }
  }, [transaction, isOpen])

  const categories = type === 'income' 
    ? INCOME_CATEGORIES 
    : type === 'transfer' 
      ? [] 
      : EXPENSE_CATEGORIES

  const selectedCategory = categories.find((c) => c.name === category || c.id === category)

  const resetForm = () => {
    setDescription('')
    setAmount('')
    setType('expense')
    setCategory('')
    setSubcategory('')
    setAccountId(accounts[0]?.id || '')
    setDate(new Date().toISOString().split('T')[0])
    setErrors({})
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!amount || isNaN(parseFloat(amount))) newErrors.amount = 'Valid amount required'
    if (!accountId) newErrors.accountId = 'Select an account'
    if (type === 'transfer' && !toAccountId) newErrors.toAccountId = 'Select destination account'
    if (type !== 'transfer' && !category) newErrors.category = 'Category is required'
    if (!date) newErrors.date = 'Date is required'
    if (type === 'transfer' && accountId === toAccountId) newErrors.toAccountId = 'Cannot transfer to same account'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    if (type === 'transfer') {
      const now = new Date().toISOString()
      const id = transaction?.id || generateId()
      
       const txn: DBTransaction = {
         id,
         description: description.trim() || 'Transfer',
         amount: Math.abs(parseFloat(amount)),
         type: 'transfer',
         category: 'Transfer',
         accountId,
         toAccountId,
         date,
         createdAt: transaction?.createdAt || now,
         updatedAt: now,
       }
      
      await addTransaction(txn)
      onSave(txn)
    } else {
       const txn: DBTransaction = {
         id: transaction?.id || generateId(),
         description: description.trim() || category || 'Transaction',
         amount: Math.abs(parseFloat(amount)),
         type: type as 'income' | 'expense',
         category,
         accountId,
         date,
         createdAt: transaction?.createdAt || new Date().toISOString(),
         updatedAt: new Date().toISOString(),
       }

      await addTransaction(txn)
      onSave(txn)
    }
    resetForm()
    onClose()
  }

  const expenseExamples = ['Grocery shopping', 'Coffee at cafe', 'Gas station', 'Netflix subscription', 'Electric bill', 'Restaurant dinner']
  const incomeExamples = ['Monthly salary', 'Freelance payment', 'Bonus', 'Dividend income', 'Refund', 'Gift money']
  const transferExamples = ['Transfer to savings', 'Move to checking', 'Pay credit card', 'Send to family', 'Split bills']

  const getPlaceholder = () => {
    if (type === 'expense') return expenseExamples[Math.floor(Math.random() * expenseExamples.length)]
    if (type === 'income') return incomeExamples[Math.floor(Math.random() * incomeExamples.length)]
    return transferExamples[Math.floor(Math.random() * transferExamples.length)]
  }

  const [placeholder, setPlaceholder] = useState(getPlaceholder())

  useEffect(() => {
    setPlaceholder(getPlaceholder())
  }, [type])

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={transaction ? 'Edit Transaction' : 'New Transaction'}
      className="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] p-1">
          {(['expense', 'income', 'transfer'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`flex-1 rounded-lg py-2 text-sm font-medium capitalize transition-all duration-200 ${
                type === t
                  ? t === 'income'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : t === 'expense'
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-primary/20 text-primary-light'
                  : 'text-muted hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <Input
          label="Description"
          placeholder={placeholder}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          error={errors.description}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Amount"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            error={errors.amount}
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-muted">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="glass-input w-full"
            />
            {errors.date && <p className="mt-1 text-xs text-error-light">{errors.date}</p>}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-muted">
            {type === 'transfer' ? 'From Account' : 'Account'}
          </label>
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="glass-input w-full"
          >
            <option value="">Select account</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name}
              </option>
            ))}
          </select>
          {errors.accountId && <p className="mt-1 text-xs text-error-light">{errors.accountId}</p>}
        </div>

        {type === 'transfer' && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-muted">To Account</label>
            <select
              value={toAccountId}
              onChange={(e) => setToAccountId(e.target.value)}
              className="glass-input w-full"
            >
              <option value="">Select account</option>
              {accounts.filter((acc) => acc.id !== accountId).map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>
            {errors.toAccountId && <p className="mt-1 text-xs text-error-light">{errors.toAccountId}</p>}
          </div>
        )}

        {type !== 'transfer' && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-muted">Category</label>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value)
                setSubcategory('')
              }}
              className="glass-input w-full"
            >
              <option value="">Select category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
            {errors.category && <p className="mt-1 text-xs text-error-light">{errors.category}</p>}
          </div>
        )}

        {selectedCategory && selectedCategory.subcategories.length > 0 && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-muted">Subcategory</label>
            <div className="flex flex-wrap gap-2">
              {selectedCategory.subcategories.map((sub) => (
                <button
                  key={sub}
                  type="button"
                  onClick={() => setSubcategory(sub)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                    subcategory === sub
                      ? 'border-primary/40 bg-primary/15 text-primary-light'
                      : 'border-white/[0.06] bg-white/[0.02] text-muted hover:text-white'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" variant="primary" className="flex-1">
            {transaction ? 'Update' : 'Add'} Transaction
          </Button>
        </div>
      </form>
    </Modal>
  )
}

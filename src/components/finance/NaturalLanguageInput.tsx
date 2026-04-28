import { useState, useRef, useEffect } from 'react'
import { Wand2, Loader2, Zap } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { parseNaturalLanguage } from '@/lib/nlpParser'
import type { ParsedTransaction } from '@/types/finance'
import { cn } from '@/lib/utils'

interface NaturalLanguageInputProps {
  onParsed: (parsed: ParsedTransaction & { raw: string }) => void
  className?: string
}

export function NaturalLanguageInput({ onParsed, className }: NaturalLanguageInputProps) {
  const [input, setInput] = useState('')
  const [isParsing, setIsParsing] = useState(false)
  const [preview, setPreview] = useState<(ParsedTransaction & { raw: string }) | null>(null)
  const [showTips, setShowTips] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleParse = () => {
    if (!input.trim()) return
    setIsParsing(true)

    // Simulate a brief parsing "intelligence" effect
    setTimeout(() => {
      const result = parseNaturalLanguage(input)
      setPreview(result)
      setIsParsing(false)
    }, 400)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (preview && preview.amount > 0) {
      onParsed(preview)
      setInput('')
      setPreview(null)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (preview) {
        handleSubmit(e as unknown as React.FormEvent)
      } else {
        handleParse()
      }
    }
  }

  useEffect(() => {
    if (input.length > 3 && !preview) {
      const timer = setTimeout(() => handleParse(), 800)
      return () => clearTimeout(timer)
    }
  }, [input])

  return (
    <div className={cn('space-y-3', className)}>
      <form onSubmit={handleSubmit} className="relative">
        <Input
          ref={inputRef}
          placeholder="Try: 'Coffee at Starbucks yesterday $12.50'"
          value={input}
          onChange={(e) => {
            setInput(e.target.value)
            if (e.target.value.length < 3) setPreview(null)
          }}
          onKeyDown={handleKeyDown}
          icon={<Wand2 size={18} className={isParsing ? 'animate-pulse text-primary-light' : 'text-muted'} />}
          className="pr-24"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setShowTips(!showTips)}
            className="text-muted hover:text-white"
          >
            <Zap size={14} />
          </Button>
        </div>
      </form>

      {isParsing && (
        <div className="flex items-center gap-2 text-sm text-muted animate-pulse">
          <Loader2 size={14} className="animate-spin" />
          Parsing...
        </div>
      )}

      {preview && !isParsing && preview.amount > 0 && (
        <div className="glass-card p-4 rounded-xl border border-primary/20 bg-primary/[0.04]">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-primary-light uppercase tracking-wide">Detected</p>
            <span className="text-xs text-muted">
              {Math.round(preview.confidence * 100)}% confidence
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">{preview.description}</p>
              <p className="text-sm text-muted">
                {preview.category}
                {preview.subcategory && ` • ${preview.subcategory}`}
                {' • '}
                {preview.date === new Date().toISOString().split('T')[0]
                  ? 'Today'
                  : new Date(preview.date || '').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </p>
            </div>
            <p className={`text-lg font-bold ${preview.type === 'income' ? 'text-emerald-400' : 'text-white'}`}>
              {preview.type === 'income' ? '+' : ''}${preview.amount.toFixed(2)}
            </p>
          </div>
          <Button
            size="sm"
            variant="primary"
            onClick={() => onParsed(preview)}
            className="mt-3 w-full"
          >
            Add Transaction
          </Button>
        </div>
      )}

      {showTips && (
        <div className="text-xs text-muted space-y-1 glass-card p-3 rounded-lg">
          <p className="font-medium text-white/80">Try these patterns:</p>
          <p>• &quot;Coffee at Starbucks yesterday $5.50&quot;</p>
          <p>• &quot;Grocery run at Whole Foods $120&quot;</p>
          <p>• &quot;Monthly salary deposit $4500&quot;</p>
          <p>• &quot;Uber ride to airport $45.60&quot;</p>
          <p>• &quot;Gym membership $29.99&quot;</p>
        </div>
      )}
    </div>
  )
}

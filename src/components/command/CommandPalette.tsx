import { useEffect, useRef, useMemo } from 'react'
import { cn } from '@/lib/utils'
import type { CommandAction } from '@/hooks/useCommandPalette'
import { Command as CompCommand, Sparkles, Plus } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { parseActivityNLP } from '@/lib/nlpActivity'
import { useAppStore } from '@/store/useAppStore'

interface CommandPaletteProps {
  actions: CommandAction[]
  query: string
  setQuery: (q: string) => void
  selectedIndex: number
  setSelectedIndex: (i: number) => void
  filtered: CommandAction[]
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

export function CommandPalette({
  actions: _actions,
  query,
  setQuery,
  selectedIndex,
  setSelectedIndex,
  filtered,
  isOpen,
  setIsOpen,
}: CommandPaletteProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const executeActivity = useAppStore(state => state.executeActivity)

  const nlpResult = useMemo(() => {
    if (!query || query.length < 3) return null
    const result = parseActivityNLP(query)
    return result.confidence > 0.6 ? result : null
  }, [query])

  const handleExecuteNLP = async () => {
    if (nlpResult) {
      await executeActivity(nlpResult)
      setIsOpen(false)
      setQuery('')
    }
  }

  useEffect(() => {
    // ... rest of useEffect
  }, [setIsOpen, setQuery])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const total = filtered.length + (nlpResult ? 1 : 0)
      setSelectedIndex((selectedIndex + 1) % total)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const total = filtered.length + (nlpResult ? 1 : 0)
      setSelectedIndex((selectedIndex - 1 + total) % total)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (nlpResult && selectedIndex === 0) {
        handleExecuteNLP()
        return
      }
      
      const action = filtered[nlpResult ? selectedIndex - 1 : selectedIndex]
      if (action) {
        setIsOpen(false)
        setQuery('')
        action.perform()
      }
    }
  }

  const byCategory = filtered.reduce<Record<string, CommandAction[]>>((acc, a) => {
    if (!acc[a.category]) acc[a.category] = []
    acc[a.category].push(a)
    return acc
  }, {})

  const categories = Object.keys(byCategory)

  return (
    <Modal isOpen={isOpen} onClose={() => { setIsOpen(false); setQuery('') }} className="!p-0 !max-w-lg">
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <CompCommand size={20} className="text-indigo-400" />
          <input
            ref={inputRef}
            className="flex-1 bg-transparent text-white text-base outline-none placeholder-slate-500 font-outfit"
            placeholder="Search commands or type to log (e.g. 'Morning run 5k')"
            value={query}
            onChange={(e) => {
                setQuery(e.target.value)
                setSelectedIndex(0)
            }}
            onKeyDown={handleKeyDown}
          />
          <kbd className="text-[10px] bg-white/5 px-2 py-1 rounded-md text-slate-500 font-mono">
            ESC
          </kbd>
        </div>
      </div>
      
      <div className="max-h-[400px] overflow-auto scrollbar-none p-2 space-y-4">
        {nlpResult && (
          <div className="px-2">
            <button
              onClick={handleExecuteNLP}
              onMouseEnter={() => setSelectedIndex(0)}
              className={cn(
                'w-full flex items-center justify-between rounded-xl px-4 py-3 text-left transition-all duration-300',
                selectedIndex === 0
                  ? 'bg-indigo-500/10 text-indigo-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] border border-indigo-500/20'
                  : 'text-slate-400 border border-transparent'
              )}
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-indigo-500/20">
                  <Sparkles size={16} className="text-indigo-400" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-indigo-400/80">Smart Log</p>
                  <p className="text-sm font-medium text-white">Log {nlpResult.type}: {nlpResult.name}</p>
                </div>
              </div>
              <Plus size={18} className="opacity-50" />
            </button>
          </div>
        )}

        {filtered.length === 0 && !nlpResult && (
          <div className="text-center py-12">
            <p className="text-sm text-slate-500">No matching commands.</p>
          </div>
        )}

        {categories.map((cat) => (
          <div key={cat} className="space-y-1">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] px-4 py-2">
              {cat}
            </p>
            {byCategory[cat].map((action, index) => {
              const baseIndex = nlpResult ? 1 : 0
              const flatIndex = baseIndex + categories
                .slice(0, categories.indexOf(cat))
                .reduce((sum, c) => sum + byCategory[c].length, 0) + index
              const isSelected = flatIndex === selectedIndex
              return (
                <button
                  key={action.id}
                  onClick={() => {
                    setIsOpen(false)
                    setQuery('')
                    action.perform()
                  }}
                  onMouseEnter={() => setSelectedIndex(flatIndex)}
                  className={cn(
                    'w-full flex items-center justify-between rounded-xl px-4 py-2.5 text-left text-sm transition-all duration-300',
                    isSelected
                      ? 'bg-white/5 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]'
                      : 'text-slate-400 hover:text-slate-200'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className={cn("w-1.5 h-1.5 rounded-full transition-all duration-500", isSelected ? "bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.5)]" : "bg-transparent")} />
                    {action.title}
                  </div>
                  {action.shortcut && (
                    <kbd className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-slate-500 font-mono">
                      {action.shortcut}
                    </kbd>
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </Modal>
  )
}


import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import type { CommandAction } from '@/hooks/useCommandPalette'
import { Command as CompCommand } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(true)
      }
      if (e.key === 'Escape') {
        setIsOpen(false)
        setQuery('')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [setIsOpen, setQuery])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((selectedIndex + 1) % filtered.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((selectedIndex - 1 + filtered.length) % filtered.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const action = filtered[selectedIndex]
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
      <div className="p-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2 text-muted">
          <CompCommand size={16} />
          <input
            ref={inputRef}
            className="flex-1 bg-transparent text-white text-sm outline-none placeholder-muted-dark"
            placeholder="Search commands..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <span className="text-[10px] bg-white/[0.06] px-1.5 py-0.5 rounded text-muted hidden sm:inline">
            ESC
          </span>
        </div>
      </div>
      <div className="max-h-[320px] overflow-auto scrollbar-thin p-2">
        {filtered.length === 0 && (
          <p className="text-center text-sm text-muted py-6">No results found.</p>
        )}
        {categories.map((cat) => (
          <div key={cat} className="mb-2">
            <p className="text-[10px] text-muted uppercase tracking-wider px-2 mb-1">
              {cat}
            </p>
            {byCategory[cat].map((action, index) => {
              const flatIndex = categories
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
                    'w-full flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors',
                    isSelected
                      ? 'bg-primary/15 text-primary-light'
                      : 'text-white hover:bg-white/[0.04]'
                  )}
                >
                  <span>{action.title}</span>
                  {action.shortcut && (
                    <kbd className="text-[10px] bg-white/[0.06] px-1.5 py-0.5 rounded text-muted">
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

import { Bell, Search, Menu } from 'lucide-react'
import { useState } from 'react'

interface HeaderProps {
  onMenuToggle: () => void
}

export function Header({ onMenuToggle }: HeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false)

  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-background/80 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuToggle}
            className="rounded-xl p-2 text-muted hover:bg-white/[0.06] hover:text-white transition-colors md:hidden"
          >
            <Menu size={20} />
          </button>
          <h1 className="text-base font-semibold text-white md:text-lg">VitalFi</h1>
        </div>

        <div className="flex items-center gap-2">
          <div className={
            searchOpen
              ? 'flex items-center gap-2'
              : 'hidden md:flex items-center gap-2'
          }>
            <div className="glass-input flex items-center gap-2 px-3 py-2 w-48 md:w-64">
              <Search size={16} className="text-muted-dark" />
              <input
                type="text"
                placeholder="Search..."
                className="bg-transparent text-sm text-white placeholder-muted-dark outline-none w-full"
              />
            </div>
          </div>

          <button
            className="relative rounded-xl p-2 text-muted hover:bg-white/[0.06] hover:text-white transition-colors"
            onClick={() => setSearchOpen(!searchOpen)}
          >
            <Search size={18} className="md:hidden" />
          </button>

          <button className="relative rounded-xl p-2 text-muted hover:bg-white/[0.06] hover:text-white transition-colors">
            <Bell size={18} />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-error" />
          </button>

          <div className="ml-1 h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary-light">
            U
          </div>
        </div>
      </div>
    </header>
  )
}

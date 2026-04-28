import { useState } from 'react'
import { Tags, ChevronDown, ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { ALL_CATEGORIES } from '@/lib/categories'

interface CategoryManagerProps {
  selectedCategory: string
  onSelect: (category: string) => void
}

export function CategoryManager({ selectedCategory, onSelect }: CategoryManagerProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  const toggleExpand = (id: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <Tags size={18} className="text-muted" />
        <h3 className="text-sm font-medium text-white">Categories</h3>
      </div>

      {ALL_CATEGORIES.map((cat) => {
        const isExpanded = expandedCategories.has(cat.id)
        const isSelected = selectedCategory === cat.name

        return (
          <Card key={cat.id} padding="none" className="overflow-hidden">
            <button
              onClick={() => onSelect(cat.name)}
              className={`flex w-full items-center gap-3 p-3 text-left transition-colors ${
                isSelected ? 'bg-primary/[0.06]' : 'hover:bg-white/[0.02]'
              }`}
            >
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold"
                style={{ backgroundColor: `${cat.color}18`, color: cat.color }}
              >
                {cat.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${isSelected ? 'text-primary-light' : 'text-white'}`}>
                  {cat.name}
                </p>
                <p className="text-xs text-muted">
                  {cat.subcategories.length} subcategories
                </p>
              </div>
              {cat.subcategories.length > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleExpand(cat.id)
                  }}
                  className="p-1 text-muted hover:text-white"
                >
                  {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
              )}
            </button>

            {isExpanded && cat.subcategories.length > 0 && (
              <div className="border-t border-white/[0.04] px-3 py-2 space-y-1">
                {cat.subcategories.map((sub) => (
                  <button
                    key={sub}
                    onClick={() => onSelect(cat.name)}
                    className={`block w-full rounded-lg px-3 py-1.5 text-left text-sm text-muted hover:text-white hover:bg-white/[0.04] transition-colors ${
                      isSelected ? 'bg-primary/[0.04] text-primary-light/80' : ''
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            )}
          </Card>
        )
      })}
    </div>
  )
}

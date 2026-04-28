import { useState, useMemo, useEffect } from 'react'

export interface CommandAction {
  id: string
  title: string
  shortcut?: string
  icon?: string
  category: string
  perform: () => void
}

export function useCommandPalette(actions: CommandAction[]) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)

  const filtered = useMemo(() => {
    if (!query.trim()) return actions
    const q = query.toLowerCase()
    return actions.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q)
    )
  }, [actions, query])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  return {
    query,
    setQuery,
    selectedIndex,
    setSelectedIndex,
    filtered,
  }
}

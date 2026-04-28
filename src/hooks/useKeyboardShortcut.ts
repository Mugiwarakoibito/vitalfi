import { useEffect, useCallback } from 'react'

export function useKeyboardShortcut(
  key: string,
  callback: () => void,
  options?: { ctrl?: boolean; meta?: boolean; shift?: boolean; alt?: boolean }
) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key !== key) return
      if (options?.ctrl && !event.ctrlKey) return
      if (options?.meta && !event.metaKey) return
      if (options?.shift && !event.shiftKey) return
      if (options?.alt && !event.altKey) return

      event.preventDefault()
      callback()
    },
    [key, callback, options]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

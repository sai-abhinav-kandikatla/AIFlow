import { useEffect } from 'react'

export interface ShortcutHandlers {
  onNewThread?: () => void
  onSearch?: () => void
  onSettings?: () => void
}

/**
 * Hook to listen for global keyboard shortcuts.
 * - Ctrl/Cmd + N: Create a new Flow
 * - Ctrl/Cmd + K: Focus search / navigate to Flows list
 * - Ctrl/Cmd + ,: Settings
 */
export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isModifier = event.ctrlKey || event.metaKey

      if (isModifier) {
        if (event.key.toLowerCase() === 'n') {
          if (handlers.onNewThread) {
            event.preventDefault()
            handlers.onNewThread()
          }
        } else if (event.key.toLowerCase() === 'k') {
          if (handlers.onSearch) {
            event.preventDefault()
            handlers.onSearch()
          }
        } else if (event.key === ',') {
          if (handlers.onSettings) {
            event.preventDefault()
            handlers.onSettings()
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handlers])
}

import { useEffect } from 'react'

interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  metaKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  action: () => void
  description: string
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const shortcut = shortcuts.find(s => 
        s.key.toLowerCase() === event.key.toLowerCase() &&
        !!s.ctrlKey === event.ctrlKey &&
        !!s.metaKey === event.metaKey &&
        !!s.shiftKey === event.shiftKey &&
        !!s.altKey === event.altKey
      )

      if (shortcut) {
        event.preventDefault()
        shortcut.action()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts])

  return shortcuts
}

// Global shortcuts for the application
export const globalShortcuts: KeyboardShortcut[] = [
  {
    key: 'k',
    ctrlKey: true,
    action: () => {
      // TODO: Open command palette
      console.log('Open command palette')
    },
    description: 'Open command palette'
  },
  {
    key: 'd',
    ctrlKey: true,
    action: () => {
      // TODO: Toggle dark mode
      console.log('Toggle dark mode')
    },
    description: 'Toggle dark mode'
  },
  {
    key: '1',
    ctrlKey: true,
    action: () => {
      // TODO: Navigate to dashboard
      console.log('Navigate to dashboard')
    },
    description: 'Go to Dashboard'
  },
  {
    key: '2',
    ctrlKey: true,
    action: () => {
      // TODO: Navigate to positions
      console.log('Navigate to positions')
    },
    description: 'Go to Positions'
  },
  {
    key: '3',
    ctrlKey: true,
    action: () => {
      // TODO: Navigate to optimizer
      console.log('Navigate to optimizer')
    },
    description: 'Go to Optimizer Monitor'
  },
  {
    key: '4',
    ctrlKey: true,
    action: () => {
      // TODO: Navigate to risk center
      console.log('Navigate to risk center')
    },
    description: 'Go to Risk Center'
  },
  {
    key: '5',
    ctrlKey: true,
    action: () => {
      // TODO: Navigate to execution log
      console.log('Navigate to execution log')
    },
    description: 'Go to Execution Log'
  }
]
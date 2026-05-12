import { useEffect, useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const SHORTCUT_MAP: Record<string, string> = {
  'g d': '/',
  'g l': '/log',
  'g t': '/timer',
  'g q': '/quests',
  'g p': '/profile',
  'g b': '/boss',
  'g h': '/habits',
  'g j': '/journal',
  'g a': '/achievements',
  'g i': '/insights',
  'g m': '/milestones',
  'g c': '/challenges',
  'g s': '/settings',
  'g n': '/notes',
  'g w': '/weekly',
  'g x': '/mood',
  'g r': '/review',
  'g v': '/metrics',
  'g y': '/planner',
  'g e': '/gratitude',
  'g f': '/records',
}

export const SHORTCUT_LABELS = [
  { key: 'g d', label: 'Dashboard' },
  { key: 'g l', label: 'Log Tasks' },
  { key: 'g t', label: 'Focus Timer' },
  { key: 'g q', label: 'Quests' },
  { key: 'g p', label: 'Profile' },
  { key: 'g b', label: 'Boss Battle' },
  { key: 'g h', label: 'Habits' },
  { key: 'g j', label: 'Journal' },
  { key: 'g n', label: 'Notes' },
  { key: 'g a', label: 'Achievements' },
  { key: 'g i', label: 'Insights' },
  { key: 'g m', label: 'Milestones' },
  { key: 'g c', label: 'Challenges' },
  { key: 'g s', label: 'Settings' },
  { key: 'g w', label: 'Weekly Report' },
  { key: 'g x', label: 'Mood Tracker' },
  { key: 'g r', label: 'Daily Review' },
  { key: 'g v', label: 'Body Metrics' },
  { key: 'g y', label: 'Day Planner' },
  { key: 'g e', label: 'Gratitude' },
  { key: 'g f', label: 'Trophy Room' },
  { key: '?', label: 'Show shortcuts' },
]

export function useKeyboardShortcuts() {
  const navigate = useNavigate()
  const [showHelp, setShowHelp] = useState(false)
  const [pendingKey, setPendingKey] = useState<string | null>(null)
  const [pendingTimer, setPendingTimer] = useState<ReturnType<typeof setTimeout> | null>(null)

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const tag = (e.target as HTMLElement).tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
    if (e.metaKey || e.ctrlKey || e.altKey) return

    const key = e.key.toLowerCase()

    if (key === '?') {
      setShowHelp(h => !h)
      return
    }

    if (key === 'escape') {
      setShowHelp(false)
      setPendingKey(null)
      return
    }

    if (pendingKey) {
      const combo = `${pendingKey} ${key}`
      const route = SHORTCUT_MAP[combo]
      if (route) {
        navigate(route)
        setShowHelp(false)
      }
      setPendingKey(null)
      if (pendingTimer) clearTimeout(pendingTimer)
      return
    }

    if (key === 'g') {
      setPendingKey('g')
      const timer = setTimeout(() => setPendingKey(null), 1500)
      setPendingTimer(timer)
    }
  }, [navigate, pendingKey, pendingTimer])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return { showHelp, setShowHelp, pendingKey }
}

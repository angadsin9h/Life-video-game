import { useEffect, useState } from 'react'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import KeyboardShortcutsHelp from './KeyboardShortcutsHelp'
import SearchModal from './SearchModal'

interface Props {
  children: React.ReactNode
}

export default function AppShell({ children }: Props) {
  const { showHelp, setShowHelp, pendingKey } = useKeyboardShortcuts()
  const [showSearch, setShowSearch] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setShowSearch(s => !s)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <>
      {children}
      <KeyboardShortcutsHelp
        show={showHelp}
        onClose={() => setShowHelp(false)}
        pendingKey={pendingKey}
      />
      <SearchModal show={showSearch} onClose={() => setShowSearch(false)} />
      {pendingKey && !showHelp && (
        <div className="fixed bottom-20 md:bottom-4 right-4 z-50 px-3 py-2 bg-slate-800 border border-violet-500/50 rounded-lg text-sm text-violet-300 shadow-lg animate-fade-in">
          <span className="font-mono font-bold">g</span>
          <span className="text-slate-500 mx-1">+</span>
          <span className="text-slate-400">press a letter to navigate</span>
        </div>
      )}
    </>
  )
}

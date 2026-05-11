import { useState, useEffect, useCallback, useRef, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X, Clock, Target, BookOpen, RefreshCw, Zap, LayoutDashboard } from 'lucide-react'
import axios from 'axios'

interface SearchResult {
  type: 'page' | 'task' | 'goal' | 'habit' | 'journal'
  label: string
  sub?: string
  route: string
  icon: ReactNode
}

const PAGES: SearchResult[] = [
  { type: 'page', label: 'Dashboard', route: '/', icon: <LayoutDashboard className="w-4 h-4 text-violet-400" /> as ReactNode },
  { type: 'page', label: 'Log Tasks', route: '/log', icon: <Zap className="w-4 h-4 text-yellow-400" /> as ReactNode },
  { type: 'page', label: 'Focus Timer', route: '/timer', icon: <Clock className="w-4 h-4 text-cyan-400" /> as ReactNode },
  { type: 'page', label: 'Goals', route: '/goals', icon: <Target className="w-4 h-4 text-violet-400" /> as ReactNode },
  { type: 'page', label: 'Habits', route: '/habits', icon: <RefreshCw className="w-4 h-4 text-green-400" /> as ReactNode },
  { type: 'page', label: 'Journal', route: '/journal', icon: <BookOpen className="w-4 h-4 text-cyan-400" /> as ReactNode },
]

interface Props {
  show: boolean
  onClose: () => void
}

export default function SearchModal({ show, onClose }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [selectedIdx, setSelectedIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (show) {
      setQuery('')
      setResults(PAGES)
      setSelectedIdx(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [show])

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults(PAGES); return }
    const lower = q.toLowerCase()

    const found: SearchResult[] = []

    // Pages
    PAGES.forEach(p => {
      if (p.label.toLowerCase().includes(lower)) found.push(p)
    })

    try {
      const [goalsRes, habitsRes] = await Promise.all([
        axios.get('/api/goals'),
        axios.get('/api/habits'),
      ])
      const goals = goalsRes.data as { id: number; title: string; category: string; completed: number }[]
      const habits = habitsRes.data as { id: number; title: string; category: string }[]

      goals.filter(g => g.title.toLowerCase().includes(lower) && !g.completed).forEach(g => {
        found.push({ type: 'goal', label: g.title, sub: g.category, route: '/goals', icon: <Target className="w-4 h-4 text-violet-400" /> as ReactNode })
      })
      habits.filter(h => h.title.toLowerCase().includes(lower)).forEach(h => {
        found.push({ type: 'habit', label: h.title, sub: h.category, route: '/habits', icon: <RefreshCw className="w-4 h-4 text-green-400" /> as ReactNode })
      })
    } catch { /* silently skip */ }

    setResults(found.slice(0, 8))
    setSelectedIdx(0)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => search(query), 150)
    return () => clearTimeout(timer)
  }, [query, search])

  const goTo = useCallback((result: SearchResult) => {
    navigate(result.route)
    onClose()
    setQuery('')
  }, [navigate, onClose])

  const handleKey = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, results.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter' && results[selectedIdx]) goTo(results[selectedIdx])
    else if (e.key === 'Escape') onClose()
  }, [results, selectedIdx, goTo, onClose])

  if (!show) return null

  const TYPE_LABEL: Record<string, string> = { page: 'Page', task: 'Task', goal: 'Goal', habit: 'Habit', journal: 'Journal' }

  return (
    <div className="fixed inset-0 z-[150] flex items-start justify-center pt-16 px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-slate-800 border border-slate-600 rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-700">
          <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search pages, goals, habits…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
            className="flex-1 bg-transparent text-slate-200 placeholder-slate-500 outline-none text-sm"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-slate-500 hover:text-slate-300">
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="px-1.5 py-0.5 text-xs bg-slate-700 border border-slate-600 rounded text-slate-400 flex-shrink-0">Esc</kbd>
        </div>

        {results.length > 0 && (
          <ul className="py-1 max-h-80 overflow-y-auto">
            {results.map((r, i) => (
              <li key={`${r.type}-${r.label}-${i}`}>
                <button
                  onClick={() => goTo(r)}
                  onMouseEnter={() => setSelectedIdx(i)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${i === selectedIdx ? 'bg-slate-700' : 'hover:bg-slate-700/50'}`}
                >
                  <span className="flex-shrink-0">{r.icon}</span>
                  <span className="flex-1 min-w-0">
                    <span className="text-slate-200 text-sm">{r.label}</span>
                    {r.sub && <span className="text-xs text-slate-500 ml-2">{r.sub}</span>}
                  </span>
                  <span className="text-xs text-slate-600 flex-shrink-0">{TYPE_LABEL[r.type]}</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {results.length === 0 && query && (
          <div className="px-4 py-8 text-center text-slate-500 text-sm">
            No results for "<span className="text-slate-400">{query}</span>"
          </div>
        )}

        <div className="border-t border-slate-700 px-4 py-2 flex items-center gap-4 text-xs text-slate-600">
          <span><kbd className="px-1 bg-slate-700 rounded">↑↓</kbd> navigate</span>
          <span><kbd className="px-1 bg-slate-700 rounded">↵</kbd> open</span>
          <span><kbd className="px-1 bg-slate-700 rounded">Esc</kbd> close</span>
        </div>
      </div>
    </div>
  )
}

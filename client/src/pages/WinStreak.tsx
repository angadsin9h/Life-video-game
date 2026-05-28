import { useState, useEffect } from 'react'
import { Trophy, Plus, Trash2, Flame, Star, TrendingUp, Zap, Flag } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type WinCategory = 'Professional' | 'Personal' | 'Health' | 'Financial' | 'Relationships' | 'Learning' | 'Creative'
type WinSize = 'Small' | 'Medium' | 'Big' | 'Epic'

interface Win {
  id: string
  text: string
  category: WinCategory
  size: WinSize
  date: string
  timestamp: number
}

const CATEGORIES: WinCategory[] = ['Professional', 'Personal', 'Health', 'Financial', 'Relationships', 'Learning', 'Creative']
const SIZES: WinSize[] = ['Small', 'Medium', 'Big', 'Epic']
const STORAGE_KEY = 'win_streak'

const CAT_COLORS: Record<WinCategory, string> = {
  Professional: '#3b82f6',
  Personal: '#a855f7',
  Health: '#22c55e',
  Financial: '#10b981',
  Relationships: '#ec4899',
  Learning: '#f59e0b',
  Creative: '#f97316',
}

const SIZE_STYLES: Record<WinSize, { bg: string; text: string; points: number; label: string }> = {
  Small:  { bg: '#47556920', text: '#94a3b8', points: 1,  label: 'Small' },
  Medium: { bg: '#3b82f620', text: '#60a5fa', points: 3,  label: 'Medium' },
  Big:    { bg: '#8b5cf620', text: '#c084fc', points: 5,  label: 'Big' },
  Epic:   { bg: '#ca8a0420', text: '#fbbf24', points: 10, label: 'Epic' },
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

function timeSince(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(timestamp).toLocaleDateString()
}

function getWeekStart(): string {
  const d = new Date()
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d.toISOString().split('T')[0]
}

export default function WinStreak() {
  const { toastSuccess } = useToast()
  const [wins, setWins] = useState<Win[]>([])
  const [text, setText] = useState('')
  const [category, setCategory] = useState<WinCategory>('Professional')
  const [size, setSize] = useState<WinSize>('Small')
  const [filterCat, setFilterCat] = useState<WinCategory | 'All'>('All')
  const [filterSize, setFilterSize] = useState<WinSize | 'All'>('All')
  const [epicFlash, setEpicFlash] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setWins(JSON.parse(saved))
    } catch { /**/ }
  }, [])

  const persist = (updated: Win[]) => {
    setWins(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const addWin = () => {
    if (!text.trim()) return
    const win: Win = {
      id: Date.now().toString(),
      text: text.trim(),
      category,
      size,
      date: todayStr(),
      timestamp: Date.now(),
    }
    persist([win, ...wins])
    setText('')

    if (size === 'Epic') {
      setEpicFlash(true)
      setTimeout(() => setEpicFlash(false), 1200)
      toastSuccess('EPIC WIN logged! You are on fire!', 'That one really counts.')
    } else {
      toastSuccess('Win logged! Keep that momentum going.')
    }
  }

  const deleteWin = (id: string) => {
    persist(wins.filter(w => w.id !== id))
  }

  // Filtered wins for feed
  const filtered = wins.filter(w =>
    (filterCat === 'All' || w.category === filterCat) &&
    (filterSize === 'All' || w.size === filterSize)
  )

  // Momentum Score
  const totalScore = wins.reduce((s, w) => s + SIZE_STYLES[w.size].points, 0)
  const weekStart = getWeekStart()
  const weekScore = wins
    .filter(w => w.date >= weekStart)
    .reduce((s, w) => s + SIZE_STYLES[w.size].points, 0)

  // Streak: consecutive days ending today with at least one win
  const streak = (() => {
    const days = Array.from(new Set(wins.map(w => w.date))).sort().reverse()
    if (days.length === 0) return 0
    const t = todayStr()
    if (days[0] !== t) return 0
    let count = 1
    for (let i = 1; i < days.length; i++) {
      const prev = new Date(days[i - 1] + 'T12:00:00')
      const curr = new Date(days[i] + 'T12:00:00')
      const diff = Math.round((prev.getTime() - curr.getTime()) / 86400000)
      if (diff === 1) count++
      else break
    }
    return count
  })()

  // Monthly win count by category
  const now = new Date()
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const monthWins = wins.filter(w => w.date >= monthStart)
  const catCounts = CATEGORIES.map(c => ({
    cat: c,
    count: monthWins.filter(w => w.category === c).length,
  }))
  const maxCatCount = Math.max(...catCounts.map(c => c.count), 1)

  return (
    <div
      className="space-y-6 max-w-2xl mx-auto transition-colors duration-300"
      style={epicFlash ? { background: 'radial-gradient(ellipse at center, #ca8a0415 0%, transparent 70%)' } : {}}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Trophy className="w-7 h-7 text-yellow-400" />
            Win Streak
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Log every win. Build unstoppable momentum.</p>
        </div>
        {streak > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-2 bg-orange-500/10 border border-orange-500/30 rounded-xl">
            <Flame className="w-5 h-5 text-orange-400" />
            <span className="font-bold text-orange-300" style={{ fontFamily: 'Orbitron, monospace' }}>{streak}</span>
            <span className="text-xs text-orange-400/70">day streak</span>
          </div>
        )}
      </div>

      {/* Momentum Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="game-card p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <Zap className="w-4 h-4 text-yellow-400" />
            <div className="text-xl font-bold text-yellow-400" style={{ fontFamily: 'Orbitron, monospace' }}>{totalScore}</div>
          </div>
          <div className="text-xs text-slate-500">Momentum Score</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <div className="text-xl font-bold text-green-400" style={{ fontFamily: 'Orbitron, monospace' }}>{weekScore}</div>
          </div>
          <div className="text-xs text-slate-500">This Week</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <Flag className="w-4 h-4 text-blue-400" />
            <div className="text-xl font-bold text-blue-400" style={{ fontFamily: 'Orbitron, monospace' }}>{wins.length}</div>
          </div>
          <div className="text-xs text-slate-500">Total Wins</div>
        </div>
      </div>

      {/* Quick Capture */}
      <div
        className={`game-card p-4 space-y-3 transition-all duration-500 ${epicFlash ? 'border-yellow-400/60 shadow-lg shadow-yellow-400/10' : ''}`}
        style={epicFlash ? { borderColor: '#ca8a04' } : {}}
      >
        <div className="flex gap-2">
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="What did you win today? No win is too small..."
            className="game-input flex-1"
            onKeyDown={e => e.key === 'Enter' && addWin()}
            maxLength={200}
          />
          <button
            onClick={addWin}
            disabled={!text.trim()}
            className="flex items-center gap-1.5 px-4 py-2 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-colors flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            Log
          </button>
        </div>

        {/* Category picker */}
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map(c => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className="px-2 py-1 rounded-lg text-xs transition-all"
              style={category === c
                ? { background: CAT_COLORS[c] + '30', color: CAT_COLORS[c], border: `1px solid ${CAT_COLORS[c]}` }
                : { background: '#1e293b', color: '#64748b' }}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Size picker */}
        <div className="flex gap-2">
          {SIZES.map(s => {
            const st = SIZE_STYLES[s]
            return (
              <button
                key={s}
                onClick={() => setSize(s)}
                className="flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all"
                style={size === s
                  ? { background: st.bg, color: st.text, border: `1px solid ${st.text}60` }
                  : { background: '#1e293b', color: '#475569' }}
              >
                {s === 'Epic' && <Star className="w-3 h-3 inline mr-0.5 mb-0.5" />}
                {st.label}
                <span className="opacity-60 text-[10px] ml-1">+{st.points}pt</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Filters */}
      {wins.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs text-slate-500">Filter:</span>
          <div className="flex gap-1 flex-wrap">
            <button
              onClick={() => setFilterCat('All')}
              className="px-2 py-0.5 rounded-lg text-xs transition-all"
              style={filterCat === 'All' ? { background: '#334155', color: '#e2e8f0' } : { background: '#1e293b', color: '#64748b' }}
            >
              All Categories
            </button>
            {CATEGORIES.filter(c => wins.some(w => w.category === c)).map(c => (
              <button
                key={c}
                onClick={() => setFilterCat(filterCat === c ? 'All' : c)}
                className="px-2 py-0.5 rounded-lg text-xs transition-all"
                style={filterCat === c
                  ? { background: CAT_COLORS[c] + '30', color: CAT_COLORS[c], border: `1px solid ${CAT_COLORS[c]}` }
                  : { background: '#1e293b', color: '#64748b' }}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="flex gap-1">
            {SIZES.filter(s => wins.some(w => w.size === s)).map(s => (
              <button
                key={s}
                onClick={() => setFilterSize(filterSize === s ? 'All' : s)}
                className="px-2 py-0.5 rounded-lg text-xs transition-all"
                style={filterSize === s
                  ? { background: SIZE_STYLES[s].bg, color: SIZE_STYLES[s].text, border: `1px solid ${SIZE_STYLES[s].text}60` }
                  : { background: '#1e293b', color: '#64748b' }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Win Feed */}
      {filtered.length > 0 ? (
        <div className="space-y-2">
          {filtered.map(win => {
            const st = SIZE_STYLES[win.size]
            return (
              <div
                key={win.id}
                className="game-card p-3 flex items-start gap-3"
                style={win.size === 'Epic' ? { borderColor: '#ca8a0440' } : {}}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {win.size === 'Epic'
                    ? <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    : <Trophy className="w-4 h-4" style={{ color: st.text, opacity: 0.6 }} />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-200 leading-snug">{win.text}</p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={{ background: CAT_COLORS[win.category] + '20', color: CAT_COLORS[win.category] }}
                    >
                      {win.category}
                    </span>
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                      style={{ background: st.bg, color: st.text }}
                    >
                      {win.size}
                    </span>
                    <span className="text-[10px] text-slate-600">{timeSince(win.timestamp)}</span>
                  </div>
                </div>
                <button
                  onClick={() => deleteWin(win.id)}
                  className="p-1 text-slate-700 hover:text-red-400 transition-colors flex-shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )
          })}
        </div>
      ) : wins.length === 0 ? (
        <div className="text-center py-14 text-slate-500">
          <Trophy className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="mb-1">No wins logged yet.</p>
          <p className="text-sm">Every achievement counts — start with something you did today.</p>
        </div>
      ) : (
        <div className="text-center py-10 text-slate-500 text-sm">
          No wins match the current filter.
        </div>
      )}

      {/* Monthly category chart */}
      {monthWins.length > 0 && (
        <div className="game-card p-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-400" />
            This Month by Category
          </h3>
          <div className="space-y-2">
            {catCounts.filter(c => c.count > 0).sort((a, b) => b.count - a.count).map(({ cat, count }) => (
              <div key={cat} className="flex items-center gap-3">
                <div className="text-xs text-slate-400 w-24 flex-shrink-0">{cat}</div>
                <div className="flex-1 h-5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700 flex items-center justify-end pr-2"
                    style={{
                      width: `${(count / maxCatCount) * 100}%`,
                      background: CAT_COLORS[cat] + '80',
                      minWidth: '2rem',
                    }}
                  >
                    <span className="text-[10px] font-bold" style={{ color: CAT_COLORS[cat] }}>{count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

import { useState, useEffect, useMemo } from 'react'
import { Zap, Plus, Trash2, Star, Target, CheckCircle, TrendingUp, Calendar } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

const STORAGE_KEY = 'micro_win_log'

type WinCategory = 'health' | 'productivity' | 'relationships' | 'learning' | 'mindset' | 'creativity' | 'finance' | 'habits'
type WinSize = 'tiny' | 'small' | 'medium' | 'big'

interface MicroWin {
  id: string
  date: string
  time: string
  win: string
  category: WinCategory
  size: WinSize
  feeling: 1 | 2 | 3 | 4 | 5
  compound: boolean
}

const CAT_CONFIG: Record<WinCategory, { label: string; emoji: string; color: string }> = {
  health:       { label: 'Health',       emoji: '💪', color: '#22c55e' },
  productivity: { label: 'Productivity', emoji: '⚡', color: '#3b82f6' },
  relationships:{ label: 'Relationships',emoji: '💝', color: '#ec4899' },
  learning:     { label: 'Learning',     emoji: '📚', color: '#6366f1' },
  mindset:      { label: 'Mindset',      emoji: '🧠', color: '#a855f7' },
  creativity:   { label: 'Creativity',   emoji: '🎨', color: '#f97316' },
  finance:      { label: 'Finance',      emoji: '💰', color: '#f59e0b' },
  habits:       { label: 'Habits',       emoji: '🔄', color: '#14b8a6' },
}

const SIZE_CONFIG: Record<WinSize, { emoji: string; label: string; weight: number; color: string }> = {
  tiny:   { emoji: '🔹', label: 'Tiny',   weight: 1, color: '#60a5fa' },
  small:  { emoji: '⭐', label: 'Small',  weight: 2, color: '#facc15' },
  medium: { emoji: '🏆', label: 'Medium', weight: 3, color: '#f97316' },
  big:    { emoji: '🚀', label: 'Big',    weight: 4, color: '#a855f7' },
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

function nowTime(): string {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function shiftDay(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

function calcStreak(wins: MicroWin[]): number {
  const daySet = new Set(wins.map(w => w.date))
  let streak = 0
  let cur = todayStr()
  while (daySet.has(cur)) {
    streak++
    cur = shiftDay(cur, -1)
  }
  if (streak === 0) {
    cur = shiftDay(todayStr(), -1)
    while (daySet.has(cur)) {
      streak++
      cur = shiftDay(cur, -1)
    }
  }
  return streak
}

function calcBestStreak(wins: MicroWin[]): number {
  if (wins.length === 0) return 0
  const daySet = new Set(wins.map(w => w.date))
  const sorted = [...daySet].sort()
  let best = 1
  let cur = 1
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1] + 'T12:00:00')
    const next = new Date(sorted[i] + 'T12:00:00')
    const diff = Math.round((next.getTime() - prev.getTime()) / 86400000)
    if (diff === 1) { cur++; best = Math.max(best, cur) }
    else cur = 1
  }
  return best
}

function avgSizeWeight(dayWins: MicroWin[]): number {
  if (dayWins.length === 0) return 0
  return dayWins.reduce((s, w) => s + SIZE_CONFIG[w.size].weight, 0) / dayWins.length
}

function barColor(avg: number): string {
  if (avg >= 3.5) return '#a855f7'
  if (avg >= 2.5) return '#f97316'
  if (avg >= 1.5) return '#facc15'
  return '#60a5fa'
}

export default function MicroWinLog() {
  const { toastSuccess } = useToast()

  const [wins, setWins] = useState<MicroWin[]>([])
  const [winText, setWinText] = useState('')
  const [category, setCategory] = useState<WinCategory>('productivity')
  const [size, setSize] = useState<WinSize>('small')
  const [feeling, setFeeling] = useState<1 | 2 | 3 | 4 | 5>(3)
  const [compound, setCompound] = useState(false)
  const [filterCat, setFilterCat] = useState<WinCategory | 'all'>('all')

  useEffect(() => {
    try { setWins(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  function persist(updated: MicroWin[]) {
    setWins(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  function addWin() {
    if (!winText.trim()) return
    const w: MicroWin = {
      id: Date.now().toString(),
      date: todayStr(),
      time: nowTime(),
      win: winText.trim(),
      category,
      size,
      feeling,
      compound,
    }
    persist([w, ...wins])
    setWinText('')
    setFeeling(3)
    setCompound(false)
    toastSuccess('Win logged! 🎉')
  }

  function deleteWin(id: string) {
    persist(wins.filter(w => w.id !== id))
  }

  const today = todayStr()
  const todayWins = wins.filter(w => w.date === today)
  const streak = useMemo(() => calcStreak(wins), [wins])
  const bestStreak = useMemo(() => calcBestStreak(wins), [wins])

  const mostWinsDay = useMemo(() => {
    const counts: Record<string, number> = {}
    wins.forEach(w => { counts[w.date] = (counts[w.date] || 0) + 1 })
    return Math.max(0, ...Object.values(counts))
  }, [wins])

  const topCategory = useMemo((): WinCategory | null => {
    const counts: Partial<Record<WinCategory, number>> = {}
    wins.forEach(w => { counts[w.category] = (counts[w.category] || 0) + 1 })
    let top: WinCategory | null = null
    let max = 0
    for (const [k, v] of Object.entries(counts) as [WinCategory, number][]) {
      if (v > max) { max = v; top = k }
    }
    return top
  }, [wins])

  // 7-day bar chart data
  const last7 = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = shiftDay(today, -(6 - i))
      const dayWins = wins.filter(w => w.date === d)
      return { date: d, count: dayWins.length, avg: avgSizeWeight(dayWins) }
    })
  }, [wins, today])

  const maxBar = Math.max(1, ...last7.map(d => d.count))
  const chartH = 60

  // 30-day category breakdown
  const thirtyDaysAgo = shiftDay(today, -29)
  const recentWins = wins.filter(w => w.date >= thirtyDaysAgo)
  const catCounts: Partial<Record<WinCategory, number>> = {}
  recentWins.forEach(w => { catCounts[w.category] = (catCounts[w.category] || 0) + 1 })
  const maxCat = Math.max(1, ...Object.values(catCounts).map(v => v ?? 0))

  const filteredWins = filterCat === 'all' ? wins : wins.filter(w => w.category === filterCat)

  // Group today's wins by time (HH:MM bucketed to hour)
  const todayGrouped = useMemo(() => {
    const groups: Record<string, MicroWin[]> = {}
    ;[...todayWins].sort((a, b) => a.time.localeCompare(b.time)).forEach(w => {
      const hour = w.time.split(':')[0] + ':00'
      if (!groups[hour]) groups[hour] = []
      groups[hour].push(w)
    })
    return groups
  }, [todayWins])

  const sizes: WinSize[] = ['tiny', 'small', 'medium', 'big']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Zap className="w-7 h-7 text-yellow-400" />
            Micro Win Log
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Small victories compound into momentum.</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-yellow-400">{streak}🔥</div>
          <div className="text-xs text-slate-500">day streak</div>
        </div>
      </div>

      {/* Quick Capture */}
      <div className="game-card p-4 space-y-3 border border-yellow-500/20">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Plus className="w-4 h-4 text-yellow-400" /> Quick Capture
        </h3>

        <input
          value={winText}
          onChange={e => setWinText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addWin()}
          placeholder="What's your win right now?"
          className="game-input w-full"
          autoComplete="off"
        />

        {/* Category chips */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(Object.entries(CAT_CONFIG) as [WinCategory, typeof CAT_CONFIG.health][]).map(([k, c]) => (
            <button
              key={k}
              onClick={() => setCategory(k)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs whitespace-nowrap flex-shrink-0 transition-all"
              style={category === k
                ? { background: c.color + '30', color: c.color, border: `1px solid ${c.color}60` }
                : { background: '#1e293b', color: '#64748b', border: '1px solid #334155' }}
            >
              {c.emoji} {c.label}
            </button>
          ))}
        </div>

        {/* Size selector */}
        <div className="flex gap-2">
          {sizes.map(s => (
            <button
              key={s}
              onClick={() => setSize(s)}
              className="flex-1 py-1.5 rounded-xl text-xs font-medium transition-all"
              style={size === s
                ? { background: SIZE_CONFIG[s].color + '30', color: SIZE_CONFIG[s].color, border: `1px solid ${SIZE_CONFIG[s].color}50` }
                : { background: '#1e293b', color: '#64748b', border: '1px solid #334155' }}
            >
              {SIZE_CONFIG[s].emoji} {SIZE_CONFIG[s].label}
            </button>
          ))}
        </div>

        {/* Feeling + compound */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Feeling:</span>
            <div className="flex gap-1">
              {([1, 2, 3, 4, 5] as const).map(n => (
                <button
                  key={n}
                  onClick={() => setFeeling(n)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${feeling >= n ? 'bg-yellow-500/30 text-yellow-400' : 'bg-slate-700 text-slate-500'}`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={compound}
              onChange={e => setCompound(e.target.checked)}
              className="w-4 h-4 accent-violet-500 rounded"
            />
            <span className="text-xs text-slate-400">Builds on previous win</span>
          </label>
        </div>

        <button
          onClick={addWin}
          className="w-full py-2.5 bg-yellow-600 hover:bg-yellow-500 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
        >
          <Star className="w-4 h-4" /> Add Win
        </button>
      </div>

      {/* Today's wins */}
      <div className="game-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            Today's Wins
          </h3>
          <span className="px-2.5 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-bold">
            {todayWins.length}
          </span>
        </div>

        {todayWins.length >= 5 && (
          <div className="mb-3 px-3 py-2 bg-green-500/10 border border-green-500/30 rounded-xl text-xs text-green-400 font-medium">
            🎉 Amazing! {todayWins.length} wins today — you're on fire!
          </div>
        )}

        {Object.keys(todayGrouped).length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-4">No wins logged yet today. Add your first one!</p>
        ) : (
          <div className="space-y-3">
            {Object.entries(todayGrouped).map(([hour, groupWins]) => (
              <div key={hour}>
                <div className="text-xs text-slate-500 mb-1.5">{hour}</div>
                <div className="space-y-1.5">
                  {groupWins.map(w => (
                    <div key={w.id} className="flex items-center gap-2 px-3 py-2 bg-slate-900/50 rounded-lg">
                      <span className="text-sm">{SIZE_CONFIG[w.size].emoji}</span>
                      <span className="text-sm text-slate-200 flex-1">{w.win}</span>
                      <span className="text-xs">{CAT_CONFIG[w.category].emoji}</span>
                      <div className="flex gap-0.5">
                        {Array.from({ length: w.feeling }).map((_, i) => (
                          <div key={i} className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                        ))}
                        {Array.from({ length: 5 - w.feeling }).map((_, i) => (
                          <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                        ))}
                      </div>
                      <span className="text-xs text-slate-500">{w.time}</span>
                      <button onClick={() => deleteWin(w.id)} className="text-slate-600 hover:text-red-400 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 7-day bar chart */}
      <div className="game-card p-4">
        <h3 className="font-semibold text-white flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-slate-400" />
          7-Day Win Count
        </h3>
        <svg width="100%" height={chartH + 24} viewBox={`0 0 ${7 * 40} ${chartH + 24}`} className="overflow-visible">
          {last7.map((d, i) => {
            const barH = d.count === 0 ? 2 : Math.max(4, (d.count / maxBar) * chartH)
            const x = i * 40 + 8
            const y = chartH - barH
            const color = barColor(d.avg)
            const dow = new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1)
            const isToday = d.date === today
            return (
              <g key={d.date}>
                <rect x={x} y={y} width={24} height={barH} rx={4} fill={color} opacity={isToday ? 1 : 0.65} />
                {d.count > 0 && (
                  <text x={x + 12} y={y - 4} textAnchor="middle" fill="#e2e8f0" fontSize={9}>{d.count}</text>
                )}
                <text x={x + 12} y={chartH + 16} textAnchor="middle" fill={isToday ? '#facc15' : '#64748b'} fontSize={9} fontWeight={isToday ? 700 : 400}>
                  {dow}
                </text>
              </g>
            )
          })}
        </svg>
        <div className="flex gap-3 mt-1 flex-wrap">
          {(['tiny', 'small', 'medium', 'big'] as WinSize[]).map(s => (
            <div key={s} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: SIZE_CONFIG[s].color }} />
              <span className="text-xs text-slate-500">{SIZE_CONFIG[s].label}</span>
            </div>
          ))}
          <span className="text-xs text-slate-500 ml-1">(bar color = avg size)</span>
        </div>
      </div>

      {/* Category breakdown */}
      <div className="game-card p-4">
        <h3 className="font-semibold text-white flex items-center gap-2 mb-4">
          <Target className="w-4 h-4 text-slate-400" />
          Category Breakdown <span className="text-xs text-slate-500 font-normal">(last 30 days)</span>
        </h3>
        {recentWins.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-2">No data yet.</p>
        ) : (
          <div className="space-y-2.5">
            {(Object.entries(CAT_CONFIG) as [WinCategory, typeof CAT_CONFIG.health][])
              .map(([k, c]) => ({ k, c, count: catCounts[k] ?? 0 }))
              .sort((a, b) => b.count - a.count)
              .map(({ k, c, count }) => (
                <div key={k} className="flex items-center gap-3">
                  <span className="text-sm w-5 text-center">{c.emoji}</span>
                  <span className="text-xs text-slate-400 w-20 flex-shrink-0">{c.label}</span>
                  <div className="flex-1 h-4 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${(count / maxCat) * 100}%`, backgroundColor: c.color }}
                    />
                  </div>
                  <span className="text-xs text-slate-400 w-5 text-right">{count}</span>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Win Wall */}
      <div className="game-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-slate-400" />
            Win Wall
          </h3>
          <div className="flex gap-1.5 overflow-x-auto">
            <button
              onClick={() => setFilterCat('all')}
              className={`px-2.5 py-1 rounded-lg text-xs transition-all ${filterCat === 'all' ? 'bg-slate-600 text-white' : 'text-slate-500'}`}
            >
              All
            </button>
            {(Object.entries(CAT_CONFIG) as [WinCategory, typeof CAT_CONFIG.health][]).map(([k, c]) => (
              <button
                key={k}
                onClick={() => setFilterCat(k)}
                className="px-2 py-1 rounded-lg text-sm transition-all"
                style={filterCat === k
                  ? { background: c.color + '30', border: `1px solid ${c.color}50` }
                  : { color: '#64748b' }}
              >
                {c.emoji}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {filteredWins.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-6">No wins yet. Log your first one above!</p>
          ) : (
            filteredWins.map(w => (
              <div key={w.id} className="flex items-center gap-2.5 px-3 py-2.5 bg-slate-900/40 rounded-xl hover:bg-slate-900/60 transition-colors">
                <span className="text-sm flex-shrink-0">{SIZE_CONFIG[w.size].emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-200 truncate">{w.win}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-slate-500">{w.date} {w.time}</span>
                    <span className="text-xs">{CAT_CONFIG[w.category].emoji}</span>
                    <span className="text-xs text-slate-500">{CAT_CONFIG[w.category].label}</span>
                    {w.compound && <span className="text-xs text-violet-400">⛓ compound</span>}
                  </div>
                </div>
                <div className="flex gap-0.5 flex-shrink-0">
                  {Array.from({ length: w.feeling }).map((_, i) => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                  ))}
                  {Array.from({ length: 5 - w.feeling }).map((_, i) => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                  ))}
                </div>
                <button onClick={() => deleteWin(w.id)} className="text-slate-600 hover:text-red-400 transition-colors flex-shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="game-card p-4 text-center">
          <div className="text-2xl font-bold text-yellow-400">{wins.length}</div>
          <div className="text-xs text-slate-500 mt-1">Total Wins All Time</div>
        </div>
        <div className="game-card p-4 text-center">
          <div className="text-2xl font-bold text-orange-400">{bestStreak}</div>
          <div className="text-xs text-slate-500 mt-1">Biggest Win Streak</div>
        </div>
        <div className="game-card p-4 text-center">
          <div className="text-2xl font-bold text-green-400">{mostWinsDay}</div>
          <div className="text-xs text-slate-500 mt-1">Most Wins in a Day</div>
        </div>
        <div className="game-card p-4 text-center">
          <div className="text-2xl font-bold text-violet-400">
            {topCategory ? CAT_CONFIG[topCategory].emoji : '—'}
          </div>
          <div className="text-xs text-slate-500 mt-1">{topCategory ? CAT_CONFIG[topCategory].label : 'Top Category'}</div>
        </div>
      </div>
    </div>
  )
}

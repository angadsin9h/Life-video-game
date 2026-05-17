import { useState, useEffect } from 'react'
import { Trophy, Plus, Trash2, ChevronLeft, ChevronRight, Star, TrendingUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface Win {
  id: string
  text: string
  category: string
  impact: 1 | 2 | 3
  date: string
}

interface WeekData {
  weekStart: string
  wins: Win[]
  reflection: string
  rating: number
}

const CATEGORIES = [
  'Health', 'Work', 'Learning', 'Relationships', 'Finance', 'Personal', 'Creative', 'Mindset',
]

const CAT_COLORS: Record<string, string> = {
  Health: '#22c55e', Work: '#3b82f6', Learning: '#f59e0b', Relationships: '#ec4899',
  Finance: '#10b981', Personal: '#a855f7', Creative: '#f97316', Mindset: '#6366f1',
}

const STORAGE_KEY = 'weekly_wins'

function getWeekStart(date = new Date()): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d.toISOString().split('T')[0]
}

function getWeekEnd(weekStart: string): string {
  const d = new Date(weekStart + 'T12:00:00')
  d.setDate(d.getDate() + 6)
  return d.toISOString().split('T')[0]
}

function shiftWeek(weekStart: string, offset: number): string {
  const d = new Date(weekStart + 'T12:00:00')
  d.setDate(d.getDate() + offset * 7)
  return getWeekStart(d)
}

export default function WeeklyWins() {
  const { toastSuccess } = useToast()
  const [currentWeek, setCurrentWeek] = useState(getWeekStart())
  const [allData, setAllData] = useState<WeekData[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ text: '', category: 'Work', impact: 2 as 1 | 2 | 3 })

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      setAllData(saved ? JSON.parse(saved) : [])
    } catch { /**/ }
  }, [])

  const saveAll = (data: WeekData[]) => {
    setAllData(data)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }

  const getWeekData = (): WeekData => {
    return allData.find(d => d.weekStart === currentWeek) || { weekStart: currentWeek, wins: [], reflection: '', rating: 0 }
  }

  const updateWeek = (updates: Partial<WeekData>) => {
    const existing = getWeekData()
    const updated = { ...existing, ...updates }
    const newAll = allData.filter(d => d.weekStart !== currentWeek)
    saveAll([updated, ...newAll].sort((a, b) => b.weekStart.localeCompare(a.weekStart)))
  }

  const addWin = () => {
    if (!form.text.trim()) return
    const win: Win = {
      id: Date.now().toString(),
      text: form.text.trim(),
      category: form.category,
      impact: form.impact,
      date: new Date().toISOString().split('T')[0],
    }
    const week = getWeekData()
    updateWeek({ wins: [...week.wins, win] })
    setForm(f => ({ ...f, text: '' }))
    setShowForm(false)
    toastSuccess('Win logged! 🏆')
  }

  const delWin = (id: string) => {
    const week = getWeekData()
    updateWeek({ wins: week.wins.filter(w => w.id !== id) })
  }

  const week = getWeekData()
  const isCurrentWeek = currentWeek === getWeekStart()
  const weekEnd = getWeekEnd(currentWeek)

  const totalScore = week.wins.reduce((s, w) => s + w.impact, 0)
  const bigWins = week.wins.filter(w => w.impact === 3)
  const catBreakdown = CATEGORIES.map(c => ({ cat: c, count: week.wins.filter(w => w.category === c).length })).filter(c => c.count > 0)

  // Historical weekly scores
  const recentWeeks = allData.slice(0, 8).reverse()
  const maxScore = Math.max(...recentWeeks.map(w => w.wins.reduce((s, win) => s + win.impact, 0)), 1)

  const IMPACT_LABELS: Record<number, string> = { 1: 'Small', 2: 'Medium', 3: 'Big' }
  const IMPACT_COLORS: Record<number, string> = { 1: '#64748b', 2: '#3b82f6', 3: '#f59e0b' }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Trophy className="w-7 h-7 text-yellow-400" />
            Weekly Wins
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Celebrate progress, big and small</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-3 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-xl text-sm font-semibold transition-colors">
          <Plus className="w-4 h-4" /> Add Win
        </button>
      </div>

      {/* Week nav */}
      <div className="flex items-center justify-between">
        <button onClick={() => setCurrentWeek(shiftWeek(currentWeek, -1))} className="p-2 text-slate-500 hover:text-slate-300">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <div className="font-bold text-white">{isCurrentWeek ? 'This Week' : currentWeek}</div>
          <div className="text-xs text-slate-500">{currentWeek} → {weekEnd}</div>
        </div>
        <button onClick={() => setCurrentWeek(shiftWeek(currentWeek, 1))} disabled={isCurrentWeek}
          className="p-2 text-slate-500 hover:text-slate-300 disabled:opacity-30">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-yellow-400">{week.wins.length}</div>
          <div className="text-xs text-slate-500">Total Wins</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-orange-400">{bigWins.length}</div>
          <div className="text-xs text-slate-500">Big Wins 🏆</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-blue-400">{totalScore}</div>
          <div className="text-xs text-slate-500">Win Score</div>
        </div>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="game-card p-5 space-y-4 border border-yellow-500/20">
          <h3 className="font-semibold text-slate-300">Log a Win</h3>
          <input value={form.text} onChange={e => setForm(f => ({ ...f, text: e.target.value }))}
            placeholder="What did you accomplish? Be specific!" className="game-input w-full" autoFocus
            onKeyDown={e => e.key === 'Enter' && addWin()} />
          <div>
            <label className="text-xs text-slate-400 mb-2 block">Category</label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map(c => (
                <button key={c} onClick={() => setForm(f => ({ ...f, category: c }))}
                  className="px-2 py-1 rounded-lg text-xs transition-all"
                  style={form.category === c ? { background: CAT_COLORS[c] + '30', color: CAT_COLORS[c], border: `1px solid ${CAT_COLORS[c]}` } : { background: '#1e293b', color: '#64748b' }}>
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-2 block">Impact</label>
            <div className="flex gap-2">
              {([1, 2, 3] as const).map(i => (
                <button key={i} onClick={() => setForm(f => ({ ...f, impact: i }))}
                  className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
                  style={form.impact === i ? { background: IMPACT_COLORS[i] + '30', color: IMPACT_COLORS[i], border: `1px solid ${IMPACT_COLORS[i]}` } : { background: '#1e293b', color: '#64748b' }}>
                  {'⭐'.repeat(i)} {IMPACT_LABELS[i]}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={addWin} className="flex-1 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-xl text-sm font-semibold transition-colors">
              <Trophy className="w-4 h-4 inline mr-1.5" />Log Win
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Wins list */}
      {week.wins.length > 0 ? (
        <div className="space-y-2">
          {[...week.wins].reverse().map(win => (
            <div key={win.id} className="game-card p-3 flex items-start gap-3">
              <div className="text-base">{'⭐'.repeat(win.impact)}</div>
              <div className="flex-1 min-w-0">
                <div className="text-white text-sm">{win.text}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: CAT_COLORS[win.category] + '20', color: CAT_COLORS[win.category] }}>
                    {win.category}
                  </span>
                  <span className="text-xs text-slate-600">{win.date}</span>
                </div>
              </div>
              <button onClick={() => delWin(win.id)} className="p-1 text-slate-700 hover:text-red-400 transition-colors flex-shrink-0">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 text-slate-500">
          <Trophy className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>No wins logged this week yet.</p>
          <p className="text-sm mt-1">Even small progress counts — log your first win!</p>
        </div>
      )}

      {/* Reflection */}
      <div className="game-card p-4">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Weekly Reflection</h3>
        <textarea
          value={week.reflection}
          onChange={e => updateWeek({ reflection: e.target.value })}
          placeholder="What made this week meaningful? What would you do differently?"
          className="game-input w-full h-20 resize-none text-sm"
        />
        <div className="flex items-center gap-2 mt-3">
          <span className="text-xs text-slate-400">Week rating:</span>
          {[1, 2, 3, 4, 5].map(r => (
            <button key={r} onClick={() => updateWeek({ rating: r })}
              className="text-lg transition-transform hover:scale-110">
              <Star className={`w-5 h-5 ${r <= week.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-700'}`} />
            </button>
          ))}
        </div>
      </div>

      {/* Category breakdown */}
      {catBreakdown.length > 0 && (
        <div className="game-card p-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">By Category</h3>
          <div className="flex flex-wrap gap-2">
            {catBreakdown.map(({ cat, count }) => (
              <div key={cat} className="px-3 py-1.5 rounded-xl text-xs font-medium"
                style={{ background: CAT_COLORS[cat] + '20', color: CAT_COLORS[cat], border: `1px solid ${CAT_COLORS[cat]}30` }}>
                {cat} <span className="font-bold">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History chart */}
      {recentWeeks.length > 0 && (
        <div className="game-card p-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-400" /> Win Score History
          </h3>
          <div className="flex items-end gap-2 h-16">
            {recentWeeks.map((w, i) => {
              const score = w.wins.reduce((s, win) => s + win.impact, 0)
              const isActive = w.weekStart === currentWeek
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 cursor-pointer"
                  onClick={() => setCurrentWeek(w.weekStart)}>
                  <div className="w-full rounded-t-sm transition-all duration-500"
                    style={{ height: `${(score / maxScore) * 100}%`, background: isActive ? '#f59e0b' : '#f59e0b40', minHeight: '3px' }} />
                  <div className="text-[8px] text-slate-700">{w.weekStart.slice(5)}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

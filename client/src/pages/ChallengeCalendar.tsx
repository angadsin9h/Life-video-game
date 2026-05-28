import { useState, useEffect, useCallback } from 'react'
import { Flame, Plus, Trash2, Check, Calendar, Star, X } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface Chain {
  id: string
  name: string
  color: string
  startDate: string
  completedDates: string[]
}

interface StorageData {
  chains: Chain[]
}

const COLOR_PALETTE = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#14b8a6', // teal
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
]

const STORAGE_KEY = 'challenge_calendar'

function getToday(): string {
  return new Date().toISOString().split('T')[0]
}

function getLast90Days(): string[] {
  const days: string[] = []
  for (let i = 89; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().split('T')[0])
  }
  return days
}

function calcCurrentStreak(completedDates: string[]): number {
  const set = new Set(completedDates)
  const today = getToday()
  let streak = 0
  let cur = new Date()

  // Start from today and go backward
  for (let i = 0; i < 365; i++) {
    const dateStr = cur.toISOString().split('T')[0]
    if (set.has(dateStr)) {
      streak++
      cur.setDate(cur.getDate() - 1)
    } else {
      // If today is not checked, start from yesterday
      if (i === 0) {
        cur.setDate(cur.getDate() - 1)
        continue
      }
      break
    }
  }
  return streak
}

function calcLongestStreak(completedDates: string[]): number {
  if (completedDates.length === 0) return 0
  const sorted = [...completedDates].sort()
  let longest = 1
  let current = 1

  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1] + 'T12:00:00')
    const curr = new Date(sorted[i] + 'T12:00:00')
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays === 1) {
      current++
      if (current > longest) longest = current
    } else {
      current = 1
    }
  }
  return longest
}

function loadData(): StorageData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as StorageData
  } catch {}
  return { chains: [] }
}

function saveData(data: StorageData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export default function ChallengeCalendar() {
  const { toastSuccess } = useToast()
  const [data, setData] = useState<StorageData>(() => loadData())
  const [showForm, setShowForm] = useState(false)
  const [formName, setFormName] = useState('')
  const [formColor, setFormColor] = useState(COLOR_PALETTE[0])
  const [formStart, setFormStart] = useState(getToday())
  const [expandedChain, setExpandedChain] = useState<string | null>(null)

  const today = getToday()
  const last90 = getLast90Days()

  const persist = useCallback((next: StorageData) => {
    setData(next)
    saveData(next)
  }, [])

  const addChain = () => {
    if (!formName.trim()) return
    const chain: Chain = {
      id: Date.now().toString(),
      name: formName.trim(),
      color: formColor,
      startDate: formStart,
      completedDates: [],
    }
    const next = { chains: [...data.chains, chain] }
    persist(next)
    setFormName('')
    setFormColor(COLOR_PALETTE[0])
    setFormStart(getToday())
    setShowForm(false)
    toastSuccess('Chain created!', `"${chain.name}" is ready to track.`)
  }

  const deleteChain = (id: string) => {
    const chain = data.chains.find(c => c.id === id)
    const next = { chains: data.chains.filter(c => c.id !== id) }
    persist(next)
    toastSuccess('Chain removed', chain?.name)
  }

  const markToday = (id: string) => {
    const next = {
      chains: data.chains.map(c => {
        if (c.id !== id) return c
        const set = new Set(c.completedDates)
        if (set.has(today)) {
          set.delete(today)
          return { ...c, completedDates: [...set] }
        } else {
          set.add(today)
          toastSuccess('Day marked!', `Keep the chain going for "${c.name}"!`)
          return { ...c, completedDates: [...set] }
        }
      }),
    }
    persist(next)
  }

  // Overall stats
  const totalChains = data.chains.length
  const longestEverStreak = data.chains.reduce((best, c) => {
    const l = calcLongestStreak(c.completedDates)
    return l > best ? l : best
  }, 0)
  const totalDaysLogged = data.chains.reduce((sum, c) => sum + c.completedDates.length, 0)
  const activeStreaks = data.chains.filter(c => calcCurrentStreak(c.completedDates) > 0).length

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1
            className="text-2xl font-bold text-white flex items-center gap-2"
            style={{ fontFamily: 'Orbitron, monospace' }}
          >
            <Flame className="w-7 h-7 text-orange-400" />
            Challenge Calendar
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Don't break the chain — build unstoppable habits.</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-semibold text-sm transition-colors"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancel' : 'New Chain'}
        </button>
      </div>

      {/* Overall stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Chains', value: totalChains, icon: Calendar, color: 'text-blue-400' },
          { label: 'Active Streaks', value: activeStreaks, icon: Flame, color: 'text-orange-400' },
          { label: 'Longest Ever', value: `${longestEverStreak}d`, icon: Star, color: 'text-yellow-400' },
          { label: 'Days Logged', value: totalDaysLogged, icon: Check, color: 'text-green-400' },
        ].map(s => (
          <div key={s.label} className="game-card p-4 text-center">
            <s.icon className={`w-5 h-5 mx-auto mb-1 ${s.color}`} />
            <div className="text-2xl font-bold text-white">{s.value}</div>
            <div className="text-xs text-slate-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* New chain form */}
      {showForm && (
        <div className="game-card p-5 space-y-4 border border-orange-500/30">
          <h3 className="font-semibold text-white text-sm uppercase tracking-wider">Create New Chain</h3>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Chain Name</label>
            <input
              className="game-input w-full"
              placeholder="e.g. Morning Run, No Social Media, Read Daily..."
              value={formName}
              onChange={e => setFormName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addChain() }}
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-2 block">Color</label>
            <div className="flex flex-wrap gap-2">
              {COLOR_PALETTE.map(c => (
                <button
                  key={c}
                  onClick={() => setFormColor(c)}
                  className="w-8 h-8 rounded-full transition-all border-2"
                  style={{
                    background: c,
                    borderColor: formColor === c ? '#fff' : 'transparent',
                    transform: formColor === c ? 'scale(1.2)' : 'scale(1)',
                  }}
                />
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Start Date</label>
            <input
              type="date"
              className="game-input"
              value={formStart}
              max={today}
              onChange={e => setFormStart(e.target.value)}
            />
          </div>
          <button
            onClick={addChain}
            disabled={!formName.trim()}
            className="w-full py-2.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-colors"
          >
            <Plus className="w-4 h-4 inline mr-1.5" />
            Create Chain
          </button>
        </div>
      )}

      {/* Chains list */}
      {data.chains.length === 0 && !showForm && (
        <div className="text-center py-16 text-slate-500">
          <Flame className="w-14 h-14 mx-auto mb-3 opacity-20" />
          <p className="text-lg font-medium mb-1">No chains yet</p>
          <p className="text-sm">Create your first chain to start building the habit of not breaking it.</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 px-6 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-semibold transition-colors"
          >
            <Plus className="w-4 h-4 inline mr-1.5" />
            Create First Chain
          </button>
        </div>
      )}

      {data.chains.map(chain => {
        const completedSet = new Set(chain.completedDates)
        const currentStreak = calcCurrentStreak(chain.completedDates)
        const longestStreak = calcLongestStreak(chain.completedDates)
        const doneToday = completedSet.has(today)
        const isExpanded = expandedChain === chain.id

        // Build 90-day calendar weeks
        // Filter to days >= startDate
        const validDays = last90.filter(d => d >= chain.startDate)
        // Pad to start on Sunday
        const firstDow = validDays.length > 0 ? new Date(validDays[0] + 'T12:00:00').getDay() : 0
        const padded: (string | null)[] = [...Array(firstDow).fill(null), ...validDays]
        const weeks: (string | null)[][] = []
        for (let i = 0; i < padded.length; i += 7) weeks.push(padded.slice(i, i + 7))

        return (
          <div
            key={chain.id}
            className="game-card p-5 space-y-4"
            style={{ borderLeft: `3px solid ${chain.color}` }}
          >
            {/* Chain header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: chain.color }} />
                <div>
                  <h3 className="font-bold text-white">{chain.name}</h3>
                  <div className="text-xs text-slate-500">
                    Since {new Date(chain.startDate + 'T12:00:00').toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Mark today button */}
                <button
                  onClick={() => markToday(chain.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all"
                  style={
                    doneToday
                      ? { background: chain.color + '33', color: chain.color, border: `1px solid ${chain.color}` }
                      : { background: '#1e293b', color: '#94a3b8', border: '1px solid #334155' }
                  }
                >
                  <Check className="w-3.5 h-3.5" />
                  {doneToday ? 'Done!' : 'Mark Today'}
                </button>
                <button
                  onClick={() => setExpandedChain(isExpanded ? null : chain.id)}
                  className="p-1.5 text-slate-500 hover:text-slate-300 transition-colors"
                  title={isExpanded ? 'Collapse' : 'Expand'}
                >
                  <Calendar className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteChain(chain.id)}
                  className="p-1.5 text-slate-600 hover:text-red-400 transition-colors"
                  title="Delete chain"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Streak stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-800/60 rounded-xl p-3 text-center">
                <Flame className="w-4 h-4 mx-auto mb-0.5" style={{ color: chain.color }} />
                <div className="text-xl font-bold text-white">{currentStreak}</div>
                <div className="text-xs text-slate-500">Current Streak</div>
              </div>
              <div className="bg-slate-800/60 rounded-xl p-3 text-center">
                <Star className="w-4 h-4 mx-auto mb-0.5 text-yellow-400" />
                <div className="text-xl font-bold text-white">{longestStreak}</div>
                <div className="text-xs text-slate-500">Longest Ever</div>
              </div>
              <div className="bg-slate-800/60 rounded-xl p-3 text-center">
                <Check className="w-4 h-4 mx-auto mb-0.5 text-green-400" />
                <div className="text-xl font-bold text-white">{chain.completedDates.length}</div>
                <div className="text-xs text-slate-500">Days Logged</div>
              </div>
            </div>

            {/* 90-day calendar grid — always visible */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Last 90 Days</span>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <div className="w-3 h-3 rounded-sm bg-slate-700" />
                  <span>Empty</span>
                  <div className="w-3 h-3 rounded-sm" style={{ background: chain.color }} />
                  <span>Done</span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <div className="flex gap-[3px]" style={{ minWidth: 'max-content' }}>
                  {weeks.map((week, wi) => (
                    <div key={wi} className="flex flex-col gap-[3px]">
                      {week.map((day, di) => {
                        if (day === null) {
                          return <div key={di} className="w-[13px] h-[13px]" />
                        }
                        const done = completedSet.has(day)
                        const isToday = day === today
                        return (
                          <div
                            key={di}
                            title={`${day}${done ? ' ✓' : ''}`}
                            className="w-[13px] h-[13px] rounded-[3px] transition-all cursor-default group relative"
                            style={{
                              background: done ? chain.color : '#1e293b',
                              outline: isToday ? `2px solid ${chain.color}` : 'none',
                              outlineOffset: '1px',
                            }}
                          >
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-slate-700 text-xs text-white px-2 py-1 rounded whitespace-nowrap z-10 pointer-events-none">
                              {new Date(day + 'T12:00:00').toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                              {done ? ' ✓' : ''}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Expanded: show completion percentage bar */}
            {isExpanded && (
              <div className="pt-2 border-t border-slate-700/50 space-y-3">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Consistency</h4>
                {(() => {
                  const relevantDays = validDays.length
                  const pct = relevantDays > 0 ? Math.round((chain.completedDates.length / relevantDays) * 100) : 0
                  return (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>Completion rate (last 90 days in range)</span>
                        <span className="font-bold text-white">{pct}%</span>
                      </div>
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, background: chain.color }}
                        />
                      </div>
                      <div className="text-xs text-slate-600">
                        {chain.completedDates.length} of {relevantDays} days completed
                      </div>
                    </div>
                  )
                })()}

                {/* Week-by-week for last 12 weeks */}
                <div>
                  <div className="text-xs text-slate-500 mb-2">Weekly completions (last 12 weeks)</div>
                  <div className="flex items-end gap-1">
                    {Array.from({ length: 12 }, (_, wi) => {
                      const weekDays = Array.from({ length: 7 }, (_, di) => {
                        const daysAgo = (11 - wi) * 7 + (6 - di)
                        const d = new Date()
                        d.setDate(d.getDate() - daysAgo)
                        return d.toISOString().split('T')[0]
                      })
                      const done = weekDays.filter(d => d >= chain.startDate && completedSet.has(d)).length
                      const possible = weekDays.filter(d => d >= chain.startDate).length
                      const pct = possible > 0 ? done / possible : 0
                      const weekStart = new Date(weekDays[0] + 'T12:00:00').toLocaleDateString('en', { month: 'short', day: 'numeric' })
                      return (
                        <div key={wi} className="flex-1 flex flex-col items-center gap-0.5 group relative">
                          <div className="absolute bottom-full mb-1 hidden group-hover:block bg-slate-700 text-xs text-white px-2 py-1 rounded whitespace-nowrap z-10">
                            {weekStart}: {done}/{possible}
                          </div>
                          <div className="text-[9px] text-slate-600">{done}</div>
                          <div
                            className="w-full rounded-sm"
                            style={{
                              height: `${Math.max(3, pct * 48)}px`,
                              background: possible === 0 ? '#1e293b' : pct === 0 ? '#1e293b' : chain.color,
                              opacity: pct === 0 ? 0.3 : pct * 0.6 + 0.4,
                            }}
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

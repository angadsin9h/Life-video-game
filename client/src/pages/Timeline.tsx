import { useEffect, useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import { Clock, Flame, RefreshCw, Moon, Droplets, Heart, Brain, Star, Filter, ChevronDown, ChevronUp, BookOpen, Dumbbell, Apple } from 'lucide-react'

interface TaskEntry { category: string; task_name: string; duration_minutes: number }
interface HabitCompletion { title: string; emoji: string }
interface TimelineDay {
  date: string
  score: number
  tasks: TaskEntry[]
  mood: { mood: number; emoji: string; label: string } | null
  sleep: { duration_minutes: number; quality: number } | null
  water: { glasses: number; goal: number } | null
  habits: HabitCompletion[]
  nutrition: { calories: number; protein_g: number } | null
  workoutCount: number
  journalEntry: boolean
}

const CAT_ICONS: Record<string, string> = { health: '❤️', mind: '🧠', work: '💼', social: '👥', growth: '🚀' }
const CAT_COLORS: Record<string, string> = {
  health: 'bg-green-500/20 text-green-400 border-green-500/30',
  mind: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  work: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
  social: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  growth: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
}
const MOOD_EMOJIS = ['', '😞', '😕', '😐', '🙂', '😄']

function fmtDur(mins: number) {
  if (mins < 60) return `${mins}m`
  return `${Math.floor(mins / 60)}h${mins % 60 > 0 ? ` ${mins % 60}m` : ''}`
}

function scoreColor(s: number) {
  if (s >= 80) return 'text-green-400'
  if (s >= 50) return 'text-violet-400'
  if (s > 0) return 'text-yellow-400'
  return 'text-slate-600'
}

function DayCard({ day, expanded, onToggle }: { day: TimelineDay; expanded: boolean; onToggle: () => void }) {
  const d = new Date(day.date + 'T00:00:00')
  const today = new Date().toISOString().split('T')[0]
  const isToday = day.date === today
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  const isYesterday = day.date === yesterday

  let dateLabel = d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
  if (isToday) dateLabel = 'Today'
  else if (isYesterday) dateLabel = 'Yesterday'

  const totalMins = day.tasks.reduce((s, t) => s + t.duration_minutes, 0)
  const catCounts: Record<string, number> = {}
  for (const t of day.tasks) catCounts[t.category] = (catCounts[t.category] || 0) + t.duration_minutes

  return (
    <div className={`game-card border transition-all ${isToday ? 'border-violet-500/40' : 'border-slate-700/50'}`}>
      {/* Header row */}
      <button onClick={onToggle} className="w-full p-4 text-left">
        <div className="flex items-center gap-3">
          {/* Score */}
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-800 flex-shrink-0">
            <span className={`text-sm font-bold ${scoreColor(day.score)}`} style={{ fontFamily: 'Orbitron, monospace' }}>
              {day.score || '—'}
            </span>
          </div>
          {/* Date + summary */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={`text-sm font-semibold ${isToday ? 'text-violet-400' : 'text-slate-200'}`}>{dateLabel}</span>
              {day.score >= 80 && <span className="text-xs text-yellow-400">★</span>}
              {!isToday && <span className="text-xs text-slate-600">{d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
            </div>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              {totalMins > 0 && (
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />{fmtDur(totalMins)}
                </span>
              )}
              {day.mood && <span className="text-xs">{day.mood.emoji}</span>}
              {day.sleep && day.sleep.duration_minutes > 0 && (
                <span className="text-xs text-indigo-400 flex items-center gap-1">
                  <Moon className="w-3 h-3" />{(day.sleep.duration_minutes / 60).toFixed(1)}h
                </span>
              )}
              {day.water && day.water.glasses > 0 && (
                <span className="text-xs text-cyan-400 flex items-center gap-1">
                  <Droplets className="w-3 h-3" />{day.water.glasses}
                </span>
              )}
              {day.habits.length > 0 && (
                <span className="text-xs text-green-400 flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" />{day.habits.length}
                </span>
              )}
              {day.journalEntry && <span className="text-xs text-amber-400 flex items-center gap-1"><BookOpen className="w-3 h-3" /></span>}
              {day.workoutCount > 0 && <span className="text-xs text-orange-400 flex items-center gap-1"><Dumbbell className="w-3 h-3" />{day.workoutCount}</span>}
              {day.nutrition && day.nutrition.calories > 0 && (
                <span className="text-xs text-green-300 flex items-center gap-1"><Apple className="w-3 h-3" />{day.nutrition.calories} kcal</span>
              )}
            </div>
          </div>
          {/* Category dots */}
          <div className="flex gap-1 items-center flex-shrink-0">
            {Object.entries(catCounts).slice(0, 4).map(([cat]) => (
              <div key={cat} className={`w-2 h-2 rounded-full ${
                cat === 'health' ? 'bg-green-500' :
                cat === 'mind' ? 'bg-cyan-500' :
                cat === 'work' ? 'bg-violet-500' :
                cat === 'social' ? 'bg-yellow-500' : 'bg-orange-500'
              }`} />
            ))}
          </div>
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-600 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-600 flex-shrink-0" />}
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-slate-700/50 pt-4">
          {/* Task breakdown */}
          {day.tasks.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Activities</h4>
              <div className="space-y-1.5">
                {day.tasks.map((t, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${CAT_COLORS[t.category] || 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                      {CAT_ICONS[t.category]} {t.category}
                    </span>
                    <span className="text-sm text-slate-200 flex-1 truncate">{t.task_name}</span>
                    <span className="text-xs text-slate-500 flex-shrink-0">{t.duration_minutes}m</span>
                  </div>
                ))}
              </div>
              {/* Category time bars */}
              <div className="mt-3 space-y-1.5">
                {Object.entries(catCounts).sort((a, b) => b[1] - a[1]).map(([cat, mins]) => (
                  <div key={cat} className="flex items-center gap-2">
                    <span className="text-xs w-14 text-slate-500 capitalize">{cat}</span>
                    <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${cat === 'health' ? 'bg-green-500' : cat === 'mind' ? 'bg-cyan-500' : cat === 'work' ? 'bg-violet-500' : cat === 'social' ? 'bg-yellow-500' : 'bg-orange-500'}`}
                        style={{ width: `${Math.min(100, (mins / Math.max(...Object.values(catCounts))) * 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-600 w-10 text-right">{fmtDur(mins)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stats row */}
          <div className="flex flex-wrap gap-3">
            {day.mood && (
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <span>{day.mood.emoji}</span>
                <span>{day.mood.label}</span>
              </div>
            )}
            {day.sleep && day.sleep.duration_minutes > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-indigo-400">
                <Moon className="w-3 h-3" />
                <span>{(day.sleep.duration_minutes / 60).toFixed(1)}h sleep</span>
                {day.sleep.quality > 0 && <span className="text-slate-600">· Q:{day.sleep.quality}/5</span>}
              </div>
            )}
            {day.water && day.water.glasses > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-cyan-400">
                <Droplets className="w-3 h-3" />
                <span>{day.water.glasses}/{day.water.goal} glasses</span>
              </div>
            )}
            {day.nutrition && day.nutrition.calories > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-green-300">
                <Apple className="w-3 h-3" />
                <span>{day.nutrition.calories} kcal · {day.nutrition.protein_g.toFixed(0)}g P</span>
              </div>
            )}
          </div>

          {/* Habits */}
          {day.habits.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Habits Completed</h4>
              <div className="flex flex-wrap gap-1.5">
                {day.habits.map((h, i) => (
                  <span key={i} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-green-900/20 border border-green-500/20 text-xs text-green-300">
                    <span>{h.emoji}</span>{h.title}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 text-xs">
            <Link to={`/log`} className="text-violet-400 hover:text-violet-300">Edit log →</Link>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Timeline() {
  const [days, setDays] = useState<TimelineDay[]>([])
  const [loading, setLoading] = useState(true)
  const [limit, setLimit] = useState(14)
  const [filterMin, setFilterMin] = useState(0)
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set())

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const res = await axios.get<TimelineDay[]>(`/api/timeline?limit=${limit}`)
        setDays(res.data)
        // Auto-expand today
        const today = new Date().toISOString().split('T')[0]
        setExpandedDates(new Set([today]))
      } finally { setLoading(false) }
    }
    load()
  }, [limit])

  const toggle = (date: string) => {
    setExpandedDates(prev => {
      const next = new Set(prev)
      next.has(date) ? next.delete(date) : next.add(date)
      return next
    })
  }

  const filtered = days.filter(d => d.score >= filterMin || filterMin === 0)
  const avgScore = days.length ? Math.round(days.filter(d => d.score > 0).reduce((s, d) => s + d.score, 0) / Math.max(1, days.filter(d => d.score > 0).length)) : 0
  const streak = (() => {
    let s = 0
    const today = new Date().toISOString().split('T')[0]
    const dSet = new Set(days.map(d => d.date))
    let cur = today
    while (dSet.has(cur) && days.find(d => d.date === cur)!.score > 0) {
      s++
      const dt = new Date(cur)
      dt.setDate(dt.getDate() - 1)
      cur = dt.toISOString().split('T')[0]
    }
    return s
  })()

  if (loading) return (
    <div className="space-y-3 animate-pulse max-w-2xl mx-auto">
      {[1,2,3,4,5].map(i => <div key={i} className="h-20 bg-slate-800 rounded-xl" />)}
    </div>
  )

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
          <Clock className="w-7 h-7 text-violet-400" />
          Timeline
        </h1>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Flame className="w-4 h-4 text-orange-400" />
          <span className="text-orange-400 font-bold">{streak}d</span>
          <span>streak</span>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-violet-400" style={{ fontFamily: 'Orbitron, monospace' }}>{avgScore}</div>
          <div className="text-xs text-slate-500 mt-0.5">Avg Score</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-green-400" style={{ fontFamily: 'Orbitron, monospace' }}>{days.filter(d => d.score >= 80).length}</div>
          <div className="text-xs text-slate-500 mt-0.5">Great Days</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-cyan-400" style={{ fontFamily: 'Orbitron, monospace' }}>{days.filter(d => d.tasks.length > 0).length}</div>
          <div className="text-xs text-slate-500 mt-0.5">Active Days</div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-slate-500" />
        <span className="text-xs text-slate-500">Min score:</span>
        {[0, 30, 50, 70, 90].map(v => (
          <button key={v} onClick={() => setFilterMin(v)}
            className={`px-2 py-1 rounded-lg text-xs transition-colors ${filterMin === v ? 'bg-violet-600/30 text-violet-400 border border-violet-500/30' : 'text-slate-500 hover:text-slate-300'}`}>
            {v === 0 ? 'All' : `${v}+`}
          </button>
        ))}
      </div>

      {/* Score bar chart */}
      <div className="game-card p-4">
        <div className="flex items-end gap-1 h-16">
          {days.slice().reverse().map(d => {
            const pct = Math.max(4, d.score)
            const isSelected = expandedDates.has(d.date)
            return (
              <button key={d.date} onClick={() => toggle(d.date)} className="flex-1 flex flex-col items-center group gap-1">
                <div className="w-full flex-1 flex items-end">
                  <div
                    className={`w-full rounded-t transition-all duration-300 ${
                      isSelected ? 'bg-violet-400' :
                      d.score >= 80 ? 'bg-green-500/70' :
                      d.score >= 50 ? 'bg-violet-500/50' :
                      d.score > 0 ? 'bg-yellow-500/40' : 'bg-slate-800'
                    }`}
                    style={{ height: `${pct}%` }}
                  />
                </div>
                <span className="text-[8px] text-slate-700 group-hover:text-slate-500">
                  {new Date(d.date + 'T00:00:00').getDate()}
                </span>
              </button>
            )
          })}
        </div>
        <div className="text-xs text-slate-600 text-center mt-1">Click bars to expand days</div>
      </div>

      {/* Day cards */}
      <div className="space-y-2">
        {filtered.map(day => (
          <DayCard
            key={day.date}
            day={day}
            expanded={expandedDates.has(day.date)}
            onToggle={() => toggle(day.date)}
          />
        ))}
      </div>

      {days.length >= limit && (
        <button onClick={() => setLimit(l => l + 14)}
          className="w-full py-3 text-sm text-slate-500 hover:text-slate-300 border border-dashed border-slate-700 rounded-xl transition-colors">
          Load more
        </button>
      )}
    </div>
  )
}

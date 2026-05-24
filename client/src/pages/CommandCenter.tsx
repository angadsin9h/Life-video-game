import { useState, useEffect } from 'react'
import { Zap, Circle, CheckCircle2, Clock, TrendingUp, ChevronRight } from 'lucide-react'
import { NavLink } from 'react-router-dom'

// All major log keys with their display config
const LOG_PANELS = [
  { key: 'mindful_sleep_log',       label: 'Sleep',        emoji: '🌙', scoreField: 'sleepScore',        color: '#6366f1', route: '/mindful-sleep'       },
  { key: 'energy_budget_log',       label: 'Energy',       emoji: '⚡', scoreField: 'energyAfter',       color: '#f59e0b', route: '/energy-budget'        },
  { key: 'daily_excellence_log',    label: 'Excellence',   emoji: '⭐', scoreField: 'excellenceScore',   color: '#eab308', route: '/daily-excellence'     },
  { key: 'growth_mindset_log',      label: 'Growth',       emoji: '🌱', scoreField: 'growthScore',        color: '#22c55e', route: '/growth-mindset'       },
  { key: 'social_intelligence_log', label: 'Social',       emoji: '🌐', scoreField: 'socialScore',        color: '#3b82f6', route: '/social-intelligence'  },
  { key: 'willpower_log',           label: 'Willpower',    emoji: '🔥', scoreField: 'willpowerScore',     color: '#ef4444', route: '/willpower-log'        },
  { key: 'joy_design_log',          label: 'Joy',          emoji: '☀️', scoreField: 'joyScore',           color: '#f97316', route: '/joy-design'           },
  { key: 'inner_peace_log',         label: 'Peace',        emoji: '🕊️', scoreField: 'peaceScore',         color: '#a855f7', route: '/inner-peace-log'      },
  { key: 'purpose_log',             label: 'Purpose',      emoji: '🧭', scoreField: 'alignmentScore',     color: '#10b981', route: '/purpose-log'          },
  { key: 'physical_peak_log',       label: 'Body',         emoji: '💪', scoreField: 'performanceScore',   color: '#22c55e', route: '/physical-peak'        },
  { key: 'neuroplasticity_log',     label: 'Mind',         emoji: '🧠', scoreField: 'sharpnessScore',     color: '#6366f1', route: '/neuroplasticity'      },
  { key: 'life_review_log',         label: 'Life Review',  emoji: '📊', scoreField: 'satisfactionScore',  color: '#3b82f6', route: '/life-review'          },
]

interface PanelData {
  key: string; label: string; emoji: string; color: string; route: string
  score: number | null; lastEntry: string | null; lastDate: string | null
  loggedToday: boolean; totalEntries: number
}

function loadPanels(): PanelData[] {
  const today = new Date().toISOString().split('T')[0]
  return LOG_PANELS.map(p => {
    try {
      const entries = JSON.parse(localStorage.getItem(p.key) || '[]')
      if (!Array.isArray(entries) || entries.length === 0) {
        return { ...p, score: null, lastEntry: null, lastDate: null, loggedToday: false, totalEntries: 0 }
      }
      const latest = entries[0]
      const scoreVal = typeof latest[p.scoreField] === 'number' ? latest[p.scoreField] as number : null
      const date = (latest.date as string) || (latest.createdAt as string | undefined)?.split('T')[0] || null
      const textField = Object.keys(latest).find(k =>
        typeof latest[k] === 'string' && (latest[k] as string).length > 5 &&
        !['id', 'date', 'createdAt', 'area', 'type', 'period', 'depth', 'standard', 'impact'].includes(k)
      )
      return {
        ...p,
        score: scoreVal,
        lastEntry: textField ? (latest[textField] as string) : null,
        lastDate: date,
        loggedToday: date === today,
        totalEntries: entries.length,
      }
    } catch {
      return { ...p, score: null, lastEntry: null, lastDate: null, loggedToday: false, totalEntries: 0 }
    }
  })
}

function loadTodayFeed(): { emoji: string; label: string; summary: string; time: string; color: string }[] {
  const today = new Date().toISOString().split('T')[0]
  const feed: { emoji: string; label: string; summary: string; time: string; color: string; ts: number }[] = []

  for (const p of LOG_PANELS) {
    try {
      const entries = JSON.parse(localStorage.getItem(p.key) || '[]')
      for (const e of entries) {
        const date = (e.date as string) || (e.createdAt as string | undefined)?.split('T')[0] || ''
        if (date !== today) continue
        const timeStr = e.createdAt ? new Date(e.createdAt as string).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''
        const textField = Object.keys(e).find(k =>
          typeof e[k] === 'string' && (e[k] as string).length > 5 &&
          !['id', 'date', 'createdAt'].includes(k)
        )
        feed.push({
          emoji: p.emoji, label: p.label, color: p.color,
          summary: textField ? (e[textField] as string).slice(0, 60) : `${p.label} logged`,
          time: timeStr,
          ts: e.createdAt ? new Date(e.createdAt as string).getTime() : 0,
        })
      }
    } catch { /**/ }
  }

  return feed.sort((a, b) => b.ts - a.ts).slice(0, 12)
}

function QuickStat({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className="game-card p-3 text-center">
      <div className="text-xl font-bold" style={{ color }}>{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
      {sub && <div className="text-xs text-slate-700 mt-0.5">{sub}</div>}
    </div>
  )
}

export default function CommandCenter() {
  const [panels, setPanels] = useState<PanelData[]>([])
  const [feed, setFeed] = useState<{ emoji: string; label: string; summary: string; time: string; color: string }[]>([])
  const [view, setView] = useState<'grid' | 'feed'>('grid')

  useEffect(() => {
    setPanels(loadPanels())
    setFeed(loadTodayFeed())
  }, [])

  const loggedToday = panels.filter(p => p.loggedToday).length
  const totalLogged = panels.reduce((s, p) => s + p.totalEntries, 0)
  const avgScore = (() => {
    const valid = panels.filter(p => p.score !== null)
    return valid.length ? Math.round(valid.reduce((s, p) => s + (p.score ?? 0), 0) / valid.length * 10) : 0
  })()

  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const dateStr = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      {/* Header */}
      <div className="game-card p-4 border border-slate-700">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs text-slate-600 uppercase tracking-widest">{dateStr}</div>
            <h1 className="text-xl font-bold text-white mt-0.5" style={{ fontFamily: 'Orbitron, monospace' }}>
              {greeting}
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">Your life, mission control.</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-slate-300" style={{ fontFamily: 'Orbitron, monospace' }}>
              {timeStr}
            </div>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        <QuickStat label="Logged Today" value={`${loggedToday}/${panels.length}`} color="#22c55e" />
        <QuickStat label="Avg Score" value={`${avgScore}/100`} color="#f59e0b" />
        <QuickStat label="Total Entries" value={totalLogged} color="#6366f1" />
      </div>

      {/* Today's progress bar */}
      <div className="game-card p-3">
        <div className="flex justify-between text-xs text-slate-500 mb-1.5">
          <span>Today's logging coverage</span>
          <span>{Math.round((loggedToday / panels.length) * 100)}%</span>
        </div>
        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-green-600 to-emerald-400 rounded-full transition-all"
            style={{ width: `${(loggedToday / panels.length) * 100}%` }} />
        </div>
        {loggedToday === 0 && (
          <p className="text-xs text-slate-600 mt-1.5">Nothing logged yet today. Start anywhere.</p>
        )}
      </div>

      {/* View toggle */}
      <div className="flex gap-2">
        <button onClick={() => setView('grid')}
          className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${view === 'grid' ? 'bg-violet-700 text-white' : 'bg-slate-800 text-slate-400'}`}>
          Dimensions
        </button>
        <button onClick={() => setView('feed')}
          className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${view === 'feed' ? 'bg-violet-700 text-white' : 'bg-slate-800 text-slate-400'}`}>
          Today's Log {feed.length > 0 && `(${feed.length})`}
        </button>
      </div>

      {/* GRID VIEW */}
      {view === 'grid' && (
        <div className="grid grid-cols-2 gap-2">
          {panels.map(p => (
            <NavLink key={p.key} to={p.route}
              className="game-card p-3 flex flex-col gap-1.5 hover:border-slate-600 transition-colors relative"
              style={{ borderLeft: `3px solid ${p.color}` }}>
              {p.loggedToday && (
                <CheckCircle2 className="w-3.5 h-3.5 absolute top-2.5 right-2.5 text-green-400" />
              )}
              {!p.loggedToday && p.totalEntries > 0 && (
                <Clock className="w-3.5 h-3.5 absolute top-2.5 right-2.5 text-slate-700" />
              )}
              <div className="flex items-center gap-1.5">
                <span className="text-lg">{p.emoji}</span>
                <span className="text-xs font-semibold text-white">{p.label}</span>
              </div>
              {p.score !== null ? (
                <>
                  <div className="text-base font-bold" style={{ color: p.color }}>
                    {p.score * 10}<span className="text-xs text-slate-600">/100</span>
                  </div>
                  <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${p.score * 10}%`, background: p.color }} />
                  </div>
                </>
              ) : (
                <div className="text-xs text-slate-600">Not logged yet</div>
              )}
              {p.lastEntry && (
                <p className="text-xs text-slate-600 line-clamp-1">{p.lastEntry}</p>
              )}
            </NavLink>
          ))}
        </div>
      )}

      {/* FEED VIEW */}
      {view === 'feed' && (
        <div className="space-y-2">
          {feed.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Circle className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Nothing logged today yet.</p>
            </div>
          ) : (
            feed.map((item, i) => (
              <div key={i} className="game-card p-3 flex items-start gap-3"
                style={{ borderLeft: `3px solid ${item.color}` }}>
                <span className="text-xl flex-shrink-0">{item.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white">{item.label}</span>
                    {item.time && <span className="text-xs text-slate-600">{item.time}</span>}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{item.summary}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Quick Navigation to power pages */}
      <div className="game-card p-4">
        <div className="text-xs text-slate-500 uppercase tracking-widest mb-3">Power Pages</div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { to: '/life-score-engine',      label: 'Life Score Engine',  emoji: '⚡' },
            { to: '/ultimate-morning',       label: 'Morning Ritual',     emoji: '🌅' },
            { to: '/ikigai-compass',         label: 'Ikigai Compass',     emoji: '🧭' },
            { to: '/screen-time-connect',    label: 'Screen Time',        emoji: '📱' },
          ].map(item => (
            <NavLink key={item.to} to={item.to}
              className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm text-slate-300 transition-colors">
              <span>{item.emoji}</span>
              <span className="truncate">{item.label}</span>
              <ChevronRight className="w-3.5 h-3.5 ml-auto text-slate-600 flex-shrink-0" />
            </NavLink>
          ))}
        </div>
      </div>

      {/* Motivational footer */}
      <div className="text-center pb-2">
        <div className="flex items-center justify-center gap-1.5 text-xs text-slate-700">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Every log is a vote for the person you are becoming.</span>
          <Zap className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  )
}

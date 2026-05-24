import { useState, useEffect, useRef } from 'react'
import { Smartphone, Timer, Plus, Trash2, Info, ExternalLink, BarChart3 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type AppCategory = 'social-media' | 'entertainment' | 'productivity' | 'health' | 'news' | 'games' | 'shopping' | 'education' | 'communication' | 'other'
type Platform = 'ios' | 'android'

interface DailyScreenTimeEntry {
  id: string
  date: string
  totalMinutes: number
  platform: Platform
  breakdown: Partial<Record<AppCategory, number>>
  pickups: number
  notificationsReceived: number
  longestSession: number
  firstPickup: string
  lastPickup: string
  notes: string
  createdAt: string
}

const CATEGORY_CONFIG: Record<AppCategory, { label: string; emoji: string; color: string }> = {
  'social-media':  { label: 'Social Media',  emoji: '📱', color: '#3b82f6' },
  entertainment:   { label: 'Entertainment', emoji: '📺', color: '#ef4444' },
  productivity:    { label: 'Productivity',  emoji: '⚙️', color: '#22c55e' },
  health:          { label: 'Health & Fitness', emoji: '💪', color: '#10b981' },
  news:            { label: 'News',           emoji: '📰', color: '#6366f1' },
  games:           { label: 'Games',          emoji: '🎮', color: '#a855f7' },
  shopping:        { label: 'Shopping',       emoji: '🛒', color: '#f59e0b' },
  education:       { label: 'Education',      emoji: '📚', color: '#f97316' },
  communication:   { label: 'Communication', emoji: '💬', color: '#ec4899' },
  other:           { label: 'Other',          emoji: '🔧', color: '#94a3b8' },
}

const STORAGE_KEY = 'screen_time_connect'
const SESSION_KEY = 'screen_time_session_start'

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

function minutesToHM(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

const EMPTY_BREAKDOWN: Partial<Record<AppCategory, number>> = {}

export default function ScreenTimeConnect() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<DailyScreenTimeEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [showGuide, setShowGuide] = useState(false)
  const [sessionSeconds, setSessionSeconds] = useState(0)
  const [isVisible, setIsVisible] = useState(!document.hidden)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [platform, setPlatform] = useState<Platform>('ios')
  const [breakdown, setBreakdown] = useState<Partial<Record<AppCategory, number>>>(EMPTY_BREAKDOWN)
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    totalMinutes: 120,
    pickups: 40,
    notificationsReceived: 60,
    longestSession: 30,
    firstPickup: '07:30',
    lastPickup: '22:00',
    notes: '',
  })

  // Load persisted entries
  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
    // Restore session timer from sessionStorage so refreshes don't reset it
    const start = sessionStorage.getItem(SESSION_KEY)
    if (start) {
      const elapsed = Math.floor((Date.now() - Number(start)) / 1000)
      setSessionSeconds(elapsed)
    } else {
      sessionStorage.setItem(SESSION_KEY, String(Date.now()))
    }
  }, [])

  // Page Visibility API — pause timer when tab is hidden
  useEffect(() => {
    const handler = () => {
      const visible = !document.hidden
      setIsVisible(visible)
      if (!visible) {
        // Persist elapsed time so we can resume correctly
        const start = sessionStorage.getItem(SESSION_KEY)
        if (start) {
          const elapsed = Math.floor((Date.now() - Number(start)) / 1000)
          setSessionSeconds(elapsed)
        }
      } else {
        // Reset start so timer continues from current elapsed
        sessionStorage.setItem(SESSION_KEY, String(Date.now() - sessionSeconds * 1000))
      }
    }
    document.addEventListener('visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
  }, [sessionSeconds])

  // Live ticker — only runs when tab is visible
  useEffect(() => {
    if (isVisible) {
      timerRef.current = setInterval(() => {
        const start = sessionStorage.getItem(SESSION_KEY)
        if (start) {
          const elapsed = Math.floor((Date.now() - Number(start)) / 1000)
          setSessionSeconds(elapsed)
        }
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [isVisible])

  const saveEntries = (u: DailyScreenTimeEntry[]) => {
    setEntries(u)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u))
  }

  const submit = () => {
    const total = form.totalMinutes || Object.values(breakdown).reduce((s, v) => s + (v || 0), 0)
    if (!total) return
    const entry: DailyScreenTimeEntry = {
      id: Date.now().toString(),
      ...form,
      totalMinutes: total,
      platform,
      breakdown,
      createdAt: new Date().toISOString(),
    }
    saveEntries([entry, ...entries])
    setBreakdown(EMPTY_BREAKDOWN)
    setForm(f => ({ ...f, notes: '', pickups: 40, notificationsReceived: 60, longestSession: 30, totalMinutes: 120 }))
    setShowForm(false)
    toastSuccess('Screen time logged — awareness is the first step to digital freedom 📱')
  }

  const totalMinutesThisWeek = entries
    .filter(e => {
      const d = new Date(e.date)
      const now = new Date()
      const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)
      return diff <= 7
    })
    .reduce((s, e) => s + e.totalMinutes, 0)

  const avgDaily = entries.length
    ? Math.round(entries.reduce((s, e) => s + e.totalMinutes, 0) / entries.length)
    : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Smartphone className="w-7 h-7 text-blue-400" />
            Screen Time Connect
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Import your phone's screen time data and track usage patterns.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowGuide(g => !g)}
            className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-400 hover:text-white rounded-xl">
            <Info className="w-4 h-4" />
          </button>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold">
            <Plus className="w-4 h-4" /> Import
          </button>
        </div>
      </div>

      {/* Live Session Timer */}
      <div className="game-card p-4 border border-blue-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Timer className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Live Session in LifeQuest</span>
            <span className={`w-2 h-2 rounded-full ${isVisible ? 'bg-green-400 animate-pulse' : 'bg-slate-600'}`} />
          </div>
          <span className="text-xs text-slate-500">{isVisible ? 'Active' : 'Paused (tab hidden)'}</span>
        </div>
        <div className="mt-3 flex items-end gap-3">
          <span className="text-4xl font-bold text-blue-400" style={{ fontFamily: 'Orbitron, monospace' }}>
            {formatDuration(sessionSeconds)}
          </span>
          <span className="text-xs text-slate-500 mb-1.5">this session</span>
        </div>
        <p className="text-xs text-slate-600 mt-1">Tracked automatically via the Page Visibility API. Pauses when you switch tabs.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{minutesToHM(avgDaily)}</div>
          <div className="text-xs text-slate-500">Avg/Day</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-blue-400">{minutesToHM(totalMinutesThisWeek)}</div>
          <div className="text-xs text-slate-500">This Week</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-cyan-400">{entries.length}</div>
          <div className="text-xs text-slate-500">Days Logged</div>
        </div>
      </div>

      {/* Integration Guide */}
      {showGuide && (
        <div className="game-card p-4 border border-slate-600 space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-400" /> How to Find Your Screen Time Data
          </h3>

          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-widest">iPhone (iOS)</span>
            </div>
            <ol className="text-xs text-slate-400 space-y-1 pl-4 list-decimal">
              <li>Open <strong className="text-white">Settings</strong></li>
              <li>Tap <strong className="text-white">Screen Time</strong></li>
              <li>Tap <strong className="text-white">See All Activity</strong> (today or last 7 days)</li>
              <li>Note your total and per-category breakdown</li>
              <li>Tap <strong className="text-white">Pickups</strong> tab for pickup count and first pickup time</li>
            </ol>
            <a
              href="https://support.apple.com/en-us/111829"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 mt-1"
            >
              Apple Screen Time guide <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="space-y-2 border-t border-slate-700 pt-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-widest">Android (Digital Wellbeing)</span>
            </div>
            <ol className="text-xs text-slate-400 space-y-1 pl-4 list-decimal">
              <li>Open <strong className="text-white">Settings</strong></li>
              <li>Tap <strong className="text-white">Digital Wellbeing & parental controls</strong></li>
              <li>View your <strong className="text-white">Dashboard</strong> for today's total</li>
              <li>Tap the pie chart to see per-app breakdown</li>
              <li>Check <strong className="text-white">Unlocks</strong> for your pickup count</li>
            </ol>
            <a
              href="https://wellbeing.google/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 mt-1"
            >
              Google Digital Wellbeing <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <p className="text-xs text-slate-600 border-t border-slate-700 pt-3">
            Note: Direct API access to iOS Screen Time or Android Digital Wellbeing is not available to web apps — these APIs are restricted to native device apps. This app gives you the best alternative: structured import + live in-app tracking.
          </p>
        </div>
      )}

      {/* Import Form */}
      {showForm && (
        <div className="game-card p-4 border border-blue-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Import Screen Time Data</h3>

          <div className="flex gap-2">
            <button onClick={() => setPlatform('ios')}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${platform === 'ios' ? 'bg-blue-700 text-white' : 'bg-slate-700 text-slate-400'}`}>
              iPhone (iOS)
            </button>
            <button onClick={() => setPlatform('android')}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${platform === 'android' ? 'bg-green-700 text-white' : 'bg-slate-700 text-slate-400'}`}>
              Android
            </button>
          </div>

          <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            className="game-input w-full text-sm" />

          <div>
            <p className="text-xs text-slate-500 mb-1">Total screen time (minutes): {minutesToHM(form.totalMinutes)}</p>
            <input type="range" min={0} max={720} value={form.totalMinutes}
              onChange={e => setForm(f => ({ ...f, totalMinutes: Number(e.target.value) }))}
              className="w-full h-1 accent-blue-400" />
          </div>

          {/* Per-category breakdown */}
          <div>
            <p className="text-xs text-slate-500 mb-2">Per-category breakdown (minutes) — leave blank to skip</p>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(CATEGORY_CONFIG) as [AppCategory, typeof CATEGORY_CONFIG['social-media']][]).map(([k, c]) => (
                <div key={k} className="flex items-center gap-1.5">
                  <span className="text-sm">{c.emoji}</span>
                  <input
                    type="number"
                    min={0}
                    placeholder={c.label}
                    value={breakdown[k] ?? ''}
                    onChange={e => setBreakdown(b => ({ ...b, [k]: e.target.value === '' ? undefined : Number(e.target.value) }))}
                    className="game-input text-xs flex-1 py-1"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-xs text-slate-500 mb-1">Pickups: {form.pickups}</p>
              <input type="range" min={0} max={300} value={form.pickups}
                onChange={e => setForm(f => ({ ...f, pickups: Number(e.target.value) }))}
                className="w-full h-1 accent-blue-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Notifications: {form.notificationsReceived}</p>
              <input type="range" min={0} max={500} value={form.notificationsReceived}
                onChange={e => setForm(f => ({ ...f, notificationsReceived: Number(e.target.value) }))}
                className="w-full h-1 accent-blue-400" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-xs text-slate-500 mb-1">Longest session: {form.longestSession}m</p>
              <input type="range" min={0} max={240} value={form.longestSession}
                onChange={e => setForm(f => ({ ...f, longestSession: Number(e.target.value) }))}
                className="w-full h-1 accent-blue-400" />
            </div>
            <div className="space-y-1">
              <p className="text-xs text-slate-500">First pickup</p>
              <input type="time" value={form.firstPickup}
                onChange={e => setForm(f => ({ ...f, firstPickup: e.target.value }))}
                className="game-input text-xs w-full py-1" />
            </div>
          </div>

          <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Notes (e.g. heavy usage day, travel, stressful)" className="game-input w-full text-sm" />

          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Entry List */}
      <div className="space-y-2">
        {entries.map(e => {
          const topCategory = (Object.entries(e.breakdown) as [AppCategory, number][])
            .sort(([, a], [, b]) => b - a)[0]
          const topConf = topCategory ? CATEGORY_CONFIG[topCategory[0]] : null
          return (
            <div key={e.id} className="game-card p-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="w-4 h-4 text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium text-white">{e.date}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">
                      {minutesToHM(e.totalMinutes)}
                    </span>
                    <span className="text-xs text-slate-500 capitalize">{e.platform}</span>
                    {topConf && (
                      <span className="text-xs text-slate-400">{topConf.emoji} {topConf.label}</span>
                    )}
                  </div>
                  <div className="flex gap-3 mt-1 text-xs text-slate-500">
                    {e.pickups > 0 && <span>📲 {e.pickups} pickups</span>}
                    {e.notificationsReceived > 0 && <span>🔔 {e.notificationsReceived} notifs</span>}
                    {e.longestSession > 0 && <span>⏱ {e.longestSession}m longest</span>}
                  </div>
                  {/* Category bar */}
                  {Object.keys(e.breakdown).length > 0 && (
                    <div className="flex gap-0.5 mt-2 h-1.5 rounded-full overflow-hidden">
                      {(Object.entries(e.breakdown) as [AppCategory, number][])
                        .filter(([, v]) => v > 0)
                        .sort(([, a], [, b]) => b - a)
                        .map(([cat, mins]) => {
                          const pct = (mins / e.totalMinutes) * 100
                          return (
                            <div
                              key={cat}
                              title={`${CATEGORY_CONFIG[cat].label}: ${mins}m`}
                              style={{ width: `${pct}%`, background: CATEGORY_CONFIG[cat].color }}
                            />
                          )
                        })}
                    </div>
                  )}
                  {e.notes && <p className="text-xs text-slate-500 mt-1 line-clamp-1">{e.notes}</p>}
                </div>
                <button onClick={() => saveEntries(entries.filter(x => x.id !== e.id))}
                  className="text-slate-700 hover:text-red-400 flex-shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Smartphone className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Import your first day of screen time data from your phone.</p>
            <button onClick={() => setShowGuide(true)} className="mt-2 text-xs text-blue-400 hover:text-blue-300">
              How to find your screen time →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

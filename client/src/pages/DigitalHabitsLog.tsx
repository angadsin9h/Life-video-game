import { useState, useEffect } from 'react'
import { Smartphone, Plus, Trash2, Save, TrendingUp, BarChart3, Clock, Target } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface AppUsage {
  appName: string
  category: 'social' | 'news' | 'entertainment' | 'work' | 'learning' | 'communication' | 'health' | 'other'
  minutes: number
  intentional: boolean
}

interface DigitalHabitsEntry {
  id: string
  date: string
  totalScreenTime: number
  appUsages: AppUsage[]
  phonePickups: number
  firstCheckTime: string
  lastCheckTime: string
  noPhoneZones: string[]
  digitalWellbeingScore: 1|2|3|4|5|6|7|8|9|10
  notes: string
}

const STORAGE_KEY = 'digital_habits_log'

const CATEGORY_COLORS: Record<AppUsage['category'], string> = {
  social:        '#f97316',
  news:          '#ef4444',
  entertainment: '#a855f7',
  work:          '#3b82f6',
  learning:      '#22c55e',
  communication: '#06b6d4',
  health:        '#ec4899',
  other:         '#94a3b8',
}

const CATEGORIES: AppUsage['category'][] = ['social','news','entertainment','work','learning','communication','health','other']

const NO_PHONE_ZONE_OPTIONS = [
  { key: 'bedroom',    label: '🛏 Bedroom' },
  { key: 'meals',      label: '🍽 Meals' },
  { key: 'first_hour', label: '🌅 First Hour' },
  { key: 'last_hour',  label: '🌙 Last Hour' },
  { key: 'meetings',   label: '💼 Meetings' },
  { key: 'reading',    label: '📚 Reading' },
  { key: 'exercise',   label: '💪 Exercise' },
]

const blankApp = (): AppUsage => ({ appName: '', category: 'social', minutes: 0, intentional: false })

const blankForm = (): Omit<DigitalHabitsEntry, 'id'> => ({
  date: new Date().toISOString().split('T')[0],
  totalScreenTime: 0,
  appUsages: [],
  phonePickups: 0,
  firstCheckTime: '07:00',
  lastCheckTime: '22:00',
  noPhoneZones: [],
  digitalWellbeingScore: 7,
  notes: '',
})

function formatMins(m: number) {
  const h = Math.floor(m / 60)
  const min = m % 60
  if (h === 0) return `${min}m`
  return min === 0 ? `${h}h` : `${h}h ${min}m`
}

export default function DigitalHabitsLog() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<DigitalHabitsEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<DigitalHabitsEntry, 'id'>>(blankForm())
  const [newApp, setNewApp] = useState<AppUsage>(blankApp())

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const persist = (u: DigitalHabitsEntry[]) => {
    setEntries(u)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u))
  }

  const addApp = () => {
    if (!newApp.appName.trim()) return
    setForm(f => ({ ...f, appUsages: [...f.appUsages, { ...newApp }] }))
    setNewApp(blankApp())
  }

  const removeApp = (i: number) => {
    setForm(f => ({ ...f, appUsages: f.appUsages.filter((_, idx) => idx !== i) }))
  }

  const toggleZone = (key: string) => {
    setForm(f => ({
      ...f,
      noPhoneZones: f.noPhoneZones.includes(key)
        ? f.noPhoneZones.filter(z => z !== key)
        : [...f.noPhoneZones, key],
    }))
  }

  const submit = () => {
    const entry: DigitalHabitsEntry = { id: Date.now().toString(), ...form }
    persist([entry, ...entries])
    setForm(blankForm())
    setNewApp(blankApp())
    setShowForm(false)
    toastSuccess('Digital habits logged! 📱')
  }

  // Derived stats
  const last7 = entries.slice(0, 7).reverse()
  const avg7ScreenTime = last7.length
    ? Math.round(last7.reduce((s, e) => s + e.totalScreenTime, 0) / last7.length)
    : 0
  const avg7Wellbeing = last7.length
    ? +(last7.reduce((s, e) => s + e.digitalWellbeingScore, 0) / last7.length).toFixed(1)
    : 0
  const avg7Pickups = last7.length
    ? Math.round(last7.reduce((s, e) => s + e.phonePickups, 0) / last7.length)
    : 0

  // Intentional vs mindless ratio
  let intentionalMins = 0, mindlessMins = 0
  for (const e of entries) {
    for (const a of e.appUsages) {
      if (a.intentional) intentionalMins += a.minutes
      else mindlessMins += a.minutes
    }
  }
  const totalAppMins = intentionalMins + mindlessMins
  const intentionalPct = totalAppMins > 0 ? Math.round((intentionalMins / totalAppMins) * 100) : 0

  // App category breakdown (last entry)
  const lastEntry = entries[0]
  const categoryMins: Partial<Record<AppUsage['category'], number>> = {}
  if (lastEntry) {
    for (const a of lastEntry.appUsages) {
      categoryMins[a.category] = (categoryMins[a.category] || 0) + a.minutes
    }
  }
  const catEntries = Object.entries(categoryMins) as [AppUsage['category'], number][]
  const maxCatMins = catEntries.length ? Math.max(...catEntries.map(([, m]) => m)) : 1

  // 7-day chart data
  const chartMax = last7.length ? Math.max(...last7.map(e => e.totalScreenTime), 1) : 1

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Smartphone className="w-7 h-7 text-cyan-400" />
            Digital Habits Log
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track screen time, app usage, and build healthier digital patterns.</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1.5 px-4 py-2 bg-cyan-700 hover:bg-cyan-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log Today
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="flex items-center justify-center gap-1 mb-1"><Clock className="w-3.5 h-3.5 text-cyan-400" /></div>
          <div className="text-xl font-bold text-white">{avg7ScreenTime ? formatMins(avg7ScreenTime) : '—'}</div>
          <div className="text-xs text-slate-500">Avg Screen Time</div>
        </div>
        <div className="game-card p-3">
          <div className="flex items-center justify-center gap-1 mb-1"><TrendingUp className="w-3.5 h-3.5 text-green-400" /></div>
          <div className="text-xl font-bold text-green-400">{avg7Wellbeing || '—'}<span className="text-sm text-slate-500">/10</span></div>
          <div className="text-xs text-slate-500">Avg Wellbeing</div>
        </div>
        <div className="game-card p-3">
          <div className="flex items-center justify-center gap-1 mb-1"><Target className="w-3.5 h-3.5 text-orange-400" /></div>
          <div className="text-xl font-bold text-orange-400">{avg7Pickups || '—'}</div>
          <div className="text-xs text-slate-500">Avg Pickups</div>
        </div>
      </div>

      {/* Log Form */}
      {showForm && (
        <div className="game-card p-4 border border-cyan-500/20 space-y-4">
          <h3 className="text-sm font-semibold text-white">Log Today's Digital Use</h3>

          {/* Date */}
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Date</label>
            <input type="date" value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              className="game-input text-sm w-full" />
          </div>

          {/* Screen time */}
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Total Screen Time (minutes)</label>
            <input type="number" min={0} value={form.totalScreenTime || ''}
              onChange={e => setForm(f => ({ ...f, totalScreenTime: Number(e.target.value) }))}
              placeholder="e.g. 120" className="game-input text-sm w-full" />
            <div className="flex gap-2 mt-2 flex-wrap">
              {[30, 60, 120, 180, 240].map(m => (
                <button key={m} onClick={() => setForm(f => ({ ...f, totalScreenTime: m }))}
                  className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-xs">
                  {m === 240 ? '4h+' : formatMins(m)}
                </button>
              ))}
            </div>
          </div>

          {/* Check times */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">First Check Time</label>
              <input type="time" value={form.firstCheckTime}
                onChange={e => setForm(f => ({ ...f, firstCheckTime: e.target.value }))}
                className="game-input text-sm w-full" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Last Check Time</label>
              <input type="time" value={form.lastCheckTime}
                onChange={e => setForm(f => ({ ...f, lastCheckTime: e.target.value }))}
                className="game-input text-sm w-full" />
            </div>
          </div>

          {/* Phone pickups */}
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Phone Pickups</label>
            <div className="flex items-center gap-3">
              <button onClick={() => setForm(f => ({ ...f, phonePickups: Math.max(0, f.phonePickups - 1) }))}
                className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold text-lg flex items-center justify-center">
                −
              </button>
              <span className="text-xl font-bold text-white w-12 text-center">{form.phonePickups}</span>
              <button onClick={() => setForm(f => ({ ...f, phonePickups: f.phonePickups + 1 }))}
                className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold text-lg flex items-center justify-center">
                +
              </button>
            </div>
          </div>

          {/* App usages */}
          <div>
            <label className="text-xs text-slate-400 mb-2 block">App Usages
              {form.appUsages.length > 0 && (
                <span className="ml-2 text-cyan-400">
                  Total: {formatMins(form.appUsages.reduce((s, a) => s + a.minutes, 0))}
                </span>
              )}
            </label>
            {form.appUsages.map((a, i) => (
              <div key={i} className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-xs text-slate-300 flex-1 min-w-0 truncate">{a.appName}</span>
                <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: CATEGORY_COLORS[a.category] + '30', color: CATEGORY_COLORS[a.category] }}>{a.category}</span>
                <span className="text-xs text-slate-400">{formatMins(a.minutes)}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded ${a.intentional ? 'bg-green-900/40 text-green-400' : 'bg-orange-900/40 text-orange-400'}`}>
                  {a.intentional ? 'Intentional' : 'Mindless'}
                </span>
                <button onClick={() => removeApp(i)} className="text-slate-600 hover:text-red-400">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
            {/* Add app row */}
            <div className="grid grid-cols-2 gap-2 mt-2">
              <input value={newApp.appName}
                onChange={e => setNewApp(a => ({ ...a, appName: e.target.value }))}
                placeholder="App name" className="game-input text-sm" />
              <select value={newApp.category}
                onChange={e => setNewApp(a => ({ ...a, category: e.target.value as AppUsage['category'] }))}
                className="game-input text-sm">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input type="number" min={0} value={newApp.minutes || ''}
                onChange={e => setNewApp(a => ({ ...a, minutes: Number(e.target.value) }))}
                placeholder="Minutes" className="game-input text-sm" />
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setNewApp(a => ({ ...a, intentional: !a.intentional }))}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold ${newApp.intentional ? 'bg-green-700 text-white' : 'bg-slate-700 text-slate-400'}`}>
                  {newApp.intentional ? '✓ Intentional' : 'Mindless'}
                </button>
                <button onClick={addApp}
                  className="px-3 py-2 bg-cyan-700 hover:bg-cyan-600 text-white rounded-lg text-xs">
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* No-phone zones */}
          <div>
            <label className="text-xs text-slate-400 mb-2 block">No-Phone Zones</label>
            <div className="flex flex-wrap gap-2">
              {NO_PHONE_ZONE_OPTIONS.map(z => (
                <button key={z.key}
                  onClick={() => toggleZone(z.key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    form.noPhoneZones.includes(z.key)
                      ? 'bg-cyan-700 text-white'
                      : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                  }`}>
                  {z.label}
                </button>
              ))}
            </div>
          </div>

          {/* Wellbeing score */}
          <div>
            <label className="text-xs text-slate-400 mb-2 block">Digital Wellbeing Score: {form.digitalWellbeingScore}/10</label>
            <div className="flex gap-1.5">
              {([1,2,3,4,5,6,7,8,9,10] as const).map(n => (
                <button key={n}
                  onClick={() => setForm(f => ({ ...f, digitalWellbeingScore: n }))}
                  className="flex-1 py-2 rounded-lg text-xs font-bold transition-all"
                  style={{
                    background: form.digitalWellbeingScore === n
                      ? (n <= 3 ? '#ef4444' : n <= 6 ? '#f59e0b' : '#22c55e') + '40'
                      : '#1e293b',
                    border: form.digitalWellbeingScore === n
                      ? `1px solid ${n <= 3 ? '#ef4444' : n <= 6 ? '#f59e0b' : '#22c55e'}`
                      : '1px solid transparent',
                    color: form.digitalWellbeingScore === n
                      ? (n <= 3 ? '#ef4444' : n <= 6 ? '#f59e0b' : '#22c55e')
                      : '#475569',
                  }}>
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <textarea value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Notes (reflections, observations...)"
            className="game-input w-full h-16 resize-none text-sm" />

          {/* Actions */}
          <div className="flex gap-2">
            <button onClick={submit}
              className="flex-1 py-2 bg-cyan-700 hover:bg-cyan-600 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5">
              <Save className="w-4 h-4" /> Save Entry
            </button>
            <button onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* 7-day screen time chart */}
      {last7.length > 0 && (
        <div className="game-card p-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" /> 7-Day Screen Time
          </h3>
          <div className="flex items-end gap-2 h-28">
            {last7.map((e, i) => {
              const pct = chartMax > 0 ? e.totalScreenTime / chartMax : 0
              const isHigh = e.totalScreenTime > 180
              const color = isHigh && e.digitalWellbeingScore < 5
                ? '#ef4444'
                : e.digitalWellbeingScore >= 7
                  ? '#22c55e'
                  : '#f59e0b'
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <div className="absolute bottom-full mb-1 hidden group-hover:block bg-slate-700 text-xs text-white px-2 py-1 rounded whitespace-nowrap z-10">
                    {e.date.slice(5)}: {formatMins(e.totalScreenTime)}, score {e.digitalWellbeingScore}/10
                  </div>
                  {e.totalScreenTime > 0 && (
                    <div className="text-[9px] text-slate-500">{formatMins(e.totalScreenTime)}</div>
                  )}
                  <div className="w-full rounded-t-sm" style={{ height: `${Math.max(pct * 80, 4)}px`, background: color }} />
                  <div className="text-[8px] text-slate-600">
                    {new Date(e.date + 'T12:00:00').toLocaleDateString('en', { weekday: 'short' }).slice(0, 1)}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="flex justify-between text-[10px] text-slate-600 mt-1">
            <span className="text-green-500/70">● Low/Mindful</span>
            <span className="text-yellow-500/70">● Moderate</span>
            <span className="text-red-500/70">● High+Low score</span>
          </div>
        </div>
      )}

      {/* App category breakdown */}
      {lastEntry && catEntries.length > 0 && (
        <div className="game-card p-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
            App Category Breakdown <span className="text-slate-600 normal-case">(last entry)</span>
          </h3>
          <div className="space-y-2">
            {catEntries.sort((a, b) => b[1] - a[1]).map(([cat, mins]) => (
              <div key={cat} className="flex items-center gap-3">
                <div className="w-20 text-xs text-slate-400 capitalize text-right">{cat}</div>
                <div className="flex-1 h-5 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${maxCatMins > 0 ? (mins / maxCatMins) * 100 : 0}%`,
                      background: CATEGORY_COLORS[cat],
                    }} />
                </div>
                <div className="w-12 text-xs text-slate-400 text-right">{formatMins(mins)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Intentional vs Mindless */}
      {totalAppMins > 0 && (
        <div className="game-card p-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Intentional vs Mindless Usage
          </h3>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm font-bold text-green-400">{intentionalPct}%</span>
            <div className="flex-1 h-4 bg-slate-700 rounded-full overflow-hidden flex">
              <div className="h-full bg-green-500 rounded-l-full transition-all" style={{ width: `${intentionalPct}%` }} />
              <div className="h-full bg-orange-500 rounded-r-full flex-1" />
            </div>
            <span className="text-sm font-bold text-orange-400">{100 - intentionalPct}%</span>
          </div>
          <div className="flex justify-between text-xs text-slate-500">
            <span>● Intentional ({formatMins(intentionalMins)})</span>
            <span>Mindless ({formatMins(mindlessMins)}) ●</span>
          </div>
        </div>
      )}

      {/* Recent entries */}
      {entries.length > 0 && (
        <div className="game-card p-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Recent Entries</h3>
          <div className="space-y-2">
            {entries.slice(0, 7).map(e => {
              const score = e.digitalWellbeingScore
              const scoreColor = score >= 7 ? '#22c55e' : score >= 5 ? '#f59e0b' : '#ef4444'
              return (
                <div key={e.id} className="flex items-center gap-3 py-2 border-b border-slate-700/50 last:border-0">
                  <div className="text-xs text-slate-500 w-20 flex-shrink-0">{e.date}</div>
                  <div className="flex-1 flex items-center gap-3 flex-wrap">
                    <span className="text-xs text-slate-300">{formatMins(e.totalScreenTime)}</span>
                    <span className="text-xs text-slate-400">{e.phonePickups} pickups</span>
                    {e.noPhoneZones.length > 0 && (
                      <span className="text-xs text-cyan-400">{e.noPhoneZones.length} zones</span>
                    )}
                  </div>
                  <div className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: scoreColor + '25', color: scoreColor }}>
                    {score}/10
                  </div>
                  <button onClick={() => persist(entries.filter(x => x.id !== e.id))}
                    className="text-slate-700 hover:text-red-400 flex-shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {entries.length === 0 && !showForm && (
        <div className="text-center py-14 text-slate-500">
          <Smartphone className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm">Start tracking your digital habits to build healthier patterns.</p>
        </div>
      )}
    </div>
  )
}

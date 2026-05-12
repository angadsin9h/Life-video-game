import { useEffect, useState } from 'react'
import { Zap, Plus, TrendingUp, Sun, Moon, Coffee } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface EnergyLog {
  id: string
  date: string
  time: string
  level: number
  mood: number
  tags: string[]
  note: string
}

const ENERGY_TAGS = [
  { label: 'After coffee', emoji: '☕' },
  { label: 'Post-workout', emoji: '💪' },
  { label: 'After lunch', emoji: '🍽️' },
  { label: 'Afternoon dip', emoji: '😴' },
  { label: 'Well slept', emoji: '😴' },
  { label: 'Poor sleep', emoji: '🌙' },
  { label: 'Stressed', emoji: '😰' },
  { label: 'Meditated', emoji: '🧘' },
]

const STORAGE_KEY = 'energy_logs'

const energyColor = (level: number) => {
  if (level >= 8) return '#22c55e'
  if (level >= 6) return '#84cc16'
  if (level >= 4) return '#eab308'
  if (level >= 2) return '#f97316'
  return '#ef4444'
}

const energyLabel = (level: number) => {
  if (level >= 9) return 'Peak'
  if (level >= 7) return 'High'
  if (level >= 5) return 'Medium'
  if (level >= 3) return 'Low'
  return 'Drained'
}

export default function EnergyTracker() {
  const { toastSuccess } = useToast()
  const [logs, setLogs] = useState<EnergyLog[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ level: 5, mood: 3, tags: [] as string[], note: '' })
  const [viewDays, setViewDays] = useState(7)

  const today = new Date().toISOString().split('T')[0]
  const now = new Date().toTimeString().slice(0, 5)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) setLogs(JSON.parse(saved))
  }, [])

  const persist = (updated: EnergyLog[]) => {
    setLogs(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const logEnergy = () => {
    const entry: EnergyLog = {
      id: Date.now().toString(),
      date: today,
      time: now,
      level: form.level,
      mood: form.mood,
      tags: form.tags,
      note: form.note,
    }
    persist([entry, ...logs])
    setForm({ level: 5, mood: 3, tags: [], note: '' })
    setShowForm(false)
    toastSuccess('Energy logged!')
  }

  const toggleTag = (tag: string) => {
    setForm(f => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter(t => t !== tag) : [...f.tags, tag],
    }))
  }

  // Compute averages per hour across all logs
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - viewDays)
  const recent = logs.filter(l => l.date >= cutoff.toISOString().split('T')[0])

  const avgEnergy = recent.length > 0 ? +(recent.reduce((s, l) => s + l.level, 0) / recent.length).toFixed(1) : 0

  // Hourly pattern
  const hourlyData: { hour: number; count: number; total: number }[] = Array.from({ length: 24 }, (_, h) => ({ hour: h, count: 0, total: 0 }))
  recent.forEach(l => {
    const h = parseInt(l.time.split(':')[0])
    hourlyData[h].count++
    hourlyData[h].total += l.level
  })

  // Group by day for chart
  const byDay: Record<string, number[]> = {}
  recent.forEach(l => {
    if (!byDay[l.date]) byDay[l.date] = []
    byDay[l.date].push(l.level)
  })

  const last7: { date: string; avg: number }[] = Array.from({ length: viewDays }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (viewDays - 1 - i))
    const ds = d.toISOString().split('T')[0]
    const vals = byDay[ds] || []
    return { date: ds, avg: vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0 }
  })

  const peakHour = hourlyData.reduce((best, h) => h.count > 0 && h.total / h.count > (best.count > 0 ? best.total / best.count : 0) ? h : best, hourlyData[0])

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Zap className="w-7 h-7 text-yellow-400" />
            Energy Tracker
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Monitor your energy patterns throughout the day</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-3 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-xl text-sm font-semibold transition-colors">
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="game-card p-3 text-center">
          <Zap className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
          <div className="text-xl font-bold" style={{ color: energyColor(avgEnergy) }}>{avgEnergy > 0 ? `${avgEnergy}/10` : '—'}</div>
          <div className="text-xs text-slate-500">Avg Energy</div>
        </div>
        <div className="game-card p-3 text-center">
          <Sun className="w-5 h-5 text-orange-400 mx-auto mb-1" />
          <div className="text-xl font-bold text-orange-400">{peakHour.count > 0 ? `${peakHour.hour}:00` : '—'}</div>
          <div className="text-xs text-slate-500">Peak Hour</div>
        </div>
        <div className="game-card p-3 text-center">
          <TrendingUp className="w-5 h-5 text-violet-400 mx-auto mb-1" />
          <div className="text-xl font-bold text-violet-400">{recent.length}</div>
          <div className="text-xs text-slate-500">Logs ({viewDays}d)</div>
        </div>
      </div>

      {/* Quick log form */}
      {showForm && (
        <div className="game-card p-5 space-y-4 border border-yellow-500/20">
          <h3 className="font-semibold text-slate-300">Log Energy Now</h3>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-slate-400">Energy Level</label>
              <span className="text-sm font-bold" style={{ color: energyColor(form.level) }}>{form.level}/10 — {energyLabel(form.level)}</span>
            </div>
            <input type="range" min="1" max="10" value={form.level} onChange={e => setForm(f => ({ ...f, level: +e.target.value }))}
              className="w-full accent-yellow-400" />
            <div className="flex justify-between text-[10px] text-slate-600 mt-1">
              <span>Drained</span><span>Medium</span><span>Peak</span>
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-2 block">Mood</label>
            <div className="flex gap-2">
              {[['😞', 1], ['😐', 2], ['🙂', 3], ['😊', 4], ['🤩', 5]].map(([emoji, val]) => (
                <button key={val} onClick={() => setForm(f => ({ ...f, mood: val as number }))}
                  className="flex-1 py-2 rounded-lg text-lg transition-all"
                  style={{ background: form.mood === val ? '#1e40af33' : '#1e293b', border: form.mood === val ? '1px solid #3b82f6' : '1px solid transparent' }}>
                  {emoji}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-2 block">Tags</label>
            <div className="flex flex-wrap gap-2">
              {ENERGY_TAGS.map(t => (
                <button key={t.label} onClick={() => toggleTag(t.label)}
                  className="px-2 py-1 rounded-lg text-xs transition-all"
                  style={form.tags.includes(t.label) ? { background: '#eab30833', color: '#eab308', border: '1px solid #eab308' } : { background: '#1e293b', color: '#94a3b8' }}>
                  {t.emoji} {t.label}
                </button>
              ))}
            </div>
          </div>
          <input value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
            placeholder="Optional note..." className="game-input w-full" />
          <div className="flex gap-2">
            <button onClick={logEnergy} className="flex-1 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-xl text-sm font-semibold transition-colors">
              Log Energy
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* View selector */}
      <div className="flex gap-2">
        {[7, 14, 30].map(d => (
          <button key={d} onClick={() => setViewDays(d)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${viewDays === d ? 'bg-yellow-600/20 text-yellow-400 border border-yellow-500/30' : 'text-slate-500 hover:text-slate-300'}`}>
            {d}D
          </button>
        ))}
      </div>

      {/* Daily chart */}
      {last7.some(d => d.avg > 0) && (
        <div className="game-card p-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Daily Average Energy</h3>
          <div className="flex items-end gap-1 h-24">
            {last7.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                {d.avg > 0 && (
                  <div className="absolute bottom-full mb-1 hidden group-hover:block bg-slate-700 text-xs text-white px-2 py-1 rounded whitespace-nowrap z-10">
                    {d.date.slice(5)}: {d.avg.toFixed(1)}/10
                  </div>
                )}
                <div className="w-full rounded-t-sm" style={{
                  height: d.avg > 0 ? `${(d.avg / 10) * 100}%` : '3px',
                  background: d.avg > 0 ? energyColor(d.avg) : '#1e293b',
                  minHeight: '3px',
                  opacity: d.avg > 0 ? 1 : 0.2,
                }} />
                <div className="text-[8px] text-slate-600">
                  {new Date(d.date + 'T12:00:00').toLocaleDateString('en', { weekday: 'short' }).slice(0, 1)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hourly heatmap */}
      {recent.length > 0 && (
        <div className="game-card p-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Hourly Pattern</h3>
          <div className="flex gap-0.5">
            {hourlyData.map(h => {
              const avg = h.count > 0 ? h.total / h.count : 0
              return (
                <div key={h.hour} className="flex-1 group relative">
                  <div className="h-8 rounded-sm" style={{
                    background: h.count > 0 ? energyColor(avg) + '88' : '#1e293b',
                  }} />
                  {h.count > 0 && (
                    <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block bg-slate-700 text-xs text-white px-2 py-1 rounded whitespace-nowrap z-10">
                      {h.hour}:00 — {avg.toFixed(1)}/10 ({h.count} logs)
                    </div>
                  )}
                  {h.hour % 6 === 0 && (
                    <div className="text-[8px] text-slate-600 text-center mt-0.5">{h.hour}h</div>
                  )}
                </div>
              )
            })}
          </div>
          <div className="flex justify-between text-[10px] text-slate-600 mt-1">
            <span>Midnight</span><span>6am</span><span>Noon</span><span>6pm</span><span>11pm</span>
          </div>
        </div>
      )}

      {/* Recent logs */}
      {recent.length > 0 && (
        <div className="game-card p-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Recent Logs</h3>
          <div className="space-y-2">
            {logs.slice(0, 10).map(l => (
              <div key={l.id} className="flex items-center gap-3 py-2 border-b border-slate-800 last:border-0">
                <div className="text-xs text-slate-500 w-20 flex-shrink-0">{l.date.slice(5)} {l.time}</div>
                <div className="flex items-center gap-1">
                  <Zap className="w-3 h-3" style={{ color: energyColor(l.level) }} />
                  <span className="text-sm font-bold" style={{ color: energyColor(l.level) }}>{l.level}</span>
                </div>
                <div className="flex gap-1 flex-wrap flex-1">
                  {l.tags.map(t => <span key={t} className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">{t}</span>)}
                </div>
                {l.note && <span className="text-xs text-slate-500 truncate max-w-24">{l.note}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {logs.length === 0 && !showForm && (
        <div className="text-center py-16 text-slate-500">
          <Zap className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="mb-4">Start tracking your energy levels.</p>
          <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-xl text-sm font-semibold transition-colors">
            Log First Entry
          </button>
        </div>
      )}
    </div>
  )
}

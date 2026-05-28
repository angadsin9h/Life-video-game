import { useEffect, useState } from 'react'
import axios from 'axios'
import { AlertCircle, Plus, Trash2, TrendingDown } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface StressLog {
  id: number
  date: string
  level: number
  triggers: string
  symptoms: string
  coping: string
  after_level: number
  notes: string
  created_at: string
}

const STRESS_TRIGGERS = [
  'Work deadline', 'Conflict', 'Financial', 'Health concern', 'Relationship',
  'Uncertainty', 'Overload', 'Performance', 'Social', 'Family', 'Future',
]

const STRESS_SYMPTOMS = [
  'Headache', 'Tension', 'Fatigue', 'Irritability', 'Difficulty concentrating',
  'Racing thoughts', 'Restlessness', 'Appetite change', 'Sleep issues',
]

const COPING_STRATEGIES = [
  'Deep breathing', 'Exercise', 'Journaling', 'Talk to someone', 'Take a break',
  'Meditation', 'Walk in nature', 'Listen to music', 'Sleep', 'Work through it',
]

export default function StressTracker() {
  const { toastSuccess } = useToast()
  const [logs, setLogs] = useState<StressLog[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    level: 5, triggers: [] as string[], symptoms: [] as string[],
    coping: '', after_level: 0, notes: '',
  })

  useEffect(() => { load() }, [])

  const load = async () => {
    const r = await axios.get('/api/stress?limit=60')
    setLogs(r.data as StressLog[])
    setLoading(false)
  }

  const save = async () => {
    await axios.post('/api/stress', {
      date: new Date().toISOString().split('T')[0],
      level: form.level,
      triggers: form.triggers.join(', '),
      symptoms: form.symptoms.join(', '),
      coping: form.coping,
      after_level: form.after_level,
      notes: form.notes,
    })
    setForm({ level: 5, triggers: [], symptoms: [], coping: '', after_level: 0, notes: '' })
    setShowForm(false)
    toastSuccess('Stress log saved!')
    load()
  }

  const deleteLog = async (id: number) => {
    await axios.delete(`/api/stress/${id}`)
    load()
  }

  const toggleItem = (arr: string[], item: string, setter: (fn: (prev: string[]) => string[]) => void) => {
    setter(prev => prev.includes(item) ? prev.filter(x => x !== item) : [...prev, item])
  }

  const stressColor = (level: number) => {
    if (level <= 3) return '#22c55e'
    if (level <= 5) return '#eab308'
    if (level <= 7) return '#f97316'
    return '#ef4444'
  }

  if (loading) return <div className="h-60 bg-slate-800 rounded-xl animate-pulse" />

  const recent = logs.slice(0, 30)
  const avgLevel = recent.length > 0 ? +(recent.reduce((s, l) => s + l.level, 0) / recent.length).toFixed(1) : 0
  const logsWithCoping = logs.filter(l => l.after_level > 0)
  const avgReduction = logsWithCoping.length > 0
    ? +(logsWithCoping.reduce((s, l) => s + (l.level - l.after_level), 0) / logsWithCoping.length).toFixed(1)
    : 0

  // Chart data (last 14 days)
  const chartDays = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(Date.now() - (13 - i) * 86400000)
    const ds = d.toISOString().split('T')[0]
    const dayLogs = logs.filter(l => l.date === ds)
    return { date: ds, avg: dayLogs.length > 0 ? dayLogs.reduce((s, l) => s + l.level, 0) / dayLogs.length : 0 }
  })

  // Most common triggers
  const triggerCounts: Record<string, number> = {}
  logs.forEach(l => {
    if (l.triggers) l.triggers.split(', ').forEach(t => { triggerCounts[t] = (triggerCounts[t] || 0) + 1 })
  })
  const topTriggers = Object.entries(triggerCounts).sort((a, b) => b[1] - a[1]).slice(0, 5)

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <AlertCircle className="w-7 h-7 text-orange-400" />
            Stress Tracker
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Understand your stress patterns and triggers</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-3 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-sm font-semibold transition-colors">
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold" style={{ color: stressColor(avgLevel) }}>{avgLevel || '—'}</div>
          <div className="text-xs text-slate-500">Avg Stress (30d)</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-green-400">{avgReduction > 0 ? `-${avgReduction}` : '—'}</div>
          <div className="text-xs text-slate-500">Avg Reduction</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-blue-400">{logs.length}</div>
          <div className="text-xs text-slate-500">Total Logs</div>
        </div>
      </div>

      {/* Log form */}
      {showForm && (
        <div className="game-card p-5 space-y-4 border border-orange-500/20">
          <h3 className="font-semibold text-slate-300">Log Stress Episode</h3>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <label className="text-slate-400">Stress Level</label>
              <span className="font-bold" style={{ color: stressColor(form.level) }}>{form.level}/10</span>
            </div>
            <input type="range" min="1" max="10" value={form.level}
              onChange={e => setForm(f => ({ ...f, level: +e.target.value }))}
              className="w-full accent-orange-400" />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-2 block">Triggers</label>
            <div className="flex flex-wrap gap-1.5">
              {STRESS_TRIGGERS.map(t => (
                <button key={t} onClick={() => toggleItem(form.triggers, t, fn => setForm(f => ({ ...f, triggers: fn(f.triggers) })))}
                  className="px-2 py-1 rounded-lg text-xs transition-all"
                  style={form.triggers.includes(t) ? { background: '#f9731633', color: '#f97316', border: '1px solid #f97316' } : { background: '#1e293b', color: '#64748b' }}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-2 block">Symptoms</label>
            <div className="flex flex-wrap gap-1.5">
              {STRESS_SYMPTOMS.map(s => (
                <button key={s} onClick={() => toggleItem(form.symptoms, s, fn => setForm(f => ({ ...f, symptoms: fn(f.symptoms) })))}
                  className="px-2 py-1 rounded-lg text-xs transition-all"
                  style={form.symptoms.includes(s) ? { background: '#ef444433', color: '#ef4444', border: '1px solid #ef4444' } : { background: '#1e293b', color: '#64748b' }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-2 block">Coping Strategy</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {COPING_STRATEGIES.map(c => (
                <button key={c} onClick={() => setForm(f => ({ ...f, coping: f.coping === c ? '' : c }))}
                  className="px-2 py-1 rounded-lg text-xs transition-all"
                  style={form.coping === c ? { background: '#22c55e33', color: '#22c55e', border: '1px solid #22c55e' } : { background: '#1e293b', color: '#64748b' }}>
                  {c}
                </button>
              ))}
            </div>
            <input value={form.coping} onChange={e => setForm(f => ({ ...f, coping: e.target.value }))}
              placeholder="Or type your own..." className="game-input w-full text-sm" />
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <label className="text-slate-400">Stress After Coping</label>
              <span style={{ color: stressColor(form.after_level) }}>{form.after_level}/10</span>
            </div>
            <input type="range" min="0" max="10" value={form.after_level}
              onChange={e => setForm(f => ({ ...f, after_level: +e.target.value }))}
              className="w-full accent-green-400" />
          </div>
          <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Additional notes..." className="game-input w-full h-16 resize-none" />
          <div className="flex gap-2">
            <button onClick={save} className="flex-1 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-sm font-semibold transition-colors">
              Save Log
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Chart */}
      {chartDays.some(d => d.avg > 0) && (
        <div className="game-card p-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">14-Day Stress Trend</h3>
          <div className="flex items-end gap-1 h-20">
            {chartDays.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group relative">
                {d.avg > 0 && (
                  <div className="absolute bottom-full mb-1 hidden group-hover:block bg-slate-700 text-xs text-white px-2 py-1 rounded whitespace-nowrap z-10">
                    {d.date.slice(5)}: {d.avg.toFixed(1)}/10
                  </div>
                )}
                <div className="w-full rounded-t-sm" style={{
                  height: d.avg > 0 ? `${(d.avg / 10) * 100}%` : '3px',
                  background: d.avg > 0 ? stressColor(d.avg) : '#1e293b',
                  minHeight: '3px',
                  opacity: d.avg > 0 ? 1 : 0.2,
                }} />
                <div className="text-[8px] text-slate-700">
                  {new Date(d.date + 'T12:00:00').toLocaleDateString('en', { weekday: 'short' }).slice(0, 1)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top triggers */}
      {topTriggers.length > 0 && (
        <div className="game-card p-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Top Stress Triggers</h3>
          <div className="space-y-2">
            {topTriggers.map(([trigger, count]) => (
              <div key={trigger} className="flex items-center gap-3">
                <div className="text-sm text-slate-400 w-32 truncate">{trigger}</div>
                <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500 rounded-full" style={{ width: `${(count / topTriggers[0][1]) * 100}%` }} />
                </div>
                <div className="text-xs text-slate-500 w-8 text-right">{count}×</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent logs */}
      {logs.length > 0 && (
        <div className="game-card p-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Recent Logs</h3>
          <div className="space-y-3">
            {logs.slice(0, 8).map(l => (
              <div key={l.id} className="flex items-start gap-3 py-2 border-b border-slate-800 last:border-0">
                <div className="text-lg font-bold" style={{ color: stressColor(l.level) }}>{l.level}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">{l.date}</span>
                    {l.after_level > 0 && (
                      <span className="flex items-center gap-1 text-xs text-green-400">
                        <TrendingDown className="w-3 h-3" /> {l.after_level}
                      </span>
                    )}
                  </div>
                  {l.triggers && <p className="text-xs text-slate-400 truncate">{l.triggers}</p>}
                  {l.coping && <p className="text-xs text-green-600 truncate">→ {l.coping}</p>}
                </div>
                <button onClick={() => deleteLog(l.id)} className="p-1 text-slate-700 hover:text-red-400 transition-colors flex-shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {logs.length === 0 && !showForm && (
        <div className="text-center py-16 text-slate-500">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="mb-4">No stress logs yet.</p>
          <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-sm font-semibold transition-colors">
            Log First Entry
          </button>
        </div>
      )}
    </div>
  )
}

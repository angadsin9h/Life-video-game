import { useState, useEffect } from 'react'
import axios from 'axios'
import { Brain, Plus, Trash2, Zap, TrendingUp, Clock } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface FocusEntry {
  id: number
  date: string
  session_type: string
  duration: number
  task: string
  flow_state: number
  distractions: number
  output_quality: number
  notes: string
  energy_before: number
  energy_after: number
  created_at: string
}

interface FocusStats {
  total: { count: number; total_minutes: number; avg_flow: number }
  byType: Array<{ session_type: string; count: number; total_minutes: number }>
  daily: Array<{ date: string; total_minutes: number; sessions: number; avg_flow: number }>
}

const SESSION_TYPES = [
  { name: 'Deep Work', color: '#6366f1', emoji: '🎯' },
  { name: 'Creative', color: '#a855f7', emoji: '🎨' },
  { name: 'Learning', color: '#3b82f6', emoji: '📚' },
  { name: 'Planning', color: '#f59e0b', emoji: '📋' },
  { name: 'Writing', color: '#22c55e', emoji: '✍️' },
  { name: 'Code', color: '#06b6d4', emoji: '💻' },
  { name: 'Analysis', color: '#f97316', emoji: '🔍' },
]

const FLOW_LABELS: Record<number, string> = {
  0: 'No flow', 1: 'Struggling', 2: 'Moderate', 3: 'Good', 4: 'In the zone', 5: 'Peak flow',
}

export default function FocusJournal() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<FocusEntry[]>([])
  const [stats, setStats] = useState<FocusStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    session_type: 'Deep Work', task: '', duration: 60,
    flow_state: 3, distractions: 0, output_quality: 7,
    notes: '', energy_before: 7, energy_after: 5,
  })

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try {
      const [entriesRes, statsRes] = await Promise.all([
        axios.get('/api/focus-journal?limit=50'),
        axios.get('/api/focus-journal/stats'),
      ])
      setEntries(entriesRes.data as FocusEntry[])
      setStats(statsRes.data as FocusStats)
    } finally {
      setLoading(false)
    }
  }

  const save = async () => {
    if (!form.task.trim()) return
    await axios.post('/api/focus-journal', {
      date: new Date().toISOString().split('T')[0],
      ...form,
    })
    setShowForm(false)
    setForm({ session_type: 'Deep Work', task: '', duration: 60, flow_state: 3, distractions: 0, output_quality: 7, notes: '', energy_before: 7, energy_after: 5 })
    toastSuccess('Focus session logged! 🧠')
    load()
  }

  const del = async (id: number) => {
    await axios.delete(`/api/focus-journal/${id}`)
    load()
  }

  if (loading) return <div className="h-60 bg-slate-800 rounded-xl animate-pulse" />

  const totalHours = stats ? Math.round((stats.total.total_minutes || 0) / 60 * 10) / 10 : 0
  const avgFlow = stats ? Math.round((stats.total.avg_flow || 0) * 10) / 10 : 0
  const maxDaily = stats ? Math.max(...(stats.daily || []).map(d => d.total_minutes), 60) : 60

  // Last 14 days chart
  const last14 = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(Date.now() - (13 - i) * 86400000).toISOString().split('T')[0]
    const day = stats?.daily.find(dd => dd.date === d) || { total_minutes: 0, avg_flow: 0, sessions: 0 }
    return { date: d, ...day }
  })

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Brain className="w-7 h-7 text-indigo-400" />
            Focus Journal
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Log and analyze your deep work sessions</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-colors">
          <Plus className="w-4 h-4" /> Log Session
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="game-card p-3 text-center">
          <Clock className="w-4 h-4 text-indigo-400 mx-auto mb-1" />
          <div className="text-xl font-bold text-indigo-400">{totalHours}h</div>
          <div className="text-xs text-slate-500">Total Focus</div>
        </div>
        <div className="game-card p-3 text-center">
          <Zap className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
          <div className="text-xl font-bold text-yellow-400">{avgFlow}/5</div>
          <div className="text-xs text-slate-500">Avg Flow</div>
        </div>
        <div className="game-card p-3 text-center">
          <TrendingUp className="w-4 h-4 text-green-400 mx-auto mb-1" />
          <div className="text-xl font-bold text-green-400">{stats?.total.count || 0}</div>
          <div className="text-xs text-slate-500">Sessions</div>
        </div>
      </div>

      {/* Log form */}
      {showForm && (
        <div className="game-card p-5 space-y-4 border border-indigo-500/20">
          <h3 className="font-semibold text-slate-300">Log Focus Session</h3>
          <div>
            <label className="text-xs text-slate-400 mb-2 block">Session Type</label>
            <div className="flex flex-wrap gap-1.5">
              {SESSION_TYPES.map(t => (
                <button key={t.name} onClick={() => setForm(f => ({ ...f, session_type: t.name }))}
                  className="px-2 py-1 rounded-lg text-xs transition-all"
                  style={form.session_type === t.name ? { background: t.color + '30', color: t.color, border: `1px solid ${t.color}` } : { background: '#1e293b', color: '#64748b' }}>
                  {t.emoji} {t.name}
                </button>
              ))}
            </div>
          </div>
          <input value={form.task} onChange={e => setForm(f => ({ ...f, task: e.target.value }))}
            placeholder="What did you focus on?" className="game-input w-full" autoFocus />
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Duration (min)</label>
              <input type="number" min="5" max="480" value={form.duration}
                onChange={e => setForm(f => ({ ...f, duration: +e.target.value }))}
                className="game-input w-full" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Distractions</label>
              <input type="number" min="0" max="20" value={form.distractions}
                onChange={e => setForm(f => ({ ...f, distractions: +e.target.value }))}
                className="game-input w-full" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Output Quality /10</label>
              <input type="number" min="1" max="10" value={form.output_quality}
                onChange={e => setForm(f => ({ ...f, output_quality: +e.target.value }))}
                className="game-input w-full" />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400">Flow State</span>
              <span className="text-indigo-400">{FLOW_LABELS[form.flow_state]}</span>
            </div>
            <input type="range" min="0" max="5" value={form.flow_state}
              onChange={e => setForm(f => ({ ...f, flow_state: +e.target.value }))}
              className="w-full accent-indigo-400" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Energy Before</span>
                <span className="text-green-400">{form.energy_before}/10</span>
              </div>
              <input type="range" min="1" max="10" value={form.energy_before}
                onChange={e => setForm(f => ({ ...f, energy_before: +e.target.value }))}
                className="w-full accent-green-400" />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Energy After</span>
                <span className="text-blue-400">{form.energy_after}/10</span>
              </div>
              <input type="range" min="1" max="10" value={form.energy_after}
                onChange={e => setForm(f => ({ ...f, energy_after: +e.target.value }))}
                className="w-full accent-blue-400" />
            </div>
          </div>
          <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Notes: what you accomplished, insights, blockers..." className="game-input w-full h-16 resize-none" />
          <div className="flex gap-2">
            <button onClick={save} className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-colors">
              Save Session
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* 14-day chart */}
      {last14.some(d => d.total_minutes > 0) && (
        <div className="game-card p-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Focus Time — 14 Days</h3>
          <div className="flex items-end gap-1 h-20">
            {last14.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group relative">
                {d.total_minutes > 0 && (
                  <div className="absolute bottom-full mb-1 hidden group-hover:block bg-slate-700 text-xs text-white px-2 py-1 rounded whitespace-nowrap z-10">
                    {d.date.slice(5)}: {Math.round(d.total_minutes / 60 * 10) / 10}h · flow {d.avg_flow?.toFixed(1)}
                  </div>
                )}
                <div className="w-full rounded-t-sm" style={{
                  height: d.total_minutes > 0 ? `${(d.total_minutes / maxDaily) * 100}%` : '3px',
                  background: d.total_minutes > 0 ? '#6366f1' : '#1e293b',
                  minHeight: '3px',
                  opacity: d.total_minutes > 0 ? 1 : 0.2,
                }} />
                <div className="text-[8px] text-slate-700">
                  {new Date(d.date + 'T12:00:00').toLocaleDateString('en', { weekday: 'short' }).slice(0, 1)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* By type */}
      {stats && stats.byType.length > 0 && (
        <div className="game-card p-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">By Session Type</h3>
          <div className="space-y-2">
            {stats.byType.slice(0, 5).map(t => {
              const type = SESSION_TYPES.find(s => s.name === t.session_type)
              return (
                <div key={t.session_type} className="flex items-center gap-3">
                  <span className="text-sm">{type?.emoji || '📌'}</span>
                  <div className="text-xs text-slate-400 w-20">{t.session_type}</div>
                  <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(t.total_minutes / (stats.total.total_minutes || 1)) * 100}%`, background: type?.color || '#64748b' }} />
                  </div>
                  <span className="text-xs text-slate-500">{Math.round(t.total_minutes / 60 * 10) / 10}h</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Recent entries */}
      {entries.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Recent Sessions</h3>
          {entries.slice(0, 8).map(e => {
            const type = SESSION_TYPES.find(s => s.name === e.session_type)
            return (
              <div key={e.id} className="game-card p-3 flex items-start gap-3">
                <span className="text-lg flex-shrink-0">{type?.emoji || '📌'}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white text-sm">{e.task}</div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs text-slate-500">{e.date}</span>
                    <span className="text-xs text-indigo-400">{e.duration}min</span>
                    <span className="text-xs text-yellow-400">flow {e.flow_state}/5</span>
                    {e.distractions > 0 && <span className="text-xs text-red-400">{e.distractions} distract.</span>}
                    <span className="text-xs text-green-400">quality {e.output_quality}/10</span>
                  </div>
                  {e.notes && <p className="text-xs text-slate-500 mt-1 truncate">{e.notes}</p>}
                </div>
                <button onClick={() => del(e.id)} className="p-1 text-slate-700 hover:text-red-400 flex-shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {entries.length === 0 && !showForm && (
        <div className="text-center py-16 text-slate-500">
          <Brain className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="mb-4">No focus sessions logged yet.</p>
          <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-colors">
            Log First Session
          </button>
        </div>
      )}
    </div>
  )
}

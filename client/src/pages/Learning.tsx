import { useEffect, useState } from 'react'
import axios from 'axios'
import { BookOpen, Plus, Trash2, Edit3, Check, X, Play, ChevronRight, GraduationCap, Clock, Star, TrendingUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface LearningItem {
  id: number
  title: string
  type: string
  source: string
  total_units: number
  completed_units: number
  status: string
  priority: number
  notes: string
  progressPct: number
  totalMinutes: number
  lastSessionDate: string | null
  started_at: string | null
  finished_at: string | null
}

interface Stats { total: number; active: number; completed: number; totalHours: number; thisWeekMins: number }

const TYPES = [
  { value: 'course', label: 'Course', emoji: '🎓' },
  { value: 'book', label: 'Book', emoji: '📚' },
  { value: 'skill', label: 'Skill', emoji: '⚡' },
  { value: 'tutorial', label: 'Tutorial', emoji: '💻' },
  { value: 'language', label: 'Language', emoji: '🗣️' },
  { value: 'certificate', label: 'Certificate', emoji: '🏅' },
  { value: 'other', label: 'Other', emoji: '🎯' },
]

const TYPE_MAP = Object.fromEntries(TYPES.map(t => [t.value, t]))

function fmtMins(mins: number) {
  if (mins < 60) return `${mins}m`
  return `${Math.floor(mins / 60)}h ${mins % 60 > 0 ? `${mins % 60}m` : ''}`.trim()
}

function relDate(d: string | null) {
  if (!d) return null
  const diff = Math.floor((Date.now() - new Date(d + 'T00:00:00').getTime()) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  if (diff < 7) return `${diff}d ago`
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function ItemCard({ item, onUpdate, onDelete, onLogSession }: {
  item: LearningItem
  onUpdate: (id: number, updates: Partial<LearningItem>) => void
  onDelete: (id: number) => void
  onLogSession: (item: LearningItem) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState({ ...item })
  const isCompleted = item.status === 'completed'

  const save = async () => {
    onUpdate(item.id, draft)
    setEditing(false)
  }

  const typeInfo = TYPE_MAP[item.type] || TYPE_MAP.other

  return (
    <div className={`game-card p-4 transition-all ${isCompleted ? 'opacity-60 border-green-500/20' : 'border-slate-700 hover:border-violet-500/30'}`}>
      {editing ? (
        <div className="space-y-3">
          <input value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))}
            className="game-input w-full font-semibold" autoFocus />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-slate-500 block mb-1">Type</label>
              <select value={draft.type} onChange={e => setDraft(d => ({ ...d, type: e.target.value }))}
                className="game-input w-full text-sm">
                {TYPES.map(t => <option key={t.value} value={t.value}>{t.emoji} {t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Total Units</label>
              <input type="number" value={draft.total_units} onChange={e => setDraft(d => ({ ...d, total_units: parseInt(e.target.value) || 0 }))}
                className="game-input w-full" placeholder="chapters/lessons" />
            </div>
          </div>
          <input value={draft.source} onChange={e => setDraft(d => ({ ...d, source: e.target.value }))}
            placeholder="Source / URL" className="game-input w-full text-sm" />
          <div className="flex gap-2">
            <button onClick={save} className="flex-1 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm rounded-xl font-semibold transition-colors flex items-center justify-center gap-1">
              <Check className="w-4 h-4" /> Save
            </button>
            <button onClick={() => setEditing(false)} className="px-3 py-2 bg-slate-700 text-slate-300 text-sm rounded-xl transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0 mt-0.5">{typeInfo.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`font-semibold text-sm ${isCompleted ? 'line-through text-slate-500' : 'text-slate-200'}`}>{item.title}</span>
                {isCompleted && <span className="text-xs text-green-400 bg-green-900/20 border border-green-500/20 px-1.5 py-0.5 rounded-full">Done ✓</span>}
              </div>
              {item.source && <div className="text-xs text-slate-600 truncate mt-0.5">{item.source}</div>}
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="text-xs text-slate-600 bg-slate-800 px-2 py-0.5 rounded-full capitalize">{typeInfo.label}</span>
                {item.totalMinutes > 0 && (
                  <span className="text-xs text-cyan-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />{fmtMins(item.totalMinutes)}
                  </span>
                )}
                {item.lastSessionDate && (
                  <span className="text-xs text-slate-600">Last: {relDate(item.lastSessionDate)}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {!isCompleted && (
                <button onClick={() => onLogSession(item)}
                  className="p-1.5 text-violet-400 hover:bg-violet-900/30 rounded-lg transition-colors" title="Log session">
                  <Play className="w-4 h-4" />
                </button>
              )}
              <button onClick={() => setEditing(true)}
                className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-700 rounded-lg transition-colors">
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => onDelete(item.id)}
                className="p-1.5 text-slate-700 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Progress bar */}
          {item.total_units > 0 && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>{item.completed_units}/{item.total_units} units</span>
                <span className={`font-semibold ${item.progressPct >= 100 ? 'text-green-400' : item.progressPct >= 50 ? 'text-violet-400' : 'text-slate-400'}`}>
                  {item.progressPct}%
                </span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${item.progressPct >= 100 ? 'bg-green-500' : 'bg-violet-500'}`}
                  style={{ width: `${item.progressPct}%` }}
                />
              </div>
            </div>
          )}

          {/* Mark complete button */}
          {!isCompleted && item.total_units > 0 && item.progressPct === 100 && (
            <button onClick={() => onUpdate(item.id, { status: 'completed' })}
              className="w-full mt-3 py-1.5 bg-green-600/20 hover:bg-green-600/40 text-green-400 border border-green-500/30 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1">
              <Check className="w-3.5 h-3.5" /> Mark Complete
            </button>
          )}
        </>
      )}
    </div>
  )
}

export default function Learning() {
  const { toastSuccess } = useToast()
  const [items, setItems] = useState<LearningItem[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('active')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', type: 'course', source: '', total_units: 0 })
  const [saving, setSaving] = useState(false)
  const [sessionModal, setSessionModal] = useState<LearningItem | null>(null)
  const [session, setSession] = useState({ duration_minutes: 30, units_covered: 0, notes: '' })

  const load = async () => {
    const [itemsRes, statsRes] = await Promise.all([
      axios.get<LearningItem[]>(`/api/learning${filter !== 'all' ? `?status=${filter}` : ''}`),
      axios.get<Stats>('/api/learning/stats/summary'),
    ])
    setItems(itemsRes.data)
    setStats(statsRes.data)
  }

  useEffect(() => { load().finally(() => setLoading(false)) }, [filter])

  const create = async () => {
    if (!form.title.trim()) return
    setSaving(true)
    try {
      await axios.post('/api/learning', form)
      setForm({ title: '', type: 'course', source: '', total_units: 0 })
      setShowForm(false)
      load()
      toastSuccess('Learning item added!')
    } finally { setSaving(false) }
  }

  const update = async (id: number, updates: Partial<LearningItem>) => {
    await axios.patch(`/api/learning/${id}`, updates)
    load()
  }

  const remove = async (id: number) => {
    await axios.delete(`/api/learning/${id}`)
    setItems(prev => prev.filter(i => i.id !== id))
  }

  const logSession = async () => {
    if (!sessionModal) return
    const today = new Date().toISOString().split('T')[0]
    await axios.post(`/api/learning/${sessionModal.id}/sessions`, { date: today, ...session })
    setSessionModal(null)
    setSession({ duration_minutes: 30, units_covered: 0, notes: '' })
    load()
    toastSuccess('Session logged!')
  }

  if (loading) return (
    <div className="space-y-3 animate-pulse">{[1,2,3].map(i => <div key={i} className="h-24 bg-slate-800 rounded-xl" />)}</div>
  )

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
          <GraduationCap className="w-7 h-7 text-cyan-400" />
          Learning
        </h1>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="game-card p-3 text-center">
            <div className="text-xl font-bold text-cyan-400" style={{ fontFamily: 'Orbitron, monospace' }}>{stats.active}</div>
            <div className="text-xs text-slate-500">Active</div>
          </div>
          <div className="game-card p-3 text-center">
            <div className="text-xl font-bold text-green-400" style={{ fontFamily: 'Orbitron, monospace' }}>{stats.completed}</div>
            <div className="text-xs text-slate-500">Completed</div>
          </div>
          <div className="game-card p-3 text-center">
            <div className="text-xl font-bold text-violet-400" style={{ fontFamily: 'Orbitron, monospace' }}>{stats.totalHours}h</div>
            <div className="text-xs text-slate-500">Total Time</div>
          </div>
          <div className="game-card p-3 text-center">
            <div className="text-xl font-bold text-orange-400" style={{ fontFamily: 'Orbitron, monospace' }}>{fmtMins(stats.thisWeekMins)}</div>
            <div className="text-xs text-slate-500">This Week</div>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2">
        {[
          { value: 'active', label: 'Active' },
          { value: 'completed', label: 'Completed' },
          { value: 'all', label: 'All' },
        ].map(f => (
          <button key={f.value} onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${filter === f.value ? 'bg-cyan-600/30 text-cyan-400 border border-cyan-500/30' : 'text-slate-500 hover:text-slate-300'}`}>
            {f.label}
          </button>
        ))}
        <button onClick={() => setShowForm(true)}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold rounded-xl transition-colors">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="game-card p-4 border border-cyan-500/20">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-200 text-sm">New Learning Item</h3>
            <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-slate-300"><X className="w-4 h-4" /></button>
          </div>
          <div className="space-y-3">
            <input placeholder="Title (e.g., React Course, Spanish, Piano)" value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="game-input w-full" autoFocus onKeyDown={e => e.key === 'Enter' && create()} />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-slate-500 block mb-1">Type</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  className="game-input w-full text-sm">
                  {TYPES.map(t => <option key={t.value} value={t.value}>{t.emoji} {t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Total Units</label>
                <input type="number" placeholder="chapters/lessons" value={form.total_units || ''}
                  onChange={e => setForm(f => ({ ...f, total_units: parseInt(e.target.value) || 0 }))}
                  className="game-input w-full" />
              </div>
            </div>
            <input placeholder="Source / URL (optional)" value={form.source}
              onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
              className="game-input w-full text-sm" />
            <button onClick={create} disabled={saving || !form.title.trim()}
              className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm rounded-xl transition-colors disabled:opacity-50">
              {saving ? 'Adding…' : 'Add to Learning List'}
            </button>
          </div>
        </div>
      )}

      {/* Items */}
      <div className="space-y-3">
        {items.map(item => (
          <ItemCard key={item.id} item={item}
            onUpdate={update} onDelete={remove} onLogSession={setSessionModal} />
        ))}
      </div>

      {items.length === 0 && (
        <div className="text-center py-10 text-slate-600">
          <GraduationCap className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">{filter === 'active' ? 'No active learning items' : 'Nothing here yet'}</p>
          <p className="text-xs mt-1">Add a course, book, or skill to start tracking</p>
        </div>
      )}

      {/* Log Session Modal */}
      {sessionModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setSessionModal(null)}>
          <div className="game-card p-5 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-200">Log Study Session</h3>
              <button onClick={() => setSessionModal(null)} className="text-slate-500 hover:text-slate-300"><X className="w-4 h-4" /></button>
            </div>
            <p className="text-sm text-slate-400 mb-4 truncate">📖 {sessionModal.title}</p>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-500 block mb-1">Duration (minutes)</label>
                <input type="number" min="1" value={session.duration_minutes}
                  onChange={e => setSession(s => ({ ...s, duration_minutes: parseInt(e.target.value) || 0 }))}
                  className="game-input w-full" />
              </div>
              {sessionModal.total_units > 0 && (
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Units covered</label>
                  <input type="number" min="0" value={session.units_covered}
                    onChange={e => setSession(s => ({ ...s, units_covered: parseInt(e.target.value) || 0 }))}
                    className="game-input w-full" />
                </div>
              )}
              <div>
                <label className="text-xs text-slate-500 block mb-1">Notes (optional)</label>
                <input type="text" value={session.notes}
                  onChange={e => setSession(s => ({ ...s, notes: e.target.value }))}
                  className="game-input w-full" placeholder="What did you learn?" />
              </div>
            </div>
            <button onClick={logSession}
              className="w-full mt-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl transition-colors">
              Log Session
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

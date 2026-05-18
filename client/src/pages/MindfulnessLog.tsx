import { useState, useEffect } from 'react'
import { Wind, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type MindfulType = 'meditation' | 'breathing' | 'body-scan' | 'walking' | 'journaling' | 'nature' | 'gratitude' | 'visualization' | 'yoga' | 'other'

interface MindfulSession {
  id: string
  type: MindfulType
  duration: number
  quality: number
  mood_before: number
  mood_after: number
  technique: string
  insights: string
  notes: string
  date: string
  createdAt: string
}

const TYPE_CONFIG: Record<MindfulType, { label: string; emoji: string; color: string }> = {
  meditation:    { label: 'Meditation',    emoji: '🧘', color: '#6366f1' },
  breathing:     { label: 'Breathing',     emoji: '🌬️', color: '#3b82f6' },
  'body-scan':   { label: 'Body Scan',     emoji: '🔍', color: '#22c55e' },
  walking:       { label: 'Walking',       emoji: '🚶', color: '#84cc16' },
  journaling:    { label: 'Journaling',    emoji: '📓', color: '#f59e0b' },
  nature:        { label: 'Nature',        emoji: '🌿', color: '#10b981' },
  gratitude:     { label: 'Gratitude',     emoji: '🙏', color: '#ec4899' },
  visualization: { label: 'Visualization', emoji: '🔮', color: '#a855f7' },
  yoga:          { label: 'Yoga',          emoji: '🤸', color: '#f97316' },
  other:         { label: 'Other',         emoji: '✨', color: '#94a3b8' },
}

const STORAGE_KEY = 'mindfulness_log'

export default function MindfulnessLog() {
  const { toastSuccess } = useToast()
  const [sessions, setSessions] = useState<MindfulSession[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<string>('all')
  const [form, setForm] = useState<Omit<MindfulSession, 'id' | 'createdAt'>>({
    type: 'meditation', duration: 10, quality: 3, mood_before: 3, mood_after: 4,
    technique: '', insights: '', notes: '', date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setSessions(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: MindfulSession[]) => { setSessions(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    const s: MindfulSession = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([s, ...sessions])
    setForm(f => ({ ...f, technique: '', insights: '', notes: '', date: new Date().toISOString().split('T')[0], duration: 10, quality: 3, mood_before: 3, mood_after: 4 }))
    setShowForm(false)
    toastSuccess('Session logged 🧘')
  }

  const filtered = sessions.filter(s => filterType === 'all' || s.type === filterType)
  const totalMins = sessions.reduce((sum, s) => sum + s.duration, 0)
  const avgImprovement = sessions.length > 0
    ? Math.round((sessions.reduce((sum, s) => sum + (s.mood_after - s.mood_before), 0) / sessions.length) * 10) / 10
    : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Wind className="w-7 h-7 text-teal-400" />
            Mindfulness Log
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track your mindfulness and meditation practice.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-teal-700 hover:bg-teal-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{sessions.length}</div>
          <div className="text-xs text-slate-500">Sessions</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-teal-400">{totalMins}</div>
          <div className="text-xs text-slate-500">Total Mins</div>
        </div>
        <div className="game-card p-3">
          <div className={`text-xl font-bold ${avgImprovement >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {avgImprovement > 0 ? '+' : ''}{avgImprovement}
          </div>
          <div className="text-xs text-slate-500">Avg Mood Lift</div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilterType('all')}
          className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterType === 'all' ? 'bg-teal-600/20 text-teal-400 border border-teal-500/30' : 'bg-slate-800 text-slate-500'}`}>
          All
        </button>
        {(Object.entries(TYPE_CONFIG) as [MindfulType, typeof TYPE_CONFIG.meditation][]).map(([k, t]) => (
          <button key={k} onClick={() => setFilterType(k)}
            className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterType === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
            style={filterType === k ? { background: t.color + '30', color: t.color } : {}}>
            {t.emoji}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-teal-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Session</h3>
          <div className="flex gap-2">
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as MindfulType }))} className="game-input text-sm flex-1">
              {(Object.entries(TYPE_CONFIG) as [MindfulType, typeof TYPE_CONFIG.meditation][]).map(([k, t]) => (
                <option key={k} value={k}>{t.emoji} {t.label}</option>
              ))}
            </select>
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              className="game-input text-sm flex-1" />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Duration: {form.duration} min</p>
              <input type="range" min={1} max={120} value={form.duration}
                onChange={e => setForm(f => ({ ...f, duration: Number(e.target.value) }))}
                className="w-full h-1 accent-teal-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Quality: {form.quality}/5</p>
              <input type="range" min={1} max={5} value={form.quality}
                onChange={e => setForm(f => ({ ...f, quality: Number(e.target.value) }))}
                className="w-full h-1 accent-indigo-400" />
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Mood before: {form.mood_before}/5</p>
              <input type="range" min={1} max={5} value={form.mood_before}
                onChange={e => setForm(f => ({ ...f, mood_before: Number(e.target.value) }))}
                className="w-full h-1 accent-orange-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Mood after: {form.mood_after}/5</p>
              <input type="range" min={1} max={5} value={form.mood_after}
                onChange={e => setForm(f => ({ ...f, mood_after: Number(e.target.value) }))}
                className="w-full h-1 accent-green-400" />
            </div>
          </div>
          <input value={form.technique} onChange={e => setForm(f => ({ ...f, technique: e.target.value }))}
            placeholder="Technique used (4-7-8, Vipassana, etc.)" className="game-input w-full text-sm" />
          <textarea value={form.insights} onChange={e => setForm(f => ({ ...f, insights: e.target.value }))}
            placeholder="Insights or observations..." className="game-input w-full h-12 resize-none text-sm" />
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-teal-700 hover:bg-teal-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(s => {
          const t = TYPE_CONFIG[s.type]
          const isExp = expanded === s.id
          const lift = s.mood_after - s.mood_before
          return (
            <div key={s.id} className="game-card overflow-hidden" style={{ borderLeft: `3px solid ${t.color}` }}>
              <div className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isExp ? null : s.id)}>
                <span className="text-2xl">{t.emoji}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white text-sm">{t.label}</span>
                    <span className="text-xs text-slate-500">{s.duration} min</span>
                    {lift !== 0 && <span className={`text-xs ${lift > 0 ? 'text-green-400' : 'text-red-400'}`}>{lift > 0 ? '+' : ''}{lift} mood</span>}
                  </div>
                  <p className="text-xs text-slate-500">{s.date} · Quality {'★'.repeat(s.quality)}{'☆'.repeat(5 - s.quality)}</p>
                </div>
                {isExp ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
              </div>
              {isExp && (
                <div className="border-t border-slate-800 p-3 space-y-1.5">
                  {s.technique && <p className="text-xs text-blue-300">🎯 {s.technique}</p>}
                  {s.insights && <p className="text-xs text-yellow-300">💡 {s.insights}</p>}
                  {s.notes && <p className="text-xs text-slate-400">{s.notes}</p>}
                  <button onClick={() => save(sessions.filter(x => x.id !== s.id))} className="text-slate-700 hover:text-red-400 mt-1">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )
        })}
        {filtered.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Wind className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Every session counts. Start your mindfulness journey.</p>
          </div>
        )}
      </div>
    </div>
  )
}

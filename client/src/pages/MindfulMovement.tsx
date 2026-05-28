import { useState, useEffect } from 'react'
import { Wind, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type MovementType = 'yoga' | 'tai-chi' | 'qigong' | 'stretching' | 'walking' | 'dancing' | 'swimming' | 'pilates' | 'bodyweight' | 'other'

interface MovementSession {
  id: string
  type: MovementType
  duration: number
  focus: string
  bodyFeel: string
  mindFeel: string
  energyBefore: number
  energyAfter: number
  notes: string
  date: string
  createdAt: string
}

const TYPE_CONFIG: Record<MovementType, { label: string; emoji: string; color: string }> = {
  yoga:        { label: 'Yoga',         emoji: '🧘', color: '#a855f7' },
  'tai-chi':   { label: 'Tai Chi',      emoji: '☯️', color: '#22c55e' },
  qigong:      { label: 'Qigong',       emoji: '🌀', color: '#0ea5e9' },
  stretching:  { label: 'Stretching',   emoji: '🤸', color: '#f97316' },
  walking:     { label: 'Mindful Walk', emoji: '🚶', color: '#84cc16' },
  dancing:     { label: 'Dance',        emoji: '💃', color: '#ec4899' },
  swimming:    { label: 'Swimming',     emoji: '🏊', color: '#3b82f6' },
  pilates:     { label: 'Pilates',      emoji: '⚖️', color: '#f59e0b' },
  bodyweight:  { label: 'Bodyweight',   emoji: '💪', color: '#ef4444' },
  other:       { label: 'Other',        emoji: '🌿', color: '#94a3b8' },
}

const STORAGE_KEY = 'mindful_movement'

export default function MindfulMovement() {
  const { toastSuccess } = useToast()
  const [sessions, setSessions] = useState<MovementSession[]>([])
  const [showForm, setShowForm] = useState(false)
  const [filterType, setFilterType] = useState<string>('all')
  const [form, setForm] = useState<Omit<MovementSession, 'id' | 'createdAt'>>({
    type: 'yoga', duration: 20, focus: '', bodyFeel: '', mindFeel: '',
    energyBefore: 5, energyAfter: 8, notes: '', date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setSessions(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: MovementSession[]) => { setSessions(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.type) return
    const s: MovementSession = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([s, ...sessions])
    setForm(f => ({ ...f, focus: '', bodyFeel: '', mindFeel: '', notes: '' }))
    setShowForm(false)
    toastSuccess('Movement session logged 🧘')
  }

  const filtered = sessions.filter(s => filterType === 'all' || s.type === filterType)
  const totalMinutes = sessions.reduce((s, e) => s + e.duration, 0)
  const avgLift = sessions.length
    ? Math.round(sessions.reduce((s, e) => s + (e.energyAfter - e.energyBefore), 0) / sessions.length * 10) / 10
    : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Wind className="w-7 h-7 text-purple-400" />
            Mindful Movement
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Move with awareness — track every mindful practice session.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{sessions.length}</div>
          <div className="text-xs text-slate-500">Sessions</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-purple-400">{Math.round(totalMinutes / 60)}h {totalMinutes % 60}m</div>
          <div className="text-xs text-slate-500">Total Time</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">+{avgLift}</div>
          <div className="text-xs text-slate-500">Avg Energy Lift</div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilterType('all')}
          className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterType === 'all' ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30' : 'bg-slate-800 text-slate-500'}`}>
          All
        </button>
        {(Object.entries(TYPE_CONFIG) as [MovementType, typeof TYPE_CONFIG.yoga][]).map(([k, c]) => (
          <button key={k} onClick={() => setFilterType(k)}
            className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterType === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
            style={filterType === k ? { background: c.color + '30', color: c.color } : {}}>
            {c.emoji}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-purple-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Movement Session</h3>
          <div className="flex gap-2">
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as MovementType }))} className="game-input text-sm flex-1">
              {(Object.entries(TYPE_CONFIG) as [MovementType, typeof TYPE_CONFIG.yoga][]).map(([k, c]) => (
                <option key={k} value={k}>{c.emoji} {c.label}</option>
              ))}
            </select>
            <div className="flex-1">
              <input type="number" value={form.duration} min={1}
                onChange={e => setForm(f => ({ ...f, duration: Number(e.target.value) }))}
                className="game-input w-full text-sm" placeholder="Minutes" />
            </div>
          </div>
          <input value={form.focus} onChange={e => setForm(f => ({ ...f, focus: e.target.value }))}
            placeholder="Focus / intention for this session" className="game-input w-full text-sm" autoFocus />
          <input value={form.bodyFeel} onChange={e => setForm(f => ({ ...f, bodyFeel: e.target.value }))}
            placeholder="How does your body feel?" className="game-input w-full text-sm" />
          <input value={form.mindFeel} onChange={e => setForm(f => ({ ...f, mindFeel: e.target.value }))}
            placeholder="How does your mind feel?" className="game-input w-full text-sm" />
          <div className="flex gap-3">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Energy before: {form.energyBefore}/10</p>
              <input type="range" min={1} max={10} value={form.energyBefore}
                onChange={e => setForm(f => ({ ...f, energyBefore: Number(e.target.value) }))}
                className="w-full h-1 accent-slate-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Energy after: {form.energyAfter}/10</p>
              <input type="range" min={1} max={10} value={form.energyAfter}
                onChange={e => setForm(f => ({ ...f, energyAfter: Number(e.target.value) }))}
                className="w-full h-1 accent-purple-400" />
            </div>
          </div>
          <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="game-input w-full text-sm" />
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-xl text-sm font-semibold">Log Session</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(s => {
          const t = TYPE_CONFIG[s.type]
          const lift = s.energyAfter - s.energyBefore
          return (
            <div key={s.id} className="game-card p-3 flex items-center gap-3" style={{ borderLeft: `3px solid ${t.color}` }}>
              <span className="text-2xl">{t.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">{t.label}</span>
                  <span className="text-xs text-slate-500">{s.duration} min</span>
                  {lift > 0 && <span className="text-xs text-green-400">+{lift}⚡</span>}
                </div>
                {s.focus && <p className="text-xs text-slate-500">{s.focus}</p>}
                {s.bodyFeel && <p className="text-xs text-purple-300">Body: {s.bodyFeel}</p>}
                <p className="text-xs text-slate-600">{s.date}</p>
              </div>
              <button onClick={() => save(sessions.filter(x => x.id !== s.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {filtered.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Wind className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Movement is medicine. Move with presence and log how it feels.</p>
          </div>
        )}
      </div>
    </div>
  )
}

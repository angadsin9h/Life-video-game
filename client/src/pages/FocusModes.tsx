import { useState, useEffect } from 'react'
import { Target, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type ModeType = 'deep-work' | 'creative' | 'learning' | 'planning' | 'review' | 'recovery' | 'social' | 'admin' | 'physical' | 'spiritual'
type ModeStatus = 'active' | 'testing' | 'retired' | 'planned'

interface FocusMode {
  id: string
  name: string
  modeType: ModeType
  status: ModeStatus
  description: string
  triggers: string
  rituals: string
  environment: string
  tools: string
  duration: number
  energyRequired: number
  date: string
  createdAt: string
}

const TYPE_CONFIG: Record<ModeType, { label: string; emoji: string; color: string }> = {
  'deep-work':  { label: 'Deep Work',  emoji: '🎯', color: '#3b82f6' },
  creative:     { label: 'Creative',   emoji: '🎨', color: '#f97316' },
  learning:     { label: 'Learning',   emoji: '📚', color: '#6366f1' },
  planning:     { label: 'Planning',   emoji: '🗺️', color: '#22c55e' },
  review:       { label: 'Review',     emoji: '🔍', color: '#f59e0b' },
  recovery:     { label: 'Recovery',   emoji: '🌿', color: '#84cc16' },
  social:       { label: 'Social',     emoji: '👥', color: '#ec4899' },
  admin:        { label: 'Admin',      emoji: '📋', color: '#94a3b8' },
  physical:     { label: 'Physical',   emoji: '💪', color: '#ef4444' },
  spiritual:    { label: 'Spiritual',  emoji: '✨', color: '#a855f7' },
}

const STATUS_CONFIG: Record<ModeStatus, { label: string; color: string }> = {
  active:  { label: 'Active',  color: '#22c55e' },
  testing: { label: 'Testing', color: '#f59e0b' },
  retired: { label: 'Retired', color: '#94a3b8' },
  planned: { label: 'Planned', color: '#3b82f6' },
}

const STORAGE_KEY = 'focus_modes'

export default function FocusModes() {
  const { toastSuccess } = useToast()
  const [modes, setModes] = useState<FocusMode[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<FocusMode, 'id' | 'createdAt'>>({
    name: '', modeType: 'deep-work', status: 'active', description: '', triggers: '',
    rituals: '', environment: '', tools: '', duration: 90, energyRequired: 8,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setModes(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: FocusMode[]) => { setModes(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.name.trim()) return
    const m: FocusMode = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([m, ...modes])
    setForm(f => ({ ...f, name: '', description: '', triggers: '', rituals: '', environment: '', tools: '' }))
    setShowForm(false)
    toastSuccess('Focus mode defined — enter the zone 🎯')
  }

  const active = modes.filter(m => m.status === 'active').length

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Target className="w-7 h-7 text-blue-400" />
            Focus Modes
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Design intentional states for different types of work.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{modes.length}</div>
          <div className="text-xs text-slate-500">Modes</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{active}</div>
          <div className="text-xs text-slate-500">Active</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-blue-400">
            {modes.length ? Math.round(modes.reduce((s, m) => s + m.duration, 0) / modes.length) : 0}m
          </div>
          <div className="text-xs text-slate-500">Avg Duration</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-blue-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Define Focus Mode</h3>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Mode name *" className="game-input w-full text-sm" autoFocus />
          <div className="flex gap-2">
            <select value={form.modeType} onChange={e => setForm(f => ({ ...f, modeType: e.target.value as ModeType }))} className="game-input text-sm flex-1">
              {(Object.entries(TYPE_CONFIG) as [ModeType, typeof TYPE_CONFIG['deep-work']][]).map(([k, t]) => (
                <option key={k} value={k}>{t.emoji} {t.label}</option>
              ))}
            </select>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as ModeStatus }))} className="game-input text-sm flex-1">
              {(Object.entries(STATUS_CONFIG) as [ModeStatus, typeof STATUS_CONFIG.active][]).map(([k, s]) => (
                <option key={k} value={k}>{s.label}</option>
              ))}
            </select>
          </div>
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="What this mode is for" className="game-input w-full h-12 resize-none text-sm" />
          <input value={form.triggers} onChange={e => setForm(f => ({ ...f, triggers: e.target.value }))}
            placeholder="Entry triggers (what activates this mode)" className="game-input w-full text-sm" />
          <input value={form.rituals} onChange={e => setForm(f => ({ ...f, rituals: e.target.value }))}
            placeholder="Entry rituals (how you enter the mode)" className="game-input w-full text-sm" />
          <input value={form.environment} onChange={e => setForm(f => ({ ...f, environment: e.target.value }))}
            placeholder="Ideal environment (location, lighting, music)" className="game-input w-full text-sm" />
          <input value={form.tools} onChange={e => setForm(f => ({ ...f, tools: e.target.value }))}
            placeholder="Tools / apps used in this mode" className="game-input w-full text-sm" />
          <div className="flex gap-3">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Duration: {form.duration}min</p>
              <input type="range" min={15} max={300} step={15} value={form.duration}
                onChange={e => setForm(f => ({ ...f, duration: Number(e.target.value) }))}
                className="w-full h-1 accent-blue-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Energy: {form.energyRequired}/10</p>
              <input type="range" min={1} max={10} value={form.energyRequired}
                onChange={e => setForm(f => ({ ...f, energyRequired: Number(e.target.value) }))}
                className="w-full h-1 accent-blue-400" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold">Save Mode</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {modes.map(m => {
          const t = TYPE_CONFIG[m.modeType]
          const s = STATUS_CONFIG[m.status]
          return (
            <div key={m.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${t.color}` }}>
              <span className="text-2xl">{t.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: s.color + '20', color: s.color }}>{s.label}</span>
                  <span className="text-xs text-slate-500">{t.label}</span>
                  <span className="text-xs text-blue-400">⏱ {m.duration}min</span>
                  <span className="text-xs text-yellow-400">⚡ {m.energyRequired}/10</span>
                </div>
                <p className="text-xs font-medium text-white mt-1">{m.name}</p>
                {m.description && <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{m.description}</p>}
                {m.rituals && <p className="text-xs text-blue-300/80 mt-0.5">Ritual: {m.rituals}</p>}
              </div>
              <button onClick={() => save(modes.filter(x => x.id !== m.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {modes.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Target className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Design your focus modes. Enter intentional states.</p>
          </div>
        )}
      </div>
    </div>
  )
}

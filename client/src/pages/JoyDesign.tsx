import { useState, useEffect } from 'react'
import { Sun, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type JoySource = 'connection' | 'achievement' | 'nature' | 'creativity' | 'learning' | 'movement' | 'service' | 'play' | 'beauty' | 'spirituality'
type JoyDepth = 'pleasure' | 'enjoyment' | 'happiness' | 'joy' | 'bliss' | 'ecstasy'

interface JoyDesignEntry {
  id: string
  source: JoySource
  depth: JoyDepth
  whatBroughtJoy: string
  howItFelt: string
  whoShared: string
  howLongItLasted: string
  howToAmplify: string
  joyBlock: string
  regularizeHow: string
  joyScore: number
  date: string
  createdAt: string
}

const SOURCE_CONFIG: Record<JoySource, { label: string; emoji: string; color: string }> = {
  connection:   { label: 'Connection',   emoji: '🤝', color: '#ec4899' },
  achievement:  { label: 'Achievement',  emoji: '🏆', color: '#f59e0b' },
  nature:       { label: 'Nature',       emoji: '🌿', color: '#22c55e' },
  creativity:   { label: 'Creativity',   emoji: '🎨', color: '#a855f7' },
  learning:     { label: 'Learning',     emoji: '📚', color: '#3b82f6' },
  movement:     { label: 'Movement',     emoji: '🏃', color: '#ef4444' },
  service:      { label: 'Service',      emoji: '🙌', color: '#10b981' },
  play:         { label: 'Play',         emoji: '🎯', color: '#f97316' },
  beauty:       { label: 'Beauty',       emoji: '🌸', color: '#6366f1' },
  spirituality: { label: 'Spirituality', emoji: '✨', color: '#94a3b8' },
}

const DEPTH_CONFIG: Record<JoyDepth, { label: string; color: string }> = {
  pleasure: { label: 'Pleasure', color: '#94a3b8' },
  enjoyment: { label: 'Enjoyment', color: '#3b82f6' },
  happiness: { label: 'Happiness', color: '#22c55e' },
  joy:       { label: 'Joy',       color: '#f59e0b' },
  bliss:     { label: 'Bliss',     color: '#f97316' },
  ecstasy:   { label: 'Ecstasy',   color: '#a855f7' },
}

const STORAGE_KEY = 'joy_design_log'

export default function JoyDesign() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<JoyDesignEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<JoyDesignEntry, 'id' | 'createdAt'>>({
    source: 'connection', depth: 'joy', whatBroughtJoy: '',
    howItFelt: '', whoShared: '', howLongItLasted: '',
    howToAmplify: '', joyBlock: '', regularizeHow: '', joyScore: 8,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: JoyDesignEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.whatBroughtJoy.trim()) return
    const e: JoyDesignEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, whatBroughtJoy: '', howItFelt: '', whoShared: '', howLongItLasted: '', howToAmplify: '', joyBlock: '', regularizeHow: '' }))
    setShowForm(false)
    toastSuccess('Joy logged — design your life around what makes you fully alive ☀️')
  }

  const deep = entries.filter(e => e.depth === 'bliss' || e.depth === 'ecstasy' || e.depth === 'joy').length
  const avgJoy = entries.length ? Math.round(entries.reduce((s, e) => s + e.joyScore, 0) / entries.length) : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Sun className="w-7 h-7 text-yellow-400" />
            Joy Design
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Intentionally design more joy into every area of your life.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Joy Moments</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">{deep}</div>
          <div className="text-xs text-slate-500">Deep Joy+</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-amber-400">{avgJoy}/10</div>
          <div className="text-xs text-slate-500">Avg Joy</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-yellow-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Joy Moment</h3>
          <div className="flex gap-2">
            <select value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value as JoySource }))} className="game-input text-sm flex-1">
              {(Object.entries(SOURCE_CONFIG) as [JoySource, typeof SOURCE_CONFIG.connection][]).map(([k, s]) => (
                <option key={k} value={k}>{s.emoji} {s.label}</option>
              ))}
            </select>
            <select value={form.depth} onChange={e => setForm(f => ({ ...f, depth: e.target.value as JoyDepth }))} className="game-input text-sm flex-1">
              {(Object.entries(DEPTH_CONFIG) as [JoyDepth, typeof DEPTH_CONFIG.joy][]).map(([k, d]) => (
                <option key={k} value={k}>{d.label}</option>
              ))}
            </select>
          </div>
          <input value={form.whatBroughtJoy} onChange={e => setForm(f => ({ ...f, whatBroughtJoy: e.target.value }))}
            placeholder="What brought you joy? *" className="game-input w-full text-sm" autoFocus />
          <input value={form.howItFelt} onChange={e => setForm(f => ({ ...f, howItFelt: e.target.value }))}
            placeholder="How did this joy feel in your body?" className="game-input w-full text-sm" />
          <input value={form.whoShared} onChange={e => setForm(f => ({ ...f, whoShared: e.target.value }))}
            placeholder="Who shared this joy with you?" className="game-input w-full text-sm" />
          <input value={form.howLongItLasted} onChange={e => setForm(f => ({ ...f, howLongItLasted: e.target.value }))}
            placeholder="How long did this joy last?" className="game-input w-full text-sm" />
          <input value={form.howToAmplify} onChange={e => setForm(f => ({ ...f, howToAmplify: e.target.value }))}
            placeholder="How could you amplify this joy?" className="game-input w-full text-sm" />
          <input value={form.joyBlock} onChange={e => setForm(f => ({ ...f, joyBlock: e.target.value }))}
            placeholder="What blocks you from more joy like this?" className="game-input w-full text-sm" />
          <input value={form.regularizeHow} onChange={e => setForm(f => ({ ...f, regularizeHow: e.target.value }))}
            placeholder="How can you regularize this source of joy?" className="game-input w-full text-sm" />
          <div>
            <p className="text-xs text-slate-500 mb-1">Joy intensity: {form.joyScore}/10</p>
            <input type="range" min={1} max={10} value={form.joyScore}
              onChange={e => setForm(f => ({ ...f, joyScore: Number(e.target.value) }))}
              className="w-full h-1 accent-yellow-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const s = SOURCE_CONFIG[e.source]
          const d = DEPTH_CONFIG[e.depth]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${s.color}` }}>
              <span className="text-2xl">{s.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-white">{s.label}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: d.color + '20', color: d.color }}>{d.label}</span>
                  <span className="text-xs text-yellow-400">☀️ {e.joyScore}/10</span>
                </div>
                {e.whatBroughtJoy && <p className="text-xs text-slate-300 mt-1 line-clamp-1">{e.whatBroughtJoy}</p>}
                {e.regularizeHow && <p className="text-xs text-green-300/70 mt-0.5">↺ {e.regularizeHow}</p>}
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Sun className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Joy is not a luxury. It is a compass pointing toward your true life.</p>
          </div>
        )}
      </div>
    </div>
  )
}

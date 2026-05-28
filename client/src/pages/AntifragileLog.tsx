import { useState, useEffect } from 'react'
import { Zap, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type StressorType = 'physical' | 'mental' | 'emotional' | 'social' | 'financial' | 'professional' | 'spiritual' | 'creative'
type ResponseType = 'fought' | 'avoided' | 'adapted' | 'grew' | 'transformed'

interface AntifragileEntry {
  id: string
  stressorType: StressorType
  response: ResponseType
  stressor: string
  context: string
  initialReaction: string
  whatHurt: string
  howIGrew: string
  antifragileGain: string
  intensityLevel: number
  growthGain: number
  date: string
  createdAt: string
}

const STRESSOR_CONFIG: Record<StressorType, { label: string; emoji: string; color: string }> = {
  physical:     { label: 'Physical',     emoji: '💪', color: '#ef4444' },
  mental:       { label: 'Mental',       emoji: '🧠', color: '#6366f1' },
  emotional:    { label: 'Emotional',    emoji: '❤️', color: '#ec4899' },
  social:       { label: 'Social',       emoji: '👥', color: '#22c55e' },
  financial:    { label: 'Financial',    emoji: '💰', color: '#f59e0b' },
  professional: { label: 'Professional', emoji: '💼', color: '#3b82f6' },
  spiritual:    { label: 'Spiritual',    emoji: '✨', color: '#a855f7' },
  creative:     { label: 'Creative',     emoji: '🎨', color: '#f97316' },
}

const RESPONSE_CONFIG: Record<ResponseType, { label: string; emoji: string; color: string }> = {
  fought:      { label: 'Fought It',    emoji: '⚔️', color: '#ef4444' },
  avoided:     { label: 'Avoided',      emoji: '🏃', color: '#f97316' },
  adapted:     { label: 'Adapted',      emoji: '🔄', color: '#f59e0b' },
  grew:        { label: 'Grew From',    emoji: '🌱', color: '#22c55e' },
  transformed: { label: 'Transformed',  emoji: '🦋', color: '#a855f7' },
}

const STORAGE_KEY = 'antifragile_log'

export default function AntifragileLog() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<AntifragileEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<AntifragileEntry, 'id' | 'createdAt'>>({
    stressorType: 'mental', response: 'grew', stressor: '', context: '',
    initialReaction: '', whatHurt: '', howIGrew: '', antifragileGain: '',
    intensityLevel: 7, growthGain: 8,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: AntifragileEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.stressor.trim()) return
    const e: AntifragileEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, stressor: '', context: '', initialReaction: '', whatHurt: '', howIGrew: '', antifragileGain: '' }))
    setShowForm(false)
    toastSuccess('Antifragile win logged — stress made you stronger 💪')
  }

  const transformed = entries.filter(e => e.response === 'transformed').length
  const avgGrowth = entries.length ? Math.round(entries.reduce((s, e) => s + e.growthGain, 0) / entries.length) : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Zap className="w-7 h-7 text-orange-400" />
            Antifragile Log
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track how adversity and stress make you stronger.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-orange-700 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Events</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-purple-400">{transformed}</div>
          <div className="text-xs text-slate-500">Transformed</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{avgGrowth}/10</div>
          <div className="text-xs text-slate-500">Avg Growth</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-orange-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Antifragile Event</h3>
          <input value={form.stressor} onChange={e => setForm(f => ({ ...f, stressor: e.target.value }))}
            placeholder="What was the stressor / adversity? *" className="game-input w-full text-sm" autoFocus />
          <div className="flex gap-2">
            <select value={form.stressorType} onChange={e => setForm(f => ({ ...f, stressorType: e.target.value as StressorType }))} className="game-input text-sm flex-1">
              {(Object.entries(STRESSOR_CONFIG) as [StressorType, typeof STRESSOR_CONFIG.mental][]).map(([k, s]) => (
                <option key={k} value={k}>{s.emoji} {s.label}</option>
              ))}
            </select>
            <select value={form.response} onChange={e => setForm(f => ({ ...f, response: e.target.value as ResponseType }))} className="game-input text-sm flex-1">
              {(Object.entries(RESPONSE_CONFIG) as [ResponseType, typeof RESPONSE_CONFIG.grew][]).map(([k, r]) => (
                <option key={k} value={k}>{r.emoji} {r.label}</option>
              ))}
            </select>
          </div>
          <input value={form.context} onChange={e => setForm(f => ({ ...f, context: e.target.value }))}
            placeholder="Context and background" className="game-input w-full text-sm" />
          <input value={form.initialReaction} onChange={e => setForm(f => ({ ...f, initialReaction: e.target.value }))}
            placeholder="What was your initial reaction?" className="game-input w-full text-sm" />
          <input value={form.whatHurt} onChange={e => setForm(f => ({ ...f, whatHurt: e.target.value }))}
            placeholder="What hurt / was hard?" className="game-input w-full text-sm" />
          <textarea value={form.howIGrew} onChange={e => setForm(f => ({ ...f, howIGrew: e.target.value }))}
            placeholder="How did this make you stronger?" className="game-input w-full h-12 resize-none text-sm" />
          <input value={form.antifragileGain} onChange={e => setForm(f => ({ ...f, antifragileGain: e.target.value }))}
            placeholder="Specific antifragile gain / superpower gained" className="game-input w-full text-sm" />
          <div className="flex gap-3">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Intensity: {form.intensityLevel}/10</p>
              <input type="range" min={1} max={10} value={form.intensityLevel}
                onChange={e => setForm(f => ({ ...f, intensityLevel: Number(e.target.value) }))}
                className="w-full h-1 accent-orange-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Growth gain: {form.growthGain}/10</p>
              <input type="range" min={1} max={10} value={form.growthGain}
                onChange={e => setForm(f => ({ ...f, growthGain: Number(e.target.value) }))}
                className="w-full h-1 accent-green-400" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-orange-700 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold">Log Event</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const s = STRESSOR_CONFIG[e.stressorType]
          const r = RESPONSE_CONFIG[e.response]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${s.color}` }}>
              <span className="text-2xl">{s.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-white">{e.stressor}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: r.color + '20', color: r.color }}>{r.emoji} {r.label}</span>
                  <span className="text-xs text-orange-400">🔥 {e.intensityLevel}/10</span>
                  <span className="text-xs text-green-400">🌱 +{e.growthGain}</span>
                </div>
                {e.howIGrew && <p className="text-xs text-green-300/80 mt-1 line-clamp-2">{e.howIGrew}</p>}
                {e.antifragileGain && <p className="text-xs text-purple-300/70 mt-0.5">⚡ {e.antifragileGain}</p>}
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Zap className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">What doesn't kill you makes you antifragile. Start logging.</p>
          </div>
        )}
      </div>
    </div>
  )
}

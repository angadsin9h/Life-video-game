import { useState, useEffect } from 'react'
import { Flame, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type StateType = 'flow' | 'peak-performance' | 'deep-focus' | 'inspired' | 'confident' | 'joyful' | 'connected' | 'energized' | 'creative' | 'grounded'
type StateTrigger = 'physical' | 'mental' | 'emotional' | 'environmental' | 'social' | 'spiritual' | 'nutritional' | 'sleep' | 'music' | 'routine'

interface PeakStateEntry {
  id: string
  stateType: StateType
  trigger: StateTrigger
  description: string
  whatCausedIt: string
  bodyFeelings: string
  mindQuality: string
  howToRecreate: string
  obstacles: string
  intensityScore: number
  durationMinutes: number
  date: string
  createdAt: string
}

const STATE_CONFIG: Record<StateType, { label: string; emoji: string; color: string }> = {
  flow:             { label: 'Flow',            emoji: '🌊', color: '#3b82f6' },
  'peak-performance':{ label: 'Peak Performance',emoji: '🏆', color: '#f59e0b' },
  'deep-focus':     { label: 'Deep Focus',      emoji: '🎯', color: '#ef4444' },
  inspired:         { label: 'Inspired',        emoji: '💡', color: '#eab308' },
  confident:        { label: 'Confident',       emoji: '⚡', color: '#22c55e' },
  joyful:           { label: 'Joyful',          emoji: '✨', color: '#ec4899' },
  connected:        { label: 'Connected',       emoji: '❤️', color: '#f97316' },
  energized:        { label: 'Energized',       emoji: '🔥', color: '#84cc16' },
  creative:         { label: 'Creative',        emoji: '🎨', color: '#a855f7' },
  grounded:         { label: 'Grounded',        emoji: '🌿', color: '#10b981' },
}

const TRIGGER_CONFIG: Record<StateTrigger, { label: string; emoji: string }> = {
  physical:      { label: 'Physical Activity', emoji: '💪' },
  mental:        { label: 'Mental Practice',   emoji: '🧠' },
  emotional:     { label: 'Emotional Work',    emoji: '❤️' },
  environmental: { label: 'Environment',       emoji: '🏠' },
  social:        { label: 'Social Interaction',emoji: '👥' },
  spiritual:     { label: 'Spiritual Practice',emoji: '🙏' },
  nutritional:   { label: 'Nutrition',         emoji: '🥗' },
  sleep:         { label: 'Sleep Quality',     emoji: '😴' },
  music:         { label: 'Music',             emoji: '🎵' },
  routine:       { label: 'Ritual/Routine',    emoji: '🔄' },
}

const STORAGE_KEY = 'peak_state_log'

export default function PeakStateLog() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<PeakStateEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<PeakStateEntry, 'id' | 'createdAt'>>({
    stateType: 'flow', trigger: 'physical', description: '',
    whatCausedIt: '', bodyFeelings: '', mindQuality: '',
    howToRecreate: '', obstacles: '', intensityScore: 8, durationMinutes: 60,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: PeakStateEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.description.trim()) return
    const e: PeakStateEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, description: '', whatCausedIt: '', bodyFeelings: '', mindQuality: '', howToRecreate: '', obstacles: '' }))
    setShowForm(false)
    toastSuccess('Peak state captured — engineer your optimal conditions 🔥')
  }

  const avgIntensity = entries.length ? Math.round(entries.reduce((s, e) => s + e.intensityScore, 0) / entries.length) : 0
  const totalHours = Math.round(entries.reduce((s, e) => s + e.durationMinutes, 0) / 60)

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Flame className="w-7 h-7 text-orange-400" />
            Peak State Log
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track what puts you in your best mental and physical states.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-orange-700 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log State
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">States Logged</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-orange-400">{avgIntensity}/10</div>
          <div className="text-xs text-slate-500">Avg Intensity</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">{totalHours}h</div>
          <div className="text-xs text-slate-500">Peak Hours</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-orange-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Peak State</h3>
          <div className="flex gap-2">
            <select value={form.stateType} onChange={e => setForm(f => ({ ...f, stateType: e.target.value as StateType }))} className="game-input text-sm flex-1">
              {(Object.entries(STATE_CONFIG) as [StateType, typeof STATE_CONFIG.flow][]).map(([k, s]) => (
                <option key={k} value={k}>{s.emoji} {s.label}</option>
              ))}
            </select>
            <select value={form.trigger} onChange={e => setForm(f => ({ ...f, trigger: e.target.value as StateTrigger }))} className="game-input text-sm flex-1">
              {(Object.entries(TRIGGER_CONFIG) as [StateTrigger, typeof TRIGGER_CONFIG.physical][]).map(([k, t]) => (
                <option key={k} value={k}>{t.emoji} {t.label}</option>
              ))}
            </select>
          </div>
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Describe this peak state experience *" className="game-input w-full h-14 resize-none text-sm" autoFocus />
          <input value={form.whatCausedIt} onChange={e => setForm(f => ({ ...f, whatCausedIt: e.target.value }))}
            placeholder="What specifically caused or triggered it?" className="game-input w-full text-sm" />
          <input value={form.bodyFeelings} onChange={e => setForm(f => ({ ...f, bodyFeelings: e.target.value }))}
            placeholder="How did your body feel?" className="game-input w-full text-sm" />
          <input value={form.mindQuality} onChange={e => setForm(f => ({ ...f, mindQuality: e.target.value }))}
            placeholder="Quality of your mind (focus, clarity, etc.)" className="game-input w-full text-sm" />
          <input value={form.howToRecreate} onChange={e => setForm(f => ({ ...f, howToRecreate: e.target.value }))}
            placeholder="How could you reliably recreate this?" className="game-input w-full text-sm" />
          <input value={form.obstacles} onChange={e => setForm(f => ({ ...f, obstacles: e.target.value }))}
            placeholder="What could interfere with this state?" className="game-input w-full text-sm" />
          <div className="flex gap-3">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Intensity: {form.intensityScore}/10</p>
              <input type="range" min={1} max={10} value={form.intensityScore}
                onChange={e => setForm(f => ({ ...f, intensityScore: Number(e.target.value) }))}
                className="w-full h-1 accent-orange-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Duration: {form.durationMinutes}min</p>
              <input type="range" min={5} max={480} step={5} value={form.durationMinutes}
                onChange={e => setForm(f => ({ ...f, durationMinutes: Number(e.target.value) }))}
                className="w-full h-1 accent-orange-400" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-orange-700 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold">Save State</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const s = STATE_CONFIG[e.stateType]
          const t = TRIGGER_CONFIG[e.trigger]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${s.color}` }}>
              <span className="text-2xl">{s.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-white">{s.label}</span>
                  <span className="text-xs text-slate-500">{t.emoji} {t.label}</span>
                  <span className="text-xs text-orange-400">🔥 {e.intensityScore}/10</span>
                  <span className="text-xs text-slate-600">{e.durationMinutes}min</span>
                </div>
                {e.description && <p className="text-xs text-slate-400 mt-1 line-clamp-2">{e.description}</p>}
                {e.howToRecreate && <p className="text-xs text-green-300/70 mt-0.5">→ {e.howToRecreate}</p>}
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Flame className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Peak states are not random. Engineer them intentionally.</p>
          </div>
        )}
      </div>
    </div>
  )
}

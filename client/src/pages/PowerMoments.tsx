import { useState, useEffect } from 'react'
import { Zap, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type PowerContext = 'achievement' | 'connection' | 'creation' | 'service' | 'growth' | 'nature' | 'movement' | 'insight' | 'courage' | 'love'
type PowerIntensity = 'strong' | 'powerful' | 'electric' | 'transcendent'

interface PowerMomentEntry {
  id: string
  title: string
  context: PowerContext
  intensity: PowerIntensity
  whatHappened: string
  howItFelt: string
  whatMadeItPossible: string
  howToRecreate: string
  lesson: string
  powerScore: number
  date: string
  createdAt: string
}

const CTX_CONFIG: Record<PowerContext, { label: string; emoji: string; color: string }> = {
  achievement: { label: 'Achievement', emoji: '🏆', color: '#f59e0b' },
  connection:  { label: 'Connection',  emoji: '❤️', color: '#ec4899' },
  creation:    { label: 'Creation',    emoji: '🎨', color: '#a855f7' },
  service:     { label: 'Service',     emoji: '🤝', color: '#22c55e' },
  growth:      { label: 'Growth',      emoji: '🌱', color: '#84cc16' },
  nature:      { label: 'Nature',      emoji: '🌿', color: '#10b981' },
  movement:    { label: 'Movement',    emoji: '⚡', color: '#f97316' },
  insight:     { label: 'Insight',     emoji: '💡', color: '#eab308' },
  courage:     { label: 'Courage',     emoji: '🔥', color: '#ef4444' },
  love:        { label: 'Love',        emoji: '✨', color: '#6366f1' },
}

const INTENSITY_CONFIG: Record<PowerIntensity, { label: string; color: string; emoji: string }> = {
  strong:       { label: 'Strong',       color: '#3b82f6', emoji: '💪' },
  powerful:     { label: 'Powerful',     color: '#22c55e', emoji: '⚡' },
  electric:     { label: 'Electric',     color: '#f59e0b', emoji: '🌩️' },
  transcendent: { label: 'Transcendent', color: '#a855f7', emoji: '✨' },
}

const STORAGE_KEY = 'power_moments_log'

export default function PowerMoments() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<PowerMomentEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<PowerMomentEntry, 'id' | 'createdAt'>>({
    title: '', context: 'achievement', intensity: 'powerful', whatHappened: '',
    howItFelt: '', whatMadeItPossible: '', howToRecreate: '', lesson: '',
    powerScore: 8, date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: PowerMomentEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.title.trim()) return
    const e: PowerMomentEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, title: '', whatHappened: '', howItFelt: '', whatMadeItPossible: '', howToRecreate: '', lesson: '' }))
    setShowForm(false)
    toastSuccess('Power moment preserved — this is who you truly are ⚡')
  }

  const transcendent = entries.filter(e => e.intensity === 'transcendent').length
  const avgPower = entries.length ? Math.round(entries.reduce((s, e) => s + e.powerScore, 0) / entries.length) : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Zap className="w-7 h-7 text-amber-400" />
            Power Moments
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Capture moments when you felt most alive, powerful, and true.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Moments</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-purple-400">{transcendent}</div>
          <div className="text-xs text-slate-500">Transcendent</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-amber-400">{avgPower}/10</div>
          <div className="text-xs text-slate-500">Avg Power</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-amber-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Capture Power Moment</h3>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Name this moment *" className="game-input w-full text-sm" autoFocus />
          <div className="flex gap-2">
            <select value={form.context} onChange={e => setForm(f => ({ ...f, context: e.target.value as PowerContext }))} className="game-input text-sm flex-1">
              {(Object.entries(CTX_CONFIG) as [PowerContext, typeof CTX_CONFIG.achievement][]).map(([k, c]) => (
                <option key={k} value={k}>{c.emoji} {c.label}</option>
              ))}
            </select>
            <select value={form.intensity} onChange={e => setForm(f => ({ ...f, intensity: e.target.value as PowerIntensity }))} className="game-input text-sm flex-1">
              {(Object.entries(INTENSITY_CONFIG) as [PowerIntensity, typeof INTENSITY_CONFIG.powerful][]).map(([k, i]) => (
                <option key={k} value={k}>{i.emoji} {i.label}</option>
              ))}
            </select>
          </div>
          <textarea value={form.whatHappened} onChange={e => setForm(f => ({ ...f, whatHappened: e.target.value }))}
            placeholder="What happened in this moment?" className="game-input w-full h-14 resize-none text-sm" />
          <input value={form.howItFelt} onChange={e => setForm(f => ({ ...f, howItFelt: e.target.value }))}
            placeholder="Describe the physical and emotional feeling" className="game-input w-full text-sm" />
          <input value={form.whatMadeItPossible} onChange={e => setForm(f => ({ ...f, whatMadeItPossible: e.target.value }))}
            placeholder="What made this moment possible?" className="game-input w-full text-sm" />
          <input value={form.howToRecreate} onChange={e => setForm(f => ({ ...f, howToRecreate: e.target.value }))}
            placeholder="How could you recreate this kind of moment?" className="game-input w-full text-sm" />
          <input value={form.lesson} onChange={e => setForm(f => ({ ...f, lesson: e.target.value }))}
            placeholder="What does this reveal about you?" className="game-input w-full text-sm" />
          <div>
            <p className="text-xs text-slate-500 mb-1">Power intensity: {form.powerScore}/10</p>
            <input type="range" min={1} max={10} value={form.powerScore}
              onChange={e => setForm(f => ({ ...f, powerScore: Number(e.target.value) }))}
              className="w-full h-1 accent-amber-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold">Save Moment</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const c = CTX_CONFIG[e.context]
          const i = INTENSITY_CONFIG[e.intensity]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${c.color}` }}>
              <span className="text-2xl">{c.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-white">{e.title}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: i.color + '20', color: i.color }}>{i.emoji} {i.label}</span>
                  <span className="text-xs text-amber-400">⚡ {e.powerScore}/10</span>
                </div>
                {e.whatHappened && <p className="text-xs text-slate-400 mt-1 line-clamp-2">{e.whatHappened}</p>}
                {e.lesson && <p className="text-xs text-yellow-300/70 mt-0.5">💡 {e.lesson}</p>}
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
            <p className="text-sm">Your power moments reveal your truest self.</p>
          </div>
        )}
      </div>
    </div>
  )
}

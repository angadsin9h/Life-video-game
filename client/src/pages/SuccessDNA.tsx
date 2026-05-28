import { useState, useEffect } from 'react'
import { Trophy, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type SuccessPattern = 'mindset' | 'habit' | 'skill' | 'environment' | 'relationship' | 'timing' | 'preparation' | 'execution' | 'recovery' | 'belief'
type SuccessFrequency = 'rare' | 'occasional' | 'common' | 'consistent' | 'automatic'

interface SuccessDNAEntry {
  id: string
  pattern: SuccessPattern
  frequency: SuccessFrequency
  description: string
  specificExample: string
  whyItWorks: string
  howToActivate: string
  oppositePattern: string
  strengthScore: number
  date: string
  createdAt: string
}

const PATTERN_CONFIG: Record<SuccessPattern, { label: string; emoji: string; color: string }> = {
  mindset:     { label: 'Mindset',     emoji: '🧠', color: '#6366f1' },
  habit:       { label: 'Habit',       emoji: '🔄', color: '#22c55e' },
  skill:       { label: 'Skill',       emoji: '⚒️', color: '#3b82f6' },
  environment: { label: 'Environment', emoji: '🏠', color: '#f59e0b' },
  relationship:{ label: 'Relationship',emoji: '❤️', color: '#ec4899' },
  timing:      { label: 'Timing',      emoji: '⏰', color: '#a855f7' },
  preparation: { label: 'Preparation', emoji: '📋', color: '#84cc16' },
  execution:   { label: 'Execution',   emoji: '⚡', color: '#ef4444' },
  recovery:    { label: 'Recovery',    emoji: '🌿', color: '#10b981' },
  belief:      { label: 'Belief',      emoji: '💡', color: '#eab308' },
}

const FREQ_CONFIG: Record<SuccessFrequency, { label: string; color: string }> = {
  rare:        { label: 'Rare',        color: '#94a3b8' },
  occasional:  { label: 'Occasional',  color: '#6366f1' },
  common:      { label: 'Common',      color: '#3b82f6' },
  consistent:  { label: 'Consistent',  color: '#22c55e' },
  automatic:   { label: 'Automatic',   color: '#f59e0b' },
}

const STORAGE_KEY = 'success_dna_log'

export default function SuccessDNA() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<SuccessDNAEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<SuccessDNAEntry, 'id' | 'createdAt'>>({
    pattern: 'mindset', frequency: 'consistent', description: '',
    specificExample: '', whyItWorks: '', howToActivate: '',
    oppositePattern: '', strengthScore: 7,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: SuccessDNAEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.description.trim()) return
    const e: SuccessDNAEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, description: '', specificExample: '', whyItWorks: '', howToActivate: '', oppositePattern: '' }))
    setShowForm(false)
    toastSuccess('Success pattern documented — decode your DNA of winning 🏆')
  }

  const automatic = entries.filter(e => e.frequency === 'automatic' || e.frequency === 'consistent').length
  const avgStrength = entries.length ? Math.round(entries.reduce((s, e) => s + e.strengthScore, 0) / entries.length) : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Trophy className="w-7 h-7 text-gold-400 text-yellow-500" />
            Success DNA
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Identify and amplify the patterns that drive your success.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add Pattern
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Patterns</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">{automatic}</div>
          <div className="text-xs text-slate-500">Automatic</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-amber-400">{avgStrength}/10</div>
          <div className="text-xs text-slate-500">Avg Strength</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-yellow-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Map Success Pattern</h3>
          <div className="flex gap-2">
            <select value={form.pattern} onChange={e => setForm(f => ({ ...f, pattern: e.target.value as SuccessPattern }))} className="game-input text-sm flex-1">
              {(Object.entries(PATTERN_CONFIG) as [SuccessPattern, typeof PATTERN_CONFIG.mindset][]).map(([k, p]) => (
                <option key={k} value={k}>{p.emoji} {p.label}</option>
              ))}
            </select>
            <select value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value as SuccessFrequency }))} className="game-input text-sm flex-1">
              {(Object.entries(FREQ_CONFIG) as [SuccessFrequency, typeof FREQ_CONFIG.consistent][]).map(([k, f]) => (
                <option key={k} value={k}>{f.label}</option>
              ))}
            </select>
          </div>
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Describe this success pattern *" className="game-input w-full h-12 resize-none text-sm" autoFocus />
          <input value={form.specificExample} onChange={e => setForm(f => ({ ...f, specificExample: e.target.value }))}
            placeholder="Specific example of this pattern working" className="game-input w-full text-sm" />
          <input value={form.whyItWorks} onChange={e => setForm(f => ({ ...f, whyItWorks: e.target.value }))}
            placeholder="Why does this pattern work for you?" className="game-input w-full text-sm" />
          <input value={form.howToActivate} onChange={e => setForm(f => ({ ...f, howToActivate: e.target.value }))}
            placeholder="How do you activate or trigger this pattern?" className="game-input w-full text-sm" />
          <input value={form.oppositePattern} onChange={e => setForm(f => ({ ...f, oppositePattern: e.target.value }))}
            placeholder="What is the opposite / failure pattern?" className="game-input w-full text-sm" />
          <div>
            <p className="text-xs text-slate-500 mb-1">Pattern strength: {form.strengthScore}/10</p>
            <input type="range" min={1} max={10} value={form.strengthScore}
              onChange={e => setForm(f => ({ ...f, strengthScore: Number(e.target.value) }))}
              className="w-full h-1 accent-yellow-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-xl text-sm font-semibold">Save Pattern</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const p = PATTERN_CONFIG[e.pattern]
          const f = FREQ_CONFIG[e.frequency]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${p.color}` }}>
              <span className="text-2xl">{p.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-white">{p.label}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: f.color + '20', color: f.color }}>{f.label}</span>
                  <span className="text-xs text-yellow-400">🏆 {e.strengthScore}/10</span>
                </div>
                {e.description && <p className="text-xs text-slate-400 mt-1 line-clamp-2">{e.description}</p>}
                {e.howToActivate && <p className="text-xs text-green-300/70 mt-0.5">⚡ {e.howToActivate}</p>}
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Trophy className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Success leaves clues. Decode your own winning patterns.</p>
          </div>
        )}
      </div>
    </div>
  )
}

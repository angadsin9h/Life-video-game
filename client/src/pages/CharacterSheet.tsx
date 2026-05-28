import { useState, useEffect } from 'react'
import { User, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type CharacterTrait = 'strength' | 'wisdom' | 'courage' | 'compassion' | 'discipline' | 'creativity' | 'curiosity' | 'integrity' | 'resilience' | 'humor'
type TraitLevel = 'developing' | 'emerging' | 'established' | 'strong' | 'legendary'

interface CharacterAttribute {
  id: string
  trait: CharacterTrait
  level: TraitLevel
  description: string
  evidence: string
  howtoDevelop: string
  score: number
  date: string
  createdAt: string
}

const TRAIT_CONFIG: Record<CharacterTrait, { label: string; emoji: string; color: string }> = {
  strength:   { label: 'Strength',   emoji: '💪', color: '#ef4444' },
  wisdom:     { label: 'Wisdom',     emoji: '🦉', color: '#f59e0b' },
  courage:    { label: 'Courage',    emoji: '🦁', color: '#f97316' },
  compassion: { label: 'Compassion', emoji: '❤️', color: '#ec4899' },
  discipline: { label: 'Discipline', emoji: '⚔️', color: '#3b82f6' },
  creativity: { label: 'Creativity', emoji: '🎨', color: '#a855f7' },
  curiosity:  { label: 'Curiosity',  emoji: '🔍', color: '#6366f1' },
  integrity:  { label: 'Integrity',  emoji: '🛡️', color: '#22c55e' },
  resilience: { label: 'Resilience', emoji: '🌊', color: '#0ea5e9' },
  humor:      { label: 'Humor',      emoji: '😄', color: '#84cc16' },
}

const LEVEL_CONFIG: Record<TraitLevel, { label: string; color: string; stars: number }> = {
  developing:  { label: 'Developing',  color: '#94a3b8', stars: 1 },
  emerging:    { label: 'Emerging',    color: '#22c55e', stars: 2 },
  established: { label: 'Established', color: '#3b82f6', stars: 3 },
  strong:      { label: 'Strong',      color: '#f59e0b', stars: 4 },
  legendary:   { label: 'Legendary',   color: '#a855f7', stars: 5 },
}

const STORAGE_KEY = 'character_sheet'

export default function CharacterSheet() {
  const { toastSuccess } = useToast()
  const [attributes, setAttributes] = useState<CharacterAttribute[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<CharacterAttribute, 'id' | 'createdAt'>>({
    trait: 'courage', level: 'emerging', description: '', evidence: '',
    howtoDevelop: '', score: 7,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setAttributes(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: CharacterAttribute[]) => { setAttributes(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.description.trim()) return
    const a: CharacterAttribute = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([a, ...attributes])
    setForm(f => ({ ...f, description: '', evidence: '', howtoDevelop: '' }))
    setShowForm(false)
    toastSuccess('Character attribute recorded — build your legend 🦁')
  }

  const legendary = attributes.filter(a => a.level === 'legendary').length
  const avgScore = attributes.length ? Math.round(attributes.reduce((s, a) => s + a.score, 0) / attributes.length) : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <User className="w-7 h-7 text-violet-400" />
            Character Sheet
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Define and level up your core character attributes.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-violet-700 hover:bg-violet-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{attributes.length}</div>
          <div className="text-xs text-slate-500">Traits</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-violet-400">{avgScore}/10</div>
          <div className="text-xs text-slate-500">Avg Score</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">{legendary}</div>
          <div className="text-xs text-slate-500">Legendary</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-violet-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Add Character Attribute</h3>
          <div className="flex gap-2">
            <select value={form.trait} onChange={e => setForm(f => ({ ...f, trait: e.target.value as CharacterTrait }))} className="game-input text-sm flex-1">
              {(Object.entries(TRAIT_CONFIG) as [CharacterTrait, typeof TRAIT_CONFIG.courage][]).map(([k, t]) => (
                <option key={k} value={k}>{t.emoji} {t.label}</option>
              ))}
            </select>
            <select value={form.level} onChange={e => setForm(f => ({ ...f, level: e.target.value as TraitLevel }))} className="game-input text-sm flex-1">
              {(Object.entries(LEVEL_CONFIG) as [TraitLevel, typeof LEVEL_CONFIG.emerging][]).map(([k, l]) => (
                <option key={k} value={k}>{l.label}</option>
              ))}
            </select>
          </div>
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Describe this trait in yourself *" className="game-input w-full h-12 resize-none text-sm" autoFocus />
          <input value={form.evidence} onChange={e => setForm(f => ({ ...f, evidence: e.target.value }))}
            placeholder="Evidence — specific examples of this trait" className="game-input w-full text-sm" />
          <input value={form.howtoDevelop} onChange={e => setForm(f => ({ ...f, howtoDevelop: e.target.value }))}
            placeholder="How are you developing this further?" className="game-input w-full text-sm" />
          <div>
            <p className="text-xs text-slate-500 mb-1">Current score: {form.score}/10</p>
            <input type="range" min={1} max={10} value={form.score}
              onChange={e => setForm(f => ({ ...f, score: Number(e.target.value) }))}
              className="w-full h-1 accent-violet-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-violet-700 hover:bg-violet-600 text-white rounded-xl text-sm font-semibold">Add Trait</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {attributes.map(a => {
          const t = TRAIT_CONFIG[a.trait]
          const l = LEVEL_CONFIG[a.level]
          return (
            <div key={a.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${t.color}` }}>
              <span className="text-2xl">{t.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-white">{t.label}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: l.color + '20', color: l.color }}>{l.label}</span>
                  <span className="text-xs text-violet-400">⭐ {a.score}/10</span>
                </div>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{a.description}</p>
                {a.evidence && <p className="text-xs text-green-300/80 mt-0.5">Evidence: {a.evidence}</p>}
                <div className="flex mt-0.5">
                  {Array.from({ length: l.stars }).map((_, i) => (
                    <span key={i} className="text-yellow-400 text-xs">★</span>
                  ))}
                </div>
              </div>
              <button onClick={() => save(attributes.filter(x => x.id !== a.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {attributes.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <User className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Character is built one decision at a time. Know thyself.</p>
          </div>
        )}
      </div>
    </div>
  )
}

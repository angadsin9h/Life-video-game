import { useState, useEffect } from 'react'
import { Flame, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type MotivationType = 'intrinsic' | 'extrinsic' | 'identity' | 'purpose' | 'fear' | 'reward' | 'social' | 'mastery' | 'other'
type MotivationArea = 'fitness' | 'career' | 'learning' | 'finance' | 'relationships' | 'creativity' | 'health' | 'spirituality' | 'personal' | 'other'

interface MotivationEntry {
  id: string
  motivationType: MotivationType
  area: MotivationArea
  trigger: string
  whyItFuelsMe: string
  action: string
  futureSelf: string
  energyLevel: number
  sustainability: number
  date: string
  createdAt: string
}

const TYPE_CONFIG: Record<MotivationType, { label: string; emoji: string; color: string; description: string }> = {
  intrinsic:  { label: 'Intrinsic',     emoji: '🌱', color: '#22c55e', description: 'Driven from within — joy, curiosity, mastery' },
  extrinsic:  { label: 'Extrinsic',     emoji: '🏆', color: '#f59e0b', description: 'External reward or recognition' },
  identity:   { label: 'Identity-Based',emoji: '🪞', color: '#a855f7', description: 'Who I am / want to become' },
  purpose:    { label: 'Purpose-Driven',emoji: '🎯', color: '#3b82f6', description: 'Bigger mission or meaning' },
  fear:       { label: 'Fear-Based',    emoji: '⚡', color: '#ef4444', description: 'Avoidance of pain or consequence' },
  reward:     { label: 'Reward',        emoji: '🎁', color: '#ec4899', description: 'Treats and milestones' },
  social:     { label: 'Social',        emoji: '👥', color: '#0ea5e9', description: 'Community, accountability, belonging' },
  mastery:    { label: 'Mastery',       emoji: '⚔️', color: '#6366f1', description: 'Getting better, skill progression' },
  other:      { label: 'Other',         emoji: '💭', color: '#94a3b8', description: '' },
}

const AREA_CONFIG: Record<MotivationArea, { label: string; color: string }> = {
  fitness:       { label: 'Fitness',       color: '#ef4444' },
  career:        { label: 'Career',        color: '#3b82f6' },
  learning:      { label: 'Learning',      color: '#6366f1' },
  finance:       { label: 'Finance',       color: '#f59e0b' },
  relationships: { label: 'Relationships', color: '#ec4899' },
  creativity:    { label: 'Creativity',    color: '#f97316' },
  health:        { label: 'Health',        color: '#22c55e' },
  spirituality:  { label: 'Spirituality',  color: '#84cc16' },
  personal:      { label: 'Personal',      color: '#a855f7' },
  other:         { label: 'Other',         color: '#94a3b8' },
}

const STORAGE_KEY = 'motivation_log'

export default function MotivationLog() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<MotivationEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<MotivationEntry, 'id' | 'createdAt'>>({
    motivationType: 'intrinsic', area: 'personal', trigger: '', whyItFuelsMe: '',
    action: '', futureSelf: '', energyLevel: 8, sustainability: 7,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: MotivationEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.trigger.trim()) return
    const e: MotivationEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, trigger: '', whyItFuelsMe: '', action: '', futureSelf: '' }))
    setShowForm(false)
    toastSuccess('Motivation captured! Keep the fire burning 🔥')
  }

  const avgEnergy = entries.length ? Math.round(entries.reduce((s, e) => s + e.energyLevel, 0) / entries.length) : 0
  const intrinsicCount = entries.filter(e => e.motivationType === 'intrinsic' || e.motivationType === 'identity' || e.motivationType === 'purpose' || e.motivationType === 'mastery').length

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Flame className="w-7 h-7 text-orange-400" />
            Motivation Log
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Understand what fuels you — capture your motivational fire.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-orange-700 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Entries</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{intrinsicCount}</div>
          <div className="text-xs text-slate-500">Deep Drivers</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-orange-400">{avgEnergy}/10</div>
          <div className="text-xs text-slate-500">Avg Energy</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-orange-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Motivation Source</h3>
          <div className="flex gap-2">
            <select value={form.motivationType} onChange={e => setForm(f => ({ ...f, motivationType: e.target.value as MotivationType }))} className="game-input text-sm flex-1">
              {(Object.entries(TYPE_CONFIG) as [MotivationType, typeof TYPE_CONFIG.intrinsic][]).map(([k, t]) => (
                <option key={k} value={k}>{t.emoji} {t.label}</option>
              ))}
            </select>
            <select value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value as MotivationArea }))} className="game-input text-sm flex-1">
              {(Object.entries(AREA_CONFIG) as [MotivationArea, typeof AREA_CONFIG.fitness][]).map(([k, a]) => (
                <option key={k} value={k}>{a.label}</option>
              ))}
            </select>
          </div>
          <textarea value={form.trigger} onChange={e => setForm(f => ({ ...f, trigger: e.target.value }))}
            placeholder="What's motivating you right now? *" className="game-input w-full h-14 resize-none text-sm" autoFocus />
          <textarea value={form.whyItFuelsMe} onChange={e => setForm(f => ({ ...f, whyItFuelsMe: e.target.value }))}
            placeholder="Why does this fuel you so deeply?" className="game-input w-full h-10 resize-none text-sm" />
          <input value={form.action} onChange={e => setForm(f => ({ ...f, action: e.target.value }))}
            placeholder="Action you'll take from this motivation" className="game-input w-full text-sm" />
          <input value={form.futureSelf} onChange={e => setForm(f => ({ ...f, futureSelf: e.target.value }))}
            placeholder="Who will you become by staying motivated?" className="game-input w-full text-sm" />
          <div className="flex gap-3">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Energy level: {form.energyLevel}/10</p>
              <input type="range" min={1} max={10} value={form.energyLevel}
                onChange={e => setForm(f => ({ ...f, energyLevel: Number(e.target.value) }))}
                className="w-full h-1 accent-orange-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Sustainability: {form.sustainability}/10</p>
              <input type="range" min={1} max={10} value={form.sustainability}
                onChange={e => setForm(f => ({ ...f, sustainability: Number(e.target.value) }))}
                className="w-full h-1 accent-green-400" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-orange-700 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const t = TYPE_CONFIG[e.motivationType]
          const a = AREA_CONFIG[e.area]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${t.color}` }}>
              <span className="text-2xl">{t.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: t.color + '20', color: t.color }}>{t.label}</span>
                  <span className="text-xs text-slate-500">{a.label}</span>
                  <span className="text-xs text-orange-400">⚡ {e.energyLevel}/10</span>
                </div>
                <p className="text-xs text-slate-300 mt-1 line-clamp-2">{e.trigger}</p>
                {e.whyItFuelsMe && <p className="text-xs text-orange-300/80 mt-0.5">Why: {e.whyItFuelsMe}</p>}
                {e.action && <p className="text-xs text-green-300 mt-0.5">→ {e.action}</p>}
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
            <p className="text-sm">Know your fire. Log what drives you.</p>
          </div>
        )}
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { RefreshCw, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type RitualTime = 'morning' | 'midday' | 'evening' | 'night' | 'weekly' | 'monthly' | 'seasonal' | 'other'
type RitualCategory = 'physical' | 'mental' | 'spiritual' | 'creative' | 'social' | 'financial' | 'learning' | 'self-care' | 'other'
type RitualStrength = 'anchor' | 'strong' | 'building' | 'fragile' | 'new'

interface Ritual {
  id: string
  name: string
  ritualTime: RitualTime
  category: RitualCategory
  strength: RitualStrength
  steps: string[]
  duration: number
  whyItMatters: string
  howItFeelsAfter: string
  currentStreak: number
  isNonnegotiable: boolean
  date: string
  createdAt: string
}

const TIME_CONFIG: Record<RitualTime, { label: string; emoji: string; color: string }> = {
  morning:  { label: 'Morning',  emoji: '🌅', color: '#f59e0b' },
  midday:   { label: 'Midday',   emoji: '☀️', color: '#f97316' },
  evening:  { label: 'Evening',  emoji: '🌆', color: '#6366f1' },
  night:    { label: 'Night',    emoji: '🌙', color: '#3b82f6' },
  weekly:   { label: 'Weekly',   emoji: '📅', color: '#22c55e' },
  monthly:  { label: 'Monthly',  emoji: '🗓️', color: '#a855f7' },
  seasonal: { label: 'Seasonal', emoji: '🍂', color: '#0ea5e9' },
  other:    { label: 'Other',    emoji: '🔄', color: '#94a3b8' },
}

const CAT_CONFIG: Record<RitualCategory, { label: string; color: string }> = {
  physical:   { label: 'Physical',   color: '#ef4444' },
  mental:     { label: 'Mental',     color: '#a855f7' },
  spiritual:  { label: 'Spiritual',  color: '#84cc16' },
  creative:   { label: 'Creative',   color: '#f97316' },
  social:     { label: 'Social',     color: '#22c55e' },
  financial:  { label: 'Financial',  color: '#f59e0b' },
  learning:   { label: 'Learning',   color: '#6366f1' },
  'self-care':{ label: 'Self-Care',  color: '#ec4899' },
  other:      { label: 'Other',      color: '#94a3b8' },
}

const STRENGTH_CONFIG: Record<RitualStrength, { label: string; color: string; bar: number }> = {
  anchor:   { label: 'Anchor',   color: '#22c55e', bar: 100 },
  strong:   { label: 'Strong',   color: '#84cc16', bar: 80 },
  building: { label: 'Building', color: '#f59e0b', bar: 55 },
  fragile:  { label: 'Fragile',  color: '#f97316', bar: 30 },
  new:      { label: 'New',      color: '#3b82f6', bar: 15 },
}

const STORAGE_KEY = 'personal_rituals'

export default function PersonalRituals() {
  const { toastSuccess } = useToast()
  const [rituals, setRituals] = useState<Ritual[]>([])
  const [showForm, setShowForm] = useState(false)
  const [newStep, setNewStep] = useState('')
  const [form, setForm] = useState<Omit<Ritual, 'id' | 'createdAt'>>({
    name: '', ritualTime: 'morning', category: 'mental', strength: 'building',
    steps: [], duration: 15, whyItMatters: '', howItFeelsAfter: '',
    currentStreak: 0, isNonnegotiable: false, date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setRituals(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: Ritual[]) => { setRituals(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const addStep = () => {
    if (!newStep.trim()) return
    setForm(f => ({ ...f, steps: [...f.steps, newStep.trim()] }))
    setNewStep('')
  }

  const submit = () => {
    if (!form.name.trim()) return
    const r: Ritual = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([r, ...rituals])
    setForm(f => ({ ...f, name: '', steps: [], whyItMatters: '', howItFeelsAfter: '', currentStreak: 0, isNonnegotiable: false }))
    setNewStep('')
    setShowForm(false)
    toastSuccess('Ritual added — consistency is character 🔄')
  }

  const anchors = rituals.filter(r => r.strength === 'anchor').length
  const nonneg = rituals.filter(r => r.isNonnegotiable).length

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <RefreshCw className="w-7 h-7 text-teal-400" />
            Personal Rituals
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Design rituals that ground you and elevate your life.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-teal-700 hover:bg-teal-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{rituals.length}</div>
          <div className="text-xs text-slate-500">Rituals</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{anchors}</div>
          <div className="text-xs text-slate-500">Anchors</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-red-400">{nonneg}</div>
          <div className="text-xs text-slate-500">Non-Negotiables</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-teal-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Add Ritual</h3>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Ritual name *" className="game-input w-full text-sm" autoFocus />
          <div className="flex gap-2">
            <select value={form.ritualTime} onChange={e => setForm(f => ({ ...f, ritualTime: e.target.value as RitualTime }))} className="game-input text-sm flex-1">
              {(Object.entries(TIME_CONFIG) as [RitualTime, typeof TIME_CONFIG.morning][]).map(([k, t]) => (
                <option key={k} value={k}>{t.emoji} {t.label}</option>
              ))}
            </select>
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as RitualCategory }))} className="game-input text-sm flex-1">
              {(Object.entries(CAT_CONFIG) as [RitualCategory, typeof CAT_CONFIG.physical][]).map(([k, c]) => (
                <option key={k} value={k}>{c.label}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <select value={form.strength} onChange={e => setForm(f => ({ ...f, strength: e.target.value as RitualStrength }))} className="game-input text-sm flex-1">
              {(Object.entries(STRENGTH_CONFIG) as [RitualStrength, typeof STRENGTH_CONFIG.anchor][]).map(([k, s]) => (
                <option key={k} value={k}>{s.label}</option>
              ))}
            </select>
            <div className="flex-1">
              <input type="number" min={1} value={form.duration}
                onChange={e => setForm(f => ({ ...f, duration: Number(e.target.value) }))}
                className="game-input w-full text-sm" placeholder="Duration (min)" />
            </div>
          </div>
          <div className="flex gap-2">
            <input value={newStep} onChange={e => setNewStep(e.target.value)}
              placeholder="Add a step..." className="game-input flex-1 text-sm"
              onKeyDown={e => { if (e.key === 'Enter') addStep() }} />
            <button onClick={addStep} className="px-3 py-1.5 bg-teal-700/30 text-teal-400 rounded-xl text-xs">+</button>
          </div>
          {form.steps.length > 0 && (
            <div className="space-y-0.5">
              {form.steps.map((step, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-teal-300">
                  <span className="text-slate-500">{i + 1}.</span><span className="flex-1">{step}</span>
                  <button onClick={() => setForm(fo => ({ ...fo, steps: fo.steps.filter((_, j) => j !== i) }))} className="hover:text-red-400">×</button>
                </div>
              ))}
            </div>
          )}
          <input value={form.whyItMatters} onChange={e => setForm(f => ({ ...f, whyItMatters: e.target.value }))}
            placeholder="Why this ritual matters to you" className="game-input w-full text-sm" />
          <input value={form.howItFeelsAfter} onChange={e => setForm(f => ({ ...f, howItFeelsAfter: e.target.value }))}
            placeholder="How you feel after doing it" className="game-input w-full text-sm" />
          <div className="flex gap-3 items-center">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Current streak: {form.currentStreak} days</p>
              <input type="number" min={0} value={form.currentStreak}
                onChange={e => setForm(f => ({ ...f, currentStreak: Number(e.target.value) }))}
                className="game-input w-full text-sm" />
            </div>
            <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
              <input type="checkbox" checked={form.isNonnegotiable} onChange={e => setForm(f => ({ ...f, isNonnegotiable: e.target.checked }))} />
              Non-Negotiable
            </label>
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-teal-700 hover:bg-teal-600 text-white rounded-xl text-sm font-semibold">Add Ritual</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {rituals.map(r => {
          const t = TIME_CONFIG[r.ritualTime]
          const c = CAT_CONFIG[r.category]
          const s = STRENGTH_CONFIG[r.strength]
          return (
            <div key={r.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${t.color}` }}>
              <span className="text-2xl">{t.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-white">{r.name}</span>
                  {r.isNonnegotiable && <span className="text-xs text-red-400">🔒 Non-Neg</span>}
                  <span className="text-xs text-slate-500">{r.duration}min · {c.label}</span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <div className="flex-1 bg-slate-700 rounded-full h-1">
                    <div className="h-1 rounded-full" style={{ width: `${s.bar}%`, background: s.color }} />
                  </div>
                  <span className="text-xs" style={{ color: s.color }}>{s.label}</span>
                </div>
                {r.currentStreak > 0 && <p className="text-xs text-orange-400 mt-0.5">🔥 {r.currentStreak} day streak</p>}
                {r.steps.length > 0 && <p className="text-xs text-slate-500 mt-0.5">{r.steps.length} steps</p>}
              </div>
              <button onClick={() => save(rituals.filter(x => x.id !== r.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {rituals.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <RefreshCw className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Rituals anchor you when motivation fades. Build yours.</p>
          </div>
        )}
      </div>
    </div>
  )
}

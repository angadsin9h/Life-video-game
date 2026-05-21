import { useState, useEffect } from 'react'
import { Sparkles, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type RitualTime2 = 'morning' | 'pre-work' | 'between-tasks' | 'post-work' | 'evening' | 'weekly' | 'monthly' | 'annual'
type RitualPurpose = 'prime' | 'focus' | 'transition' | 'recovery' | 'celebrate' | 'reflect' | 'connect' | 'create' | 'rejuvenate'

interface SuccessRitual {
  id: string
  name: string
  ritualTime: RitualTime2
  purpose: RitualPurpose
  steps: string
  duration: number
  whyItWorks: string
  howConsistent: number
  powerRating: number
  date: string
  createdAt: string
}

const TIME_CONFIG: Record<RitualTime2, { label: string; emoji: string; color: string }> = {
  morning:          { label: 'Morning',         emoji: '☀️', color: '#f59e0b' },
  'pre-work':       { label: 'Pre-Work',        emoji: '🎯', color: '#3b82f6' },
  'between-tasks':  { label: 'Between Tasks',   emoji: '⚡', color: '#6366f1' },
  'post-work':      { label: 'Post-Work',       emoji: '🌅', color: '#f97316' },
  evening:          { label: 'Evening',         emoji: '🌙', color: '#a855f7' },
  weekly:           { label: 'Weekly',          emoji: '📅', color: '#22c55e' },
  monthly:          { label: 'Monthly',         emoji: '🗓️', color: '#ec4899' },
  annual:           { label: 'Annual',          emoji: '🎆', color: '#84cc16' },
}

const PURPOSE_CONFIG: Record<RitualPurpose, { label: string; emoji: string }> = {
  prime:       { label: 'Prime State',   emoji: '🚀' },
  focus:       { label: 'Focus',         emoji: '🎯' },
  transition:  { label: 'Transition',    emoji: '🔄' },
  recovery:    { label: 'Recovery',      emoji: '🌿' },
  celebrate:   { label: 'Celebrate',     emoji: '🎉' },
  reflect:     { label: 'Reflect',       emoji: '🪞' },
  connect:     { label: 'Connect',       emoji: '❤️' },
  create:      { label: 'Create',        emoji: '🎨' },
  rejuvenate:  { label: 'Rejuvenate',    emoji: '💧' },
}

const STORAGE_KEY = 'success_rituals'

export default function SuccessRituals() {
  const { toastSuccess } = useToast()
  const [rituals, setRituals] = useState<SuccessRitual[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<SuccessRitual, 'id' | 'createdAt'>>({
    name: '', ritualTime: 'morning', purpose: 'prime', steps: '',
    duration: 20, whyItWorks: '', howConsistent: 7, powerRating: 8,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setRituals(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: SuccessRitual[]) => { setRituals(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.name.trim()) return
    const r: SuccessRitual = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([r, ...rituals])
    setForm(f => ({ ...f, name: '', steps: '', whyItWorks: '' }))
    setShowForm(false)
    toastSuccess('Success ritual defined — ritual creates mastery ✨')
  }

  const avgPower = rituals.length ? Math.round(rituals.reduce((s, r) => s + r.powerRating, 0) / rituals.length) : 0
  const totalTime = rituals.reduce((s, r) => s + r.duration, 0)

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Sparkles className="w-7 h-7 text-amber-400" />
            Success Rituals
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Design intentional rituals for peak performance and wellbeing.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{rituals.length}</div>
          <div className="text-xs text-slate-500">Rituals</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-amber-400">{totalTime}m</div>
          <div className="text-xs text-slate-500">Total Daily</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">{avgPower}/10</div>
          <div className="text-xs text-slate-500">Avg Power</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-amber-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Define Success Ritual</h3>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Ritual name *" className="game-input w-full text-sm" autoFocus />
          <div className="flex gap-2">
            <select value={form.ritualTime} onChange={e => setForm(f => ({ ...f, ritualTime: e.target.value as RitualTime2 }))} className="game-input text-sm flex-1">
              {(Object.entries(TIME_CONFIG) as [RitualTime2, typeof TIME_CONFIG.morning][]).map(([k, t]) => (
                <option key={k} value={k}>{t.emoji} {t.label}</option>
              ))}
            </select>
            <select value={form.purpose} onChange={e => setForm(f => ({ ...f, purpose: e.target.value as RitualPurpose }))} className="game-input text-sm flex-1">
              {(Object.entries(PURPOSE_CONFIG) as [RitualPurpose, typeof PURPOSE_CONFIG.prime][]).map(([k, p]) => (
                <option key={k} value={k}>{p.emoji} {p.label}</option>
              ))}
            </select>
          </div>
          <textarea value={form.steps} onChange={e => setForm(f => ({ ...f, steps: e.target.value }))}
            placeholder="Step by step ritual description" className="game-input w-full h-14 resize-none text-sm" />
          <input value={form.whyItWorks} onChange={e => setForm(f => ({ ...f, whyItWorks: e.target.value }))}
            placeholder="Why does this ritual work for you?" className="game-input w-full text-sm" />
          <div className="flex gap-3">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Duration: {form.duration}min</p>
              <input type="range" min={1} max={120} value={form.duration}
                onChange={e => setForm(f => ({ ...f, duration: Number(e.target.value) }))}
                className="w-full h-1 accent-amber-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Consistency: {form.howConsistent}/10</p>
              <input type="range" min={1} max={10} value={form.howConsistent}
                onChange={e => setForm(f => ({ ...f, howConsistent: Number(e.target.value) }))}
                className="w-full h-1 accent-amber-400" />
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Power rating: {form.powerRating}/10</p>
            <input type="range" min={1} max={10} value={form.powerRating}
              onChange={e => setForm(f => ({ ...f, powerRating: Number(e.target.value) }))}
              className="w-full h-1 accent-amber-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold">Add Ritual</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {rituals.map(r => {
          const t = TIME_CONFIG[r.ritualTime]
          const p = PURPOSE_CONFIG[r.purpose]
          return (
            <div key={r.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${t.color}` }}>
              <span className="text-2xl">{t.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-white">{r.name}</span>
                  <span className="text-xs">{p.emoji}</span>
                  <span className="text-xs text-slate-500">{t.label}</span>
                  <span className="text-xs text-amber-400">⏱ {r.duration}min</span>
                  <span className="text-xs text-yellow-400">⭐ {r.powerRating}/10</span>
                </div>
                {r.steps && <p className="text-xs text-slate-400 mt-1 line-clamp-2">{r.steps}</p>}
                {r.whyItWorks && <p className="text-xs text-green-300/70 mt-0.5">{r.whyItWorks}</p>}
              </div>
              <button onClick={() => save(rituals.filter(x => x.id !== r.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {rituals.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Sparkles className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Rituals are the architecture of a great life. Design yours.</p>
          </div>
        )}
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { Target, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type IntentionScope = 'morning' | 'evening' | 'week' | 'month' | 'year' | 'project' | 'relationship' | 'meeting' | 'other'
type IntentionPillar = 'health' | 'mindset' | 'career' | 'relationships' | 'creativity' | 'spirituality' | 'finance' | 'growth' | 'other'

interface Intention {
  id: string
  scope: IntentionScope
  pillar: IntentionPillar
  intention: string
  whyItMatters: string
  howItFeels: string
  affirmation: string
  completed: boolean
  date: string
  createdAt: string
}

const SCOPE_CONFIG: Record<IntentionScope, { label: string; emoji: string; color: string }> = {
  morning:      { label: 'Morning',      emoji: '🌅', color: '#f59e0b' },
  evening:      { label: 'Evening',      emoji: '🌙', color: '#6366f1' },
  week:         { label: 'This Week',    emoji: '📅', color: '#3b82f6' },
  month:        { label: 'This Month',   emoji: '🗓️', color: '#22c55e' },
  year:         { label: 'This Year',    emoji: '🎯', color: '#ec4899' },
  project:      { label: 'Project',      emoji: '📁', color: '#f97316' },
  relationship: { label: 'Relationship', emoji: '❤️', color: '#ef4444' },
  meeting:      { label: 'Meeting/Call', emoji: '🤝', color: '#0ea5e9' },
  other:        { label: 'Other',        emoji: '✨', color: '#94a3b8' },
}

const PILLAR_CONFIG: Record<IntentionPillar, { label: string; color: string }> = {
  health:        { label: 'Health',        color: '#ef4444' },
  mindset:       { label: 'Mindset',       color: '#a855f7' },
  career:        { label: 'Career',        color: '#3b82f6' },
  relationships: { label: 'Relationships', color: '#ec4899' },
  creativity:    { label: 'Creativity',    color: '#f97316' },
  spirituality:  { label: 'Spirituality',  color: '#84cc16' },
  finance:       { label: 'Finance',       color: '#f59e0b' },
  growth:        { label: 'Growth',        color: '#22c55e' },
  other:         { label: 'Other',         color: '#94a3b8' },
}

const EXAMPLE_INTENTIONS = [
  'I intend to listen fully before responding',
  'I intend to approach challenges with curiosity',
  'I intend to honor my body with movement and rest',
  'I intend to speak honestly and kindly',
  'I intend to finish what I start today',
]

const STORAGE_KEY = 'intention_setter'

export default function IntentionSetter() {
  const { toastSuccess } = useToast()
  const [intentions, setIntentions] = useState<Intention[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<Intention, 'id' | 'createdAt'>>({
    scope: 'morning', pillar: 'mindset', intention: '', whyItMatters: '',
    howItFeels: '', affirmation: '', completed: false,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setIntentions(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: Intention[]) => { setIntentions(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.intention.trim()) return
    const i: Intention = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([i, ...intentions])
    setForm(f => ({ ...f, intention: '', whyItMatters: '', howItFeels: '', affirmation: '' }))
    setShowForm(false)
    toastSuccess('Intention set! ✨')
  }

  const completed = intentions.filter(i => i.completed).length
  const today = new Date().toISOString().split('T')[0]
  const todayCount = intentions.filter(i => i.date === today).length

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Target className="w-7 h-7 text-yellow-400" />
            Intention Setter
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Set purposeful intentions for how you want to show up.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Set
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{intentions.length}</div>
          <div className="text-xs text-slate-500">Total Set</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">{todayCount}</div>
          <div className="text-xs text-slate-500">Today</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{completed}</div>
          <div className="text-xs text-slate-500">Honored</div>
        </div>
      </div>

      <div className="game-card p-3 space-y-1">
        <p className="text-xs text-slate-500 font-semibold">Inspiration</p>
        <p className="text-sm text-yellow-300 italic">
          "{EXAMPLE_INTENTIONS[new Date().getDay() % EXAMPLE_INTENTIONS.length]}"
        </p>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-yellow-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Set Intention</h3>
          <div className="flex gap-2">
            <select value={form.scope} onChange={e => setForm(f => ({ ...f, scope: e.target.value as IntentionScope }))} className="game-input text-sm flex-1">
              {(Object.entries(SCOPE_CONFIG) as [IntentionScope, typeof SCOPE_CONFIG.morning][]).map(([k, s]) => (
                <option key={k} value={k}>{s.emoji} {s.label}</option>
              ))}
            </select>
            <select value={form.pillar} onChange={e => setForm(f => ({ ...f, pillar: e.target.value as IntentionPillar }))} className="game-input text-sm flex-1">
              {(Object.entries(PILLAR_CONFIG) as [IntentionPillar, typeof PILLAR_CONFIG.health][]).map(([k, p]) => (
                <option key={k} value={k}>{p.label}</option>
              ))}
            </select>
          </div>
          <textarea value={form.intention} onChange={e => setForm(f => ({ ...f, intention: e.target.value }))}
            placeholder="I intend to... *" className="game-input w-full h-14 resize-none text-sm" autoFocus />
          <input value={form.whyItMatters} onChange={e => setForm(f => ({ ...f, whyItMatters: e.target.value }))}
            placeholder="Why does this intention matter?" className="game-input w-full text-sm" />
          <input value={form.howItFeels} onChange={e => setForm(f => ({ ...f, howItFeels: e.target.value }))}
            placeholder="How will it feel to honor this intention?" className="game-input w-full text-sm" />
          <input value={form.affirmation} onChange={e => setForm(f => ({ ...f, affirmation: e.target.value }))}
            placeholder="Supporting affirmation (optional)" className="game-input w-full text-sm" />
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-xl text-sm font-semibold">Set Intention</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {intentions.map(i => {
          const s = SCOPE_CONFIG[i.scope]
          const p = PILLAR_CONFIG[i.pillar]
          return (
            <div key={i.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${s.color}` }}>
              <span className="text-2xl">{s.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: p.color + '20', color: p.color }}>{p.label}</span>
                  <span className="text-xs text-slate-500">{s.label}</span>
                  {i.completed && <span className="text-xs text-green-400">✅ Honored</span>}
                </div>
                <p className="text-xs font-medium text-white mt-1">{i.intention}</p>
                {i.whyItMatters && <p className="text-xs text-slate-400 mt-0.5">Why: {i.whyItMatters}</p>}
                {i.affirmation && <p className="text-xs text-yellow-300/70 mt-0.5 italic">"{i.affirmation}"</p>}
              </div>
              <div className="flex flex-col gap-1 items-end">
                <label className="flex items-center gap-1 text-xs text-slate-500 cursor-pointer">
                  <input type="checkbox" checked={i.completed}
                    onChange={ev => save(intentions.map(x => x.id === i.id ? { ...x, completed: ev.target.checked } : x))} />
                  Done
                </label>
                <button onClick={() => save(intentions.filter(x => x.id !== i.id))} className="text-slate-700 hover:text-red-400">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )
        })}
        {intentions.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Target className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Intentions shape your reality. Set one now.</p>
          </div>
        )}
      </div>
    </div>
  )
}

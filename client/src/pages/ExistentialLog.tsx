import { useState, useEffect } from 'react'
import { Compass, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type ExistentialTheme = 'meaning' | 'mortality' | 'freedom' | 'identity' | 'connection' | 'suffering' | 'purpose' | 'truth' | 'impermanence' | 'consciousness'
type ClarityLevel = 'questioning' | 'exploring' | 'glimpsing' | 'anchored' | 'realized'

interface ExistentialLogEntry {
  id: string
  theme: ExistentialTheme
  clarity: ClarityLevel
  question: string
  currentUnderstanding: string
  whatShiftedMyView: string
  philosopherOrThinker: string
  lifeImplication: string
  howItChangesLiving: string
  peaceWithIt: number
  date: string
  createdAt: string
}

const THEME_CONFIG: Record<ExistentialTheme, { label: string; emoji: string; color: string }> = {
  meaning:       { label: 'Meaning',       emoji: '🌟', color: '#f59e0b' },
  mortality:     { label: 'Mortality',     emoji: '⏳', color: '#94a3b8' },
  freedom:       { label: 'Freedom',       emoji: '🦋', color: '#22c55e' },
  identity:      { label: 'Identity',      emoji: '🪞', color: '#6366f1' },
  connection:    { label: 'Connection',    emoji: '🔗', color: '#3b82f6' },
  suffering:     { label: 'Suffering',     emoji: '🌊', color: '#ef4444' },
  purpose:       { label: 'Purpose',       emoji: '🧭', color: '#f97316' },
  truth:         { label: 'Truth',         emoji: '💎', color: '#a855f7' },
  impermanence:  { label: 'Impermanence',  emoji: '🌸', color: '#ec4899' },
  consciousness: { label: 'Consciousness', emoji: '✨', color: '#10b981' },
}

const CLARITY_CONFIG: Record<ClarityLevel, { label: string; color: string }> = {
  questioning: { label: 'Questioning', color: '#94a3b8' },
  exploring:   { label: 'Exploring',   color: '#3b82f6' },
  glimpsing:   { label: 'Glimpsing',   color: '#6366f1' },
  anchored:    { label: 'Anchored',    color: '#f59e0b' },
  realized:    { label: 'Realized',    color: '#22c55e' },
}

const STORAGE_KEY = 'existential_log'

export default function ExistentialLog() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<ExistentialLogEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<ExistentialLogEntry, 'id' | 'createdAt'>>({
    theme: 'meaning', clarity: 'exploring', question: '',
    currentUnderstanding: '', whatShiftedMyView: '', philosopherOrThinker: '',
    lifeImplication: '', howItChangesLiving: '', peaceWithIt: 6,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: ExistentialLogEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.question.trim()) return
    const e: ExistentialLogEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, question: '', currentUnderstanding: '', whatShiftedMyView: '', philosopherOrThinker: '', lifeImplication: '', howItChangesLiving: '' }))
    setShowForm(false)
    toastSuccess('Existential reflection logged — the unexamined life is not worth living 🧭')
  }

  const realized = entries.filter(e => e.clarity === 'realized' || e.clarity === 'anchored').length
  const avgPeace = entries.length ? Math.round(entries.reduce((s, e) => s + e.peaceWithIt, 0) / entries.length) : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Compass className="w-7 h-7 text-emerald-400" />
            Existential Log
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Wrestle with the big questions that shape how you live.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Reflect
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Reflections</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-emerald-400">{realized}</div>
          <div className="text-xs text-slate-500">Anchored</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-teal-400">{avgPeace}/10</div>
          <div className="text-xs text-slate-500">Avg Peace</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-emerald-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Existential Reflection</h3>
          <div className="flex gap-2">
            <select value={form.theme} onChange={e => setForm(f => ({ ...f, theme: e.target.value as ExistentialTheme }))} className="game-input text-sm flex-1">
              {(Object.entries(THEME_CONFIG) as [ExistentialTheme, typeof THEME_CONFIG.meaning][]).map(([k, t]) => (
                <option key={k} value={k}>{t.emoji} {t.label}</option>
              ))}
            </select>
            <select value={form.clarity} onChange={e => setForm(f => ({ ...f, clarity: e.target.value as ClarityLevel }))} className="game-input text-sm flex-1">
              {(Object.entries(CLARITY_CONFIG) as [ClarityLevel, typeof CLARITY_CONFIG.exploring][]).map(([k, c]) => (
                <option key={k} value={k}>{c.label}</option>
              ))}
            </select>
          </div>
          <input value={form.question} onChange={e => setForm(f => ({ ...f, question: e.target.value }))}
            placeholder="The big question you're wrestling with *" className="game-input w-full text-sm" autoFocus />
          <textarea value={form.currentUnderstanding} onChange={e => setForm(f => ({ ...f, currentUnderstanding: e.target.value }))}
            placeholder="Your current understanding or answer" className="game-input w-full h-14 resize-none text-sm" />
          <input value={form.whatShiftedMyView} onChange={e => setForm(f => ({ ...f, whatShiftedMyView: e.target.value }))}
            placeholder="What shifted your perspective?" className="game-input w-full text-sm" />
          <input value={form.philosopherOrThinker} onChange={e => setForm(f => ({ ...f, philosopherOrThinker: e.target.value }))}
            placeholder="Philosopher/thinker who inspired this" className="game-input w-full text-sm" />
          <input value={form.lifeImplication} onChange={e => setForm(f => ({ ...f, lifeImplication: e.target.value }))}
            placeholder="What does this mean for your life?" className="game-input w-full text-sm" />
          <input value={form.howItChangesLiving} onChange={e => setForm(f => ({ ...f, howItChangesLiving: e.target.value }))}
            placeholder="How does this change how you live?" className="game-input w-full text-sm" />
          <div>
            <p className="text-xs text-slate-500 mb-1">Peace with this question: {form.peaceWithIt}/10</p>
            <input type="range" min={1} max={10} value={form.peaceWithIt}
              onChange={e => setForm(f => ({ ...f, peaceWithIt: Number(e.target.value) }))}
              className="w-full h-1 accent-emerald-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const t = THEME_CONFIG[e.theme]
          const c = CLARITY_CONFIG[e.clarity]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${t.color}` }}>
              <span className="text-2xl">{t.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-white">{t.label}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: c.color + '20', color: c.color }}>{c.label}</span>
                  <span className="text-xs text-emerald-400">☮️ {e.peaceWithIt}/10</span>
                </div>
                {e.question && <p className="text-xs text-slate-300 mt-1 line-clamp-1 italic">"{e.question}"</p>}
                {e.lifeImplication && <p className="text-xs text-yellow-300/70 mt-0.5">→ {e.lifeImplication}</p>}
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Compass className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">The courage to ask the hard questions is the beginning of wisdom.</p>
          </div>
        )}
      </div>
    </div>
  )
}

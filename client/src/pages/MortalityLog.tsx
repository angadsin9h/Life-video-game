import { useState, useEffect } from 'react'
import { Clock, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type ReflectionType = 'memento-mori' | 'near-miss' | 'loss' | 'legacy' | 'eulogy' | 'time-audit' | 'regret-minimizer' | 'death-bed'
type LifeImpact = 'urgent' | 'high' | 'medium' | 'low' | 'perspective'

interface MortalityEntry {
  id: string
  reflectionType: ReflectionType
  impact: LifeImpact
  reflection: string
  whatItRevealed: string
  whatToChangeNow: string
  whatReallyMatters: string
  lifePriority: string
  urgencyScore: number
  clarityGain: number
  date: string
  createdAt: string
}

const TYPE_CONFIG: Record<ReflectionType, { label: string; emoji: string; color: string }> = {
  'memento-mori':    { label: 'Memento Mori',      emoji: '💀', color: '#6366f1' },
  'near-miss':       { label: 'Near Miss',          emoji: '⚡', color: '#ef4444' },
  loss:              { label: 'Loss/Grief',         emoji: '🕯️', color: '#94a3b8' },
  legacy:            { label: 'Legacy Thinking',    emoji: '🏛️', color: '#f59e0b' },
  eulogy:            { label: 'Eulogy Exercise',    emoji: '📜', color: '#a855f7' },
  'time-audit':      { label: 'Time Remaining',     emoji: '⏳', color: '#f97316' },
  'regret-minimizer':{ label: 'Regret Minimizer',   emoji: '🪞', color: '#22c55e' },
  'death-bed':       { label: 'Death Bed View',     emoji: '🌅', color: '#ec4899' },
}

const IMPACT_CONFIG: Record<LifeImpact, { label: string; color: string }> = {
  urgent:      { label: 'Act Urgently',   color: '#ef4444' },
  high:        { label: 'High Priority',  color: '#f97316' },
  medium:      { label: 'Medium',         color: '#f59e0b' },
  low:         { label: 'Low',            color: '#94a3b8' },
  perspective: { label: 'Just Perspective',color: '#22c55e' },
}

const STORAGE_KEY = 'mortality_log'

export default function MortalityLog() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<MortalityEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<MortalityEntry, 'id' | 'createdAt'>>({
    reflectionType: 'memento-mori', impact: 'high', reflection: '',
    whatItRevealed: '', whatToChangeNow: '', whatReallyMatters: '', lifePriority: '',
    urgencyScore: 7, clarityGain: 8, date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: MortalityEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.reflection.trim()) return
    const e: MortalityEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, reflection: '', whatItRevealed: '', whatToChangeNow: '', whatReallyMatters: '', lifePriority: '' }))
    setShowForm(false)
    toastSuccess('Mortality reflection logged — death is life\'s greatest teacher 🌅')
  }

  const avgClarity = entries.length ? Math.round(entries.reduce((s, e) => s + e.clarityGain, 0) / entries.length) : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Clock className="w-7 h-7 text-slate-400" />
            Mortality Log
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Use awareness of death to clarify how to live.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Reflect
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Reflections</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-red-400">{entries.filter(e => e.impact === 'urgent').length}</div>
          <div className="text-xs text-slate-500">Urgent Changes</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-indigo-400">{avgClarity}/10</div>
          <div className="text-xs text-slate-500">Avg Clarity</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-slate-600/40 space-y-3">
          <h3 className="text-sm font-semibold text-white">Mortality Reflection</h3>
          <div className="flex gap-2">
            <select value={form.reflectionType} onChange={e => setForm(f => ({ ...f, reflectionType: e.target.value as ReflectionType }))} className="game-input text-sm flex-1">
              {(Object.entries(TYPE_CONFIG) as [ReflectionType, typeof TYPE_CONFIG['memento-mori']][]).map(([k, t]) => (
                <option key={k} value={k}>{t.emoji} {t.label}</option>
              ))}
            </select>
            <select value={form.impact} onChange={e => setForm(f => ({ ...f, impact: e.target.value as LifeImpact }))} className="game-input text-sm flex-1">
              {(Object.entries(IMPACT_CONFIG) as [LifeImpact, typeof IMPACT_CONFIG.high][]).map(([k, i]) => (
                <option key={k} value={k}>{i.label}</option>
              ))}
            </select>
          </div>
          <textarea value={form.reflection} onChange={e => setForm(f => ({ ...f, reflection: e.target.value }))}
            placeholder="The reflection or prompt that struck you *" className="game-input w-full h-14 resize-none text-sm" autoFocus />
          <input value={form.whatItRevealed} onChange={e => setForm(f => ({ ...f, whatItRevealed: e.target.value }))}
            placeholder="What did this reveal about your life?" className="game-input w-full text-sm" />
          <input value={form.whatReallyMatters} onChange={e => setForm(f => ({ ...f, whatReallyMatters: e.target.value }))}
            placeholder="What really matters, from this view?" className="game-input w-full text-sm" />
          <input value={form.whatToChangeNow} onChange={e => setForm(f => ({ ...f, whatToChangeNow: e.target.value }))}
            placeholder="What would you change starting today?" className="game-input w-full text-sm" />
          <input value={form.lifePriority} onChange={e => setForm(f => ({ ...f, lifePriority: e.target.value }))}
            placeholder="The life priority this unlocks" className="game-input w-full text-sm" />
          <div className="flex gap-3">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Urgency: {form.urgencyScore}/10</p>
              <input type="range" min={1} max={10} value={form.urgencyScore}
                onChange={e => setForm(f => ({ ...f, urgencyScore: Number(e.target.value) }))}
                className="w-full h-1 accent-red-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Clarity gain: {form.clarityGain}/10</p>
              <input type="range" min={1} max={10} value={form.clarityGain}
                onChange={e => setForm(f => ({ ...f, clarityGain: Number(e.target.value) }))}
                className="w-full h-1 accent-indigo-400" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm font-semibold">Log Reflection</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-800 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const t = TYPE_CONFIG[e.reflectionType]
          const i = IMPACT_CONFIG[e.impact]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${t.color}` }}>
              <span className="text-2xl">{t.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-slate-400">{t.label}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: i.color + '20', color: i.color }}>{i.label}</span>
                  <span className="text-xs text-indigo-400">💡 {e.clarityGain}/10</span>
                </div>
                <p className="text-xs font-medium text-white mt-1 line-clamp-2">{e.reflection}</p>
                {e.whatToChangeNow && <p className="text-xs text-green-300/70 mt-0.5">→ {e.whatToChangeNow}</p>}
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Clock className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Memento mori — remember you will die. Live accordingly.</p>
          </div>
        )}
      </div>
    </div>
  )
}

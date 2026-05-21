import { useState, useEffect } from 'react'
import { Trophy, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type MasteryDomain = 'mind' | 'body' | 'emotions' | 'spirit' | 'speech' | 'habits' | 'focus' | 'impulse' | 'ego' | 'time'
type MasteryLevel = 'unconscious' | 'aware' | 'practicing' | 'disciplined' | 'integrated' | 'mastered'

interface SelfMasteryEntry {
  id: string
  domain: MasteryDomain
  level: MasteryLevel
  whatYouMastered: string
  temptationOvercome: string
  disciplineUsed: string
  howLongItTook: string
  failuresOnTheWay: string
  keyTurningPoint: string
  howItExpandedYou: string
  masteryScore: number
  date: string
  createdAt: string
}

const DOMAIN_CONFIG: Record<MasteryDomain, { label: string; emoji: string; color: string }> = {
  mind:     { label: 'Mind',     emoji: '🧠', color: '#6366f1' },
  body:     { label: 'Body',     emoji: '💪', color: '#ef4444' },
  emotions: { label: 'Emotions', emoji: '❤️', color: '#ec4899' },
  spirit:   { label: 'Spirit',   emoji: '✨', color: '#a855f7' },
  speech:   { label: 'Speech',   emoji: '🗣️', color: '#3b82f6' },
  habits:   { label: 'Habits',   emoji: '🔄', color: '#22c55e' },
  focus:    { label: 'Focus',    emoji: '🎯', color: '#f59e0b' },
  impulse:  { label: 'Impulse',  emoji: '⚡', color: '#f97316' },
  ego:      { label: 'Ego',      emoji: '🪞', color: '#94a3b8' },
  time:     { label: 'Time',     emoji: '⏰', color: '#10b981' },
}

const LEVEL_CONFIG: Record<MasteryLevel, { label: string; color: string }> = {
  unconscious: { label: 'Unconscious', color: '#94a3b8' },
  aware:       { label: 'Aware',       color: '#6366f1' },
  practicing:  { label: 'Practicing',  color: '#3b82f6' },
  disciplined: { label: 'Disciplined', color: '#f59e0b' },
  integrated:  { label: 'Integrated',  color: '#22c55e' },
  mastered:    { label: 'Mastered',    color: '#a855f7' },
}

const STORAGE_KEY = 'self_mastery_log'

export default function SelfMasteryLog() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<SelfMasteryEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<SelfMasteryEntry, 'id' | 'createdAt'>>({
    domain: 'mind', level: 'practicing', whatYouMastered: '',
    temptationOvercome: '', disciplineUsed: '', howLongItTook: '',
    failuresOnTheWay: '', keyTurningPoint: '', howItExpandedYou: '', masteryScore: 7,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: SelfMasteryEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.whatYouMastered.trim()) return
    const e: SelfMasteryEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, whatYouMastered: '', temptationOvercome: '', disciplineUsed: '', howLongItTook: '', failuresOnTheWay: '', keyTurningPoint: '', howItExpandedYou: '' }))
    setShowForm(false)
    toastSuccess('Mastery logged — the one who masters themselves masters their world 🏆')
  }

  const mastered = entries.filter(e => e.level === 'mastered' || e.level === 'integrated').length
  const avgMastery = entries.length ? Math.round(entries.reduce((s, e) => s + e.masteryScore, 0) / entries.length) : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Trophy className="w-7 h-7 text-gold-400" style={{ color: '#fbbf24' }} />
            Self Mastery Log
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Document your journey of mastering every dimension of self.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Domains</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">{mastered}</div>
          <div className="text-xs text-slate-500">Integrated+</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-amber-400">{avgMastery}/10</div>
          <div className="text-xs text-slate-500">Avg Mastery</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-yellow-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Mastery Progress</h3>
          <div className="flex gap-2">
            <select value={form.domain} onChange={e => setForm(f => ({ ...f, domain: e.target.value as MasteryDomain }))} className="game-input text-sm flex-1">
              {(Object.entries(DOMAIN_CONFIG) as [MasteryDomain, typeof DOMAIN_CONFIG.mind][]).map(([k, d]) => (
                <option key={k} value={k}>{d.emoji} {d.label}</option>
              ))}
            </select>
            <select value={form.level} onChange={e => setForm(f => ({ ...f, level: e.target.value as MasteryLevel }))} className="game-input text-sm flex-1">
              {(Object.entries(LEVEL_CONFIG) as [MasteryLevel, typeof LEVEL_CONFIG.practicing][]).map(([k, l]) => (
                <option key={k} value={k}>{l.label}</option>
              ))}
            </select>
          </div>
          <input value={form.whatYouMastered} onChange={e => setForm(f => ({ ...f, whatYouMastered: e.target.value }))}
            placeholder="What are you mastering? *" className="game-input w-full text-sm" autoFocus />
          <input value={form.temptationOvercome} onChange={e => setForm(f => ({ ...f, temptationOvercome: e.target.value }))}
            placeholder="Temptation or weakness you overcame" className="game-input w-full text-sm" />
          <input value={form.disciplineUsed} onChange={e => setForm(f => ({ ...f, disciplineUsed: e.target.value }))}
            placeholder="Discipline or practice that built mastery" className="game-input w-full text-sm" />
          <input value={form.howLongItTook} onChange={e => setForm(f => ({ ...f, howLongItTook: e.target.value }))}
            placeholder="How long this has taken so far" className="game-input w-full text-sm" />
          <input value={form.failuresOnTheWay} onChange={e => setForm(f => ({ ...f, failuresOnTheWay: e.target.value }))}
            placeholder="Key failures or setbacks on the way" className="game-input w-full text-sm" />
          <input value={form.keyTurningPoint} onChange={e => setForm(f => ({ ...f, keyTurningPoint: e.target.value }))}
            placeholder="Key turning point in your mastery" className="game-input w-full text-sm" />
          <input value={form.howItExpandedYou} onChange={e => setForm(f => ({ ...f, howItExpandedYou: e.target.value }))}
            placeholder="How mastering this expanded your life" className="game-input w-full text-sm" />
          <div>
            <p className="text-xs text-slate-500 mb-1">Mastery level: {form.masteryScore}/10</p>
            <input type="range" min={1} max={10} value={form.masteryScore}
              onChange={e => setForm(f => ({ ...f, masteryScore: Number(e.target.value) }))}
              className="w-full h-1 accent-yellow-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const d = DOMAIN_CONFIG[e.domain]
          const l = LEVEL_CONFIG[e.level]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${d.color}` }}>
              <span className="text-2xl">{d.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-white">{d.label}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: l.color + '20', color: l.color }}>{l.label}</span>
                  <span className="text-xs text-yellow-400">🏆 {e.masteryScore}/10</span>
                </div>
                {e.whatYouMastered && <p className="text-xs text-slate-300 mt-1 line-clamp-1">{e.whatYouMastered}</p>}
                {e.howItExpandedYou && <p className="text-xs text-yellow-300/70 mt-0.5">↑ {e.howItExpandedYou}</p>}
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
            <p className="text-sm">Master yourself, and you can master anything.</p>
          </div>
        )}
      </div>
    </div>
  )
}

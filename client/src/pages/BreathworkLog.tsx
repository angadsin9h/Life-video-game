import { useState, useEffect } from 'react'
import { Wind, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type BreathTechnique = 'box' | '4-7-8' | 'wim-hof' | 'holotropic' | 'pranayama' | 'coherent' | 'fire' | 'alternate-nostril' | 'diaphragmatic' | 'other'
type BreathPurpose = 'calm' | 'energize' | 'focus' | 'sleep' | 'anxiety' | 'stress' | 'meditation' | 'performance' | 'other'

interface BreathSession {
  id: string
  technique: BreathTechnique
  purpose: BreathPurpose
  duration: number
  rounds: number
  moodBefore: number
  moodAfter: number
  notes: string
  date: string
  createdAt: string
}

const TECHNIQUE_CONFIG: Record<BreathTechnique, { label: string; emoji: string; color: string; pattern: string }> = {
  box:                { label: 'Box Breathing',     emoji: '⬜', color: '#3b82f6', pattern: '4-4-4-4' },
  '4-7-8':            { label: '4-7-8',             emoji: '🌙', color: '#6366f1', pattern: '4 in - 7 hold - 8 out' },
  'wim-hof':          { label: 'Wim Hof',           emoji: '❄️', color: '#0ea5e9', pattern: '30+ breaths + hold' },
  holotropic:         { label: 'Holotropic',        emoji: '🌀', color: '#a855f7', pattern: 'Accelerated circular' },
  pranayama:          { label: 'Pranayama',         emoji: '🕉️', color: '#f59e0b', pattern: 'Various yogic' },
  coherent:           { label: 'Coherent',          emoji: '💚', color: '#22c55e', pattern: '5 in - 5 out (6/min)' },
  fire:               { label: 'Breath of Fire',    emoji: '🔥', color: '#ef4444', pattern: 'Rapid through nose' },
  'alternate-nostril': { label: 'Alternate Nostril', emoji: '👃', color: '#84cc16', pattern: 'Nadi Shodhana' },
  diaphragmatic:      { label: 'Diaphragmatic',     emoji: '🫁', color: '#10b981', pattern: 'Belly breathing' },
  other:              { label: 'Other',             emoji: '💨', color: '#94a3b8', pattern: 'Custom' },
}

const PURPOSE_CONFIG: Record<BreathPurpose, { label: string; emoji: string }> = {
  calm:        { label: 'Calm',        emoji: '😌' },
  energize:    { label: 'Energize',    emoji: '⚡' },
  focus:       { label: 'Focus',       emoji: '🎯' },
  sleep:       { label: 'Sleep',       emoji: '😴' },
  anxiety:     { label: 'Anxiety',     emoji: '😰' },
  stress:      { label: 'Stress',      emoji: '😤' },
  meditation:  { label: 'Meditation',  emoji: '🧘' },
  performance: { label: 'Performance', emoji: '🚀' },
  other:       { label: 'Other',       emoji: '💭' },
}

const STORAGE_KEY = 'breathwork_log_v2'

export default function BreathworkLog() {
  const { toastSuccess } = useToast()
  const [sessions, setSessions] = useState<BreathSession[]>([])
  const [showForm, setShowForm] = useState(false)
  const [filterTech, setFilterTech] = useState<string>('all')
  const [form, setForm] = useState<Omit<BreathSession, 'id' | 'createdAt'>>({
    technique: 'box', purpose: 'calm', duration: 10, rounds: 4,
    moodBefore: 5, moodAfter: 7, notes: '', date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setSessions(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: BreathSession[]) => { setSessions(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    const s: BreathSession = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([s, ...sessions])
    setForm(f => ({ ...f, notes: '', rounds: 4 }))
    setShowForm(false)
    toastSuccess('Breath session logged 💨')
  }

  const filtered = sessions.filter(s => filterTech === 'all' || s.technique === filterTech)
  const totalMinutes = sessions.reduce((s, b) => s + b.duration, 0)
  const avgMoodLift = sessions.length > 0
    ? Math.round(sessions.reduce((s, b) => s + (b.moodAfter - b.moodBefore), 0) / sessions.length * 10) / 10
    : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Wind className="w-7 h-7 text-sky-400" />
            Breathwork Log
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track your breathing practice and its effects.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-sky-700 hover:bg-sky-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{sessions.length}</div>
          <div className="text-xs text-slate-500">Sessions</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-sky-400">{totalMinutes}min</div>
          <div className="text-xs text-slate-500">Total Practice</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{avgMoodLift > 0 ? '+' : ''}{avgMoodLift}</div>
          <div className="text-xs text-slate-500">Avg Mood Lift</div>
        </div>
      </div>

      <div className="game-card p-3">
        <p className="text-xs text-slate-500 mb-2">Techniques:</p>
        <div className="grid grid-cols-2 gap-1.5">
          {(Object.entries(TECHNIQUE_CONFIG) as [BreathTechnique, typeof TECHNIQUE_CONFIG.box][]).map(([k, t]) => (
            <div key={k} className="flex items-center gap-2 text-xs p-1.5 bg-slate-800/50 rounded-lg">
              <span>{t.emoji}</span>
              <div>
                <p className="text-slate-300">{t.label}</p>
                <p className="text-slate-600">{t.pattern}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilterTech('all')}
          className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterTech === 'all' ? 'bg-sky-600/20 text-sky-400 border border-sky-500/30' : 'bg-slate-800 text-slate-500'}`}>
          All
        </button>
        {(Object.entries(TECHNIQUE_CONFIG) as [BreathTechnique, typeof TECHNIQUE_CONFIG.box][]).map(([k, t]) => (
          <button key={k} onClick={() => setFilterTech(k)}
            className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterTech === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
            style={filterTech === k ? { background: t.color + '30', color: t.color } : {}}>
            {t.emoji}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-sky-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Breath Session</h3>
          <div className="flex gap-2">
            <select value={form.technique} onChange={e => setForm(f => ({ ...f, technique: e.target.value as BreathTechnique }))} className="game-input text-sm flex-1">
              {(Object.entries(TECHNIQUE_CONFIG) as [BreathTechnique, typeof TECHNIQUE_CONFIG.box][]).map(([k, t]) => (
                <option key={k} value={k}>{t.emoji} {t.label}</option>
              ))}
            </select>
            <select value={form.purpose} onChange={e => setForm(f => ({ ...f, purpose: e.target.value as BreathPurpose }))} className="game-input text-sm flex-1">
              {(Object.entries(PURPOSE_CONFIG) as [BreathPurpose, typeof PURPOSE_CONFIG.calm][]).map(([k, p]) => (
                <option key={k} value={k}>{p.emoji} {p.label}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Duration (min)</p>
              <input type="number" value={form.duration} min={1}
                onChange={e => setForm(f => ({ ...f, duration: Number(e.target.value) }))}
                className="game-input w-full text-sm" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Rounds / cycles</p>
              <input type="number" value={form.rounds} min={1}
                onChange={e => setForm(f => ({ ...f, rounds: Number(e.target.value) }))}
                className="game-input w-full text-sm" />
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Mood before: {form.moodBefore}/10</p>
              <input type="range" min={1} max={10} value={form.moodBefore}
                onChange={e => setForm(f => ({ ...f, moodBefore: Number(e.target.value) }))}
                className="w-full h-1 accent-red-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Mood after: {form.moodAfter}/10</p>
              <input type="range" min={1} max={10} value={form.moodAfter}
                onChange={e => setForm(f => ({ ...f, moodAfter: Number(e.target.value) }))}
                className="w-full h-1 accent-green-400" />
            </div>
          </div>
          <div className="flex gap-2">
            <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Notes / observations" className="game-input flex-1 text-sm" />
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="game-input text-sm" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-sky-700 hover:bg-sky-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(s => {
          const t = TECHNIQUE_CONFIG[s.technique]
          const p = PURPOSE_CONFIG[s.purpose]
          const lift = s.moodAfter - s.moodBefore
          return (
            <div key={s.id} className="game-card p-3 flex items-center gap-3" style={{ borderLeft: `3px solid ${t.color}` }}>
              <span className="text-2xl">{t.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">{t.label}</span>
                  <span className="text-xs text-slate-500">{p.emoji} {p.label}</span>
                  <span className={`text-xs ml-auto ${lift > 0 ? 'text-green-400' : lift < 0 ? 'text-red-400' : 'text-slate-500'}`}>
                    mood {lift > 0 ? '+' : ''}{lift}
                  </span>
                </div>
                <p className="text-xs text-slate-500">{s.duration}min · {s.rounds} rounds · {s.date}</p>
              </div>
              <button onClick={() => save(sessions.filter(x => x.id !== s.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {filtered.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Wind className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">The breath is always with you. Start using it intentionally.</p>
          </div>
        )}
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { RefreshCw, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type RhythmType = 'morning' | 'midday' | 'evening' | 'weekly' | 'monthly' | 'seasonal' | 'yearly' | 'sleep-wake' | 'work-rest' | 'social-solitude'
type RhythmAlignment = 'chaotic' | 'inconsistent' | 'emerging' | 'flowing' | 'harmonious'

interface LifeRhythmEntry {
  id: string
  rhythm: RhythmType
  alignment: RhythmAlignment
  currentPattern: string
  idealPattern: string
  whatDisruptsIt: string
  whatSustainsIt: string
  howItFeels: string
  adjustmentMade: string
  nextRhythmicStep: string
  flowScore: number
  date: string
  createdAt: string
}

const RHYTHM_CONFIG: Record<RhythmType, { label: string; emoji: string; color: string }> = {
  morning:         { label: 'Morning',        emoji: '🌅', color: '#f59e0b' },
  midday:          { label: 'Midday',         emoji: '☀️', color: '#eab308' },
  evening:         { label: 'Evening',        emoji: '🌆', color: '#f97316' },
  weekly:          { label: 'Weekly',         emoji: '📅', color: '#3b82f6' },
  monthly:         { label: 'Monthly',        emoji: '🗓️', color: '#6366f1' },
  seasonal:        { label: 'Seasonal',       emoji: '🍂', color: '#22c55e' },
  yearly:          { label: 'Yearly',         emoji: '🔄', color: '#a855f7' },
  'sleep-wake':    { label: 'Sleep-Wake',     emoji: '💤', color: '#94a3b8' },
  'work-rest':     { label: 'Work-Rest',      emoji: '⚖️', color: '#10b981' },
  'social-solitude':{ label: 'Social-Solitude', emoji: '🌊', color: '#ec4899' },
}

const ALIGNMENT_CONFIG: Record<RhythmAlignment, { label: string; color: string }> = {
  chaotic:     { label: 'Chaotic',     color: '#ef4444' },
  inconsistent:{ label: 'Inconsistent', color: '#f97316' },
  emerging:    { label: 'Emerging',    color: '#f59e0b' },
  flowing:     { label: 'Flowing',     color: '#3b82f6' },
  harmonious:  { label: 'Harmonious',  color: '#22c55e' },
}

const STORAGE_KEY = 'life_rhythm_log'

export default function LifeRhythm() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<LifeRhythmEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<LifeRhythmEntry, 'id' | 'createdAt'>>({
    rhythm: 'morning', alignment: 'flowing', currentPattern: '',
    idealPattern: '', whatDisruptsIt: '', whatSustainsIt: '',
    howItFeels: '', adjustmentMade: '', nextRhythmicStep: '', flowScore: 7,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: LifeRhythmEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.currentPattern.trim()) return
    const e: LifeRhythmEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, currentPattern: '', idealPattern: '', whatDisruptsIt: '', whatSustainsIt: '', howItFeels: '', adjustmentMade: '', nextRhythmicStep: '' }))
    setShowForm(false)
    toastSuccess('Life rhythm logged — life flows best when lived in sync with your natural rhythms 🔄')
  }

  const harmonious = entries.filter(e => e.alignment === 'harmonious' || e.alignment === 'flowing').length
  const avgFlow = entries.length ? Math.round(entries.reduce((s, e) => s + e.flowScore, 0) / entries.length) : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <RefreshCw className="w-7 h-7 text-cyan-400" />
            Life Rhythm
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Align your life with natural rhythms for energy and flow.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-cyan-700 hover:bg-cyan-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Rhythms</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-cyan-400">{harmonious}</div>
          <div className="text-xs text-slate-500">Flowing+</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-teal-400">{avgFlow}/10</div>
          <div className="text-xs text-slate-500">Avg Flow</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-cyan-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Life Rhythm</h3>
          <div className="flex gap-2">
            <select value={form.rhythm} onChange={e => setForm(f => ({ ...f, rhythm: e.target.value as RhythmType }))} className="game-input text-sm flex-1">
              {(Object.entries(RHYTHM_CONFIG) as [RhythmType, typeof RHYTHM_CONFIG.morning][]).map(([k, r]) => (
                <option key={k} value={k}>{r.emoji} {r.label}</option>
              ))}
            </select>
            <select value={form.alignment} onChange={e => setForm(f => ({ ...f, alignment: e.target.value as RhythmAlignment }))} className="game-input text-sm flex-1">
              {(Object.entries(ALIGNMENT_CONFIG) as [RhythmAlignment, typeof ALIGNMENT_CONFIG.flowing][]).map(([k, a]) => (
                <option key={k} value={k}>{a.label}</option>
              ))}
            </select>
          </div>
          <input value={form.currentPattern} onChange={e => setForm(f => ({ ...f, currentPattern: e.target.value }))}
            placeholder="Your current pattern for this rhythm *" className="game-input w-full text-sm" autoFocus />
          <input value={form.idealPattern} onChange={e => setForm(f => ({ ...f, idealPattern: e.target.value }))}
            placeholder="Your ideal pattern for this rhythm" className="game-input w-full text-sm" />
          <input value={form.whatDisruptsIt} onChange={e => setForm(f => ({ ...f, whatDisruptsIt: e.target.value }))}
            placeholder="What most disrupts this rhythm" className="game-input w-full text-sm" />
          <input value={form.whatSustainsIt} onChange={e => setForm(f => ({ ...f, whatSustainsIt: e.target.value }))}
            placeholder="What sustains this rhythm" className="game-input w-full text-sm" />
          <input value={form.howItFeels} onChange={e => setForm(f => ({ ...f, howItFeels: e.target.value }))}
            placeholder="How this rhythm feels in your body" className="game-input w-full text-sm" />
          <input value={form.adjustmentMade} onChange={e => setForm(f => ({ ...f, adjustmentMade: e.target.value }))}
            placeholder="Adjustment you made to improve alignment" className="game-input w-full text-sm" />
          <input value={form.nextRhythmicStep} onChange={e => setForm(f => ({ ...f, nextRhythmicStep: e.target.value }))}
            placeholder="Next step toward rhythmic harmony" className="game-input w-full text-sm" />
          <div>
            <p className="text-xs text-slate-500 mb-1">Flow alignment: {form.flowScore}/10</p>
            <input type="range" min={1} max={10} value={form.flowScore}
              onChange={e => setForm(f => ({ ...f, flowScore: Number(e.target.value) }))}
              className="w-full h-1 accent-cyan-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-cyan-700 hover:bg-cyan-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const r = RHYTHM_CONFIG[e.rhythm]
          const a = ALIGNMENT_CONFIG[e.alignment]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${r.color}` }}>
              <span className="text-2xl">{r.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-white">{r.label}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: a.color + '20', color: a.color }}>{a.label}</span>
                  <span className="text-xs text-cyan-400">🌊 {e.flowScore}/10</span>
                </div>
                {e.currentPattern && <p className="text-xs text-slate-300 mt-1 line-clamp-1">{e.currentPattern}</p>}
                {e.nextRhythmicStep && <p className="text-xs text-teal-300/70 mt-0.5 line-clamp-1">→ {e.nextRhythmicStep}</p>}
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <RefreshCw className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Nature operates in rhythms. When you align with yours, life becomes effortless.</p>
          </div>
        )}
      </div>
    </div>
  )
}

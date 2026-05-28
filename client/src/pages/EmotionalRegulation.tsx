import { useState, useEffect } from 'react'
import { Heart, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type EmotionTrigger = 'stress' | 'conflict' | 'uncertainty' | 'failure' | 'loneliness' | 'comparison' | 'overwhelm' | 'rejection' | 'change' | 'loss'
type RegulationStrategy = 'breathing' | 'movement' | 'journaling' | 'reframe' | 'connection' | 'grounding' | 'distancing' | 'acceptance'
type RegulationResult = 'transformed' | 'calmed' | 'managed' | 'partial' | 'struggled'

interface RegulationEntry {
  id: string
  trigger: EmotionTrigger
  strategy: RegulationStrategy
  result: RegulationResult
  emotion: string
  intensity: number
  whatHappened: string
  howIRegulated: string
  whatHelped: string
  lesson: string
  intensityAfter: number
  date: string
  createdAt: string
}

const TRIGGER_CONFIG: Record<EmotionTrigger, { label: string; emoji: string; color: string }> = {
  stress:      { label: 'Stress',       emoji: '😤', color: '#ef4444' },
  conflict:    { label: 'Conflict',     emoji: '⚡', color: '#f97316' },
  uncertainty: { label: 'Uncertainty',  emoji: '🌫️', color: '#94a3b8' },
  failure:     { label: 'Failure',      emoji: '❌', color: '#f59e0b' },
  loneliness:  { label: 'Loneliness',   emoji: '😔', color: '#6366f1' },
  comparison:  { label: 'Comparison',   emoji: '👀', color: '#a855f7' },
  overwhelm:   { label: 'Overwhelm',    emoji: '😵', color: '#ec4899' },
  rejection:   { label: 'Rejection',    emoji: '💔', color: '#ef4444' },
  change:      { label: 'Change',       emoji: '🌀', color: '#3b82f6' },
  loss:        { label: 'Loss',         emoji: '😢', color: '#84cc16' },
}

const STRATEGY_CONFIG: Record<RegulationStrategy, { label: string; emoji: string }> = {
  breathing:  { label: 'Breathing',   emoji: '🌬️' },
  movement:   { label: 'Movement',    emoji: '🏃' },
  journaling: { label: 'Journaling',  emoji: '📝' },
  reframe:    { label: 'Reframe',     emoji: '🔄' },
  connection: { label: 'Connection',  emoji: '🤗' },
  grounding:  { label: 'Grounding',   emoji: '🌿' },
  distancing: { label: 'Distancing',  emoji: '🔭' },
  acceptance: { label: 'Acceptance',  emoji: '🙏' },
}

const RESULT_CONFIG: Record<RegulationResult, { label: string; color: string }> = {
  transformed: { label: 'Transformed',  color: '#a855f7' },
  calmed:      { label: 'Calmed',       color: '#22c55e' },
  managed:     { label: 'Managed',      color: '#3b82f6' },
  partial:     { label: 'Partial',      color: '#f59e0b' },
  struggled:   { label: 'Struggled',    color: '#ef4444' },
}

const STORAGE_KEY = 'emotional_regulation_log'

export default function EmotionalRegulation() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<RegulationEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<RegulationEntry, 'id' | 'createdAt'>>({
    trigger: 'stress', strategy: 'breathing', result: 'calmed', emotion: '',
    intensity: 7, whatHappened: '', howIRegulated: '', whatHelped: '', lesson: '',
    intensityAfter: 3, date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: RegulationEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.emotion.trim()) return
    const e: RegulationEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, emotion: '', whatHappened: '', howIRegulated: '', whatHelped: '', lesson: '' }))
    setShowForm(false)
    toastSuccess('Regulation session logged — emotional mastery grows 💙')
  }

  const avgDrop = entries.length ? Math.round(entries.reduce((s, e) => s + (e.intensity - e.intensityAfter), 0) / entries.length) : 0
  const transformed = entries.filter(e => e.result === 'transformed').length

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Heart className="w-7 h-7 text-rose-400" />
            Emotional Regulation
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track and master your emotional regulation practice.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-rose-700 hover:bg-rose-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Sessions</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-rose-400">-{avgDrop}</div>
          <div className="text-xs text-slate-500">Avg Reduction</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-purple-400">{transformed}</div>
          <div className="text-xs text-slate-500">Transformed</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-rose-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Regulation Session</h3>
          <input value={form.emotion} onChange={e => setForm(f => ({ ...f, emotion: e.target.value }))}
            placeholder="Name the emotion you felt *" className="game-input w-full text-sm" autoFocus />
          <div className="flex gap-2">
            <select value={form.trigger} onChange={e => setForm(f => ({ ...f, trigger: e.target.value as EmotionTrigger }))} className="game-input text-sm flex-1">
              {(Object.entries(TRIGGER_CONFIG) as [EmotionTrigger, typeof TRIGGER_CONFIG.stress][]).map(([k, t]) => (
                <option key={k} value={k}>{t.emoji} {t.label}</option>
              ))}
            </select>
            <select value={form.strategy} onChange={e => setForm(f => ({ ...f, strategy: e.target.value as RegulationStrategy }))} className="game-input text-sm flex-1">
              {(Object.entries(STRATEGY_CONFIG) as [RegulationStrategy, typeof STRATEGY_CONFIG.breathing][]).map(([k, s]) => (
                <option key={k} value={k}>{s.emoji} {s.label}</option>
              ))}
            </select>
          </div>
          <select value={form.result} onChange={e => setForm(f => ({ ...f, result: e.target.value as RegulationResult }))} className="game-input w-full text-sm">
            {(Object.entries(RESULT_CONFIG) as [RegulationResult, typeof RESULT_CONFIG.calmed][]).map(([k, r]) => (
              <option key={k} value={k}>{r.label}</option>
            ))}
          </select>
          <input value={form.whatHappened} onChange={e => setForm(f => ({ ...f, whatHappened: e.target.value }))}
            placeholder="What triggered this emotional state?" className="game-input w-full text-sm" />
          <input value={form.howIRegulated} onChange={e => setForm(f => ({ ...f, howIRegulated: e.target.value }))}
            placeholder="How did you regulate / what did you do?" className="game-input w-full text-sm" />
          <input value={form.whatHelped} onChange={e => setForm(f => ({ ...f, whatHelped: e.target.value }))}
            placeholder="What helped most?" className="game-input w-full text-sm" />
          <input value={form.lesson} onChange={e => setForm(f => ({ ...f, lesson: e.target.value }))}
            placeholder="Key lesson from this experience" className="game-input w-full text-sm" />
          <div className="flex gap-3">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Intensity before: {form.intensity}/10</p>
              <input type="range" min={1} max={10} value={form.intensity}
                onChange={e => setForm(f => ({ ...f, intensity: Number(e.target.value) }))}
                className="w-full h-1 accent-red-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Intensity after: {form.intensityAfter}/10</p>
              <input type="range" min={0} max={10} value={form.intensityAfter}
                onChange={e => setForm(f => ({ ...f, intensityAfter: Number(e.target.value) }))}
                className="w-full h-1 accent-green-400" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-rose-700 hover:bg-rose-600 text-white rounded-xl text-sm font-semibold">Log Session</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const t = TRIGGER_CONFIG[e.trigger]
          const s = STRATEGY_CONFIG[e.strategy]
          const r = RESULT_CONFIG[e.result]
          const drop = e.intensity - e.intensityAfter
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${t.color}` }}>
              <span className="text-2xl">{t.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-white">{e.emotion}</span>
                  <span className="text-xs">{s.emoji} {s.label}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: r.color + '20', color: r.color }}>{r.label}</span>
                  {drop > 0 && <span className="text-xs text-green-400">↓{drop}</span>}
                </div>
                {e.whatHelped && <p className="text-xs text-slate-400 mt-1 line-clamp-1">Helped: {e.whatHelped}</p>}
                {e.lesson && <p className="text-xs text-blue-300/70 mt-0.5">💡 {e.lesson}</p>}
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Heart className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Emotional mastery is the foundation of everything. Practice it.</p>
          </div>
        )}
      </div>
    </div>
  )
}

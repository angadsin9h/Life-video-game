import { useState, useEffect } from 'react'
import { Brain, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type TrainingType = 'memory' | 'focus' | 'creativity' | 'problem-solving' | 'language' | 'pattern-recognition' | 'emotional-regulation' | 'meditation' | 'physical-exercise' | 'learning-new-skill'
type BrainState = 'foggy' | 'average' | 'clear' | 'sharp' | 'peak'

interface NeuroplasticityEntry {
  id: string
  training: TrainingType
  brainState: BrainState
  activityDone: string
  durationMins: number
  difficultyLevel: number
  breakthroughMoment: string
  cognitiveShift: string
  whatYouNoticed: string
  habitToReinforce: string
  sharpnessScore: number
  date: string
  createdAt: string
}

const TRAINING_CONFIG: Record<TrainingType, { label: string; emoji: string; color: string }> = {
  memory:               { label: 'Memory',            emoji: '🧠', color: '#6366f1' },
  focus:                { label: 'Focus Training',     emoji: '🎯', color: '#3b82f6' },
  creativity:           { label: 'Creativity',         emoji: '🎨', color: '#f59e0b' },
  'problem-solving':    { label: 'Problem Solving',    emoji: '🔧', color: '#f97316' },
  language:             { label: 'Language',           emoji: '🗣️', color: '#22c55e' },
  'pattern-recognition':{ label: 'Pattern Recognition', emoji: '🔍', color: '#a855f7' },
  'emotional-regulation':{ label: 'Emotional Reg.',   emoji: '❤️', color: '#ec4899' },
  meditation:           { label: 'Meditation',         emoji: '🧘', color: '#10b981' },
  'physical-exercise':  { label: 'Physical Exercise',  emoji: '💪', color: '#ef4444' },
  'learning-new-skill': { label: 'New Skill',          emoji: '🌱', color: '#eab308' },
}

const BRAIN_STATE_CONFIG: Record<BrainState, { label: string; color: string }> = {
  foggy:   { label: 'Foggy',   color: '#94a3b8' },
  average: { label: 'Average', color: '#f59e0b' },
  clear:   { label: 'Clear',   color: '#3b82f6' },
  sharp:   { label: 'Sharp',   color: '#22c55e' },
  peak:    { label: 'Peak',    color: '#a855f7' },
}

const STORAGE_KEY = 'neuroplasticity_log'

export default function NeuroplasticityLog() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<NeuroplasticityEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<NeuroplasticityEntry, 'id' | 'createdAt'>>({
    training: 'focus', brainState: 'clear', activityDone: '',
    durationMins: 20, difficultyLevel: 5, breakthroughMoment: '',
    cognitiveShift: '', whatYouNoticed: '', habitToReinforce: '', sharpnessScore: 7,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: NeuroplasticityEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.activityDone.trim()) return
    const e: NeuroplasticityEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, activityDone: '', breakthroughMoment: '', cognitiveShift: '', whatYouNoticed: '', habitToReinforce: '' }))
    setShowForm(false)
    toastSuccess('Brain training logged — every challenge grows new neural pathways 🧠')
  }

  const peakSharp = entries.filter(e => e.brainState === 'peak' || e.brainState === 'sharp').length
  const avgSharpness = entries.length ? Math.round(entries.reduce((s, e) => s + e.sharpnessScore, 0) / entries.length) : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Brain className="w-7 h-7 text-purple-400" />
            Neuroplasticity Log
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Train your brain and track cognitive growth over time.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Train
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Sessions</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-purple-400">{peakSharp}</div>
          <div className="text-xs text-slate-500">Sharp+</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-indigo-400">{avgSharpness}/10</div>
          <div className="text-xs text-slate-500">Avg Sharpness</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-purple-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Brain Training</h3>
          <div className="flex gap-2">
            <select value={form.training} onChange={e => setForm(f => ({ ...f, training: e.target.value as TrainingType }))} className="game-input text-sm flex-1">
              {(Object.entries(TRAINING_CONFIG) as [TrainingType, typeof TRAINING_CONFIG.focus][]).map(([k, t]) => (
                <option key={k} value={k}>{t.emoji} {t.label}</option>
              ))}
            </select>
            <select value={form.brainState} onChange={e => setForm(f => ({ ...f, brainState: e.target.value as BrainState }))} className="game-input text-sm flex-1">
              {(Object.entries(BRAIN_STATE_CONFIG) as [BrainState, typeof BRAIN_STATE_CONFIG.clear][]).map(([k, b]) => (
                <option key={k} value={k}>{b.label}</option>
              ))}
            </select>
          </div>
          <input value={form.activityDone} onChange={e => setForm(f => ({ ...f, activityDone: e.target.value }))}
            placeholder="What brain training activity did you do? *" className="game-input w-full text-sm" autoFocus />
          <div className="flex gap-2">
            <input type="number" min={1} value={form.durationMins} onChange={e => setForm(f => ({ ...f, durationMins: Number(e.target.value) }))}
              className="game-input text-sm flex-1" placeholder="Duration (min)" />
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Difficulty: {form.difficultyLevel}/10</p>
              <input type="range" min={1} max={10} value={form.difficultyLevel}
                onChange={e => setForm(f => ({ ...f, difficultyLevel: Number(e.target.value) }))}
                className="w-full h-1 accent-purple-400" />
            </div>
          </div>
          <input value={form.breakthroughMoment} onChange={e => setForm(f => ({ ...f, breakthroughMoment: e.target.value }))}
            placeholder="Breakthrough or insight during training" className="game-input w-full text-sm" />
          <input value={form.cognitiveShift} onChange={e => setForm(f => ({ ...f, cognitiveShift: e.target.value }))}
            placeholder="Cognitive shift you noticed" className="game-input w-full text-sm" />
          <input value={form.whatYouNoticed} onChange={e => setForm(f => ({ ...f, whatYouNoticed: e.target.value }))}
            placeholder="What you noticed about your thinking" className="game-input w-full text-sm" />
          <input value={form.habitToReinforce} onChange={e => setForm(f => ({ ...f, habitToReinforce: e.target.value }))}
            placeholder="Neural habit to reinforce going forward" className="game-input w-full text-sm" />
          <div>
            <p className="text-xs text-slate-500 mb-1">Mental sharpness after: {form.sharpnessScore}/10</p>
            <input type="range" min={1} max={10} value={form.sharpnessScore}
              onChange={e => setForm(f => ({ ...f, sharpnessScore: Number(e.target.value) }))}
              className="w-full h-1 accent-purple-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const t = TRAINING_CONFIG[e.training]
          const b = BRAIN_STATE_CONFIG[e.brainState]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${t.color}` }}>
              <span className="text-2xl">{t.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-white">{t.label}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: b.color + '20', color: b.color }}>{b.label}</span>
                  <span className="text-xs text-slate-400">{e.durationMins}m</span>
                  <span className="text-xs text-purple-400">🧠 {e.sharpnessScore}/10</span>
                </div>
                {e.activityDone && <p className="text-xs text-slate-300 mt-1 line-clamp-1">{e.activityDone}</p>}
                {e.cognitiveShift && <p className="text-xs text-indigo-300/70 mt-0.5 line-clamp-1">💡 {e.cognitiveShift}</p>}
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Brain className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">The brain is not fixed. Every challenge you embrace rewires it for the better.</p>
          </div>
        )}
      </div>
    </div>
  )
}

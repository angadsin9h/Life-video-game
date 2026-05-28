import { useEffect, useState } from 'react'
import { Flame, Plus, Check, Clock, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface RitualStep {
  id: string
  text: string
  duration: number
  done: boolean
}

interface Ritual {
  id: string
  name: string
  type: 'pre-work' | 'post-work' | 'morning' | 'evening' | 'custom'
  steps: RitualStep[]
  totalDuration: number
  timesCompleted: number
  lastCompleted: string
  streak: number
  color: string
}

const RITUAL_TYPES = [
  { value: 'pre-work', label: 'Pre-Work', emoji: '⚡', color: '#f97316' },
  { value: 'morning', label: 'Morning', emoji: '🌅', color: '#eab308' },
  { value: 'post-work', label: 'Post-Work', emoji: '🌙', color: '#8b5cf6' },
  { value: 'evening', label: 'Evening', emoji: '🌙', color: '#3b82f6' },
  { value: 'custom', label: 'Custom', emoji: '✨', color: '#22c55e' },
]

const PRESET_RITUALS = [
  {
    name: 'Deep Work Entry',
    type: 'pre-work' as const,
    color: '#f97316',
    steps: [
      { text: 'Clear desk and close all tabs', duration: 2 },
      { text: 'Write the ONE thing to accomplish', duration: 2 },
      { text: 'Put phone in another room / on DND', duration: 1 },
      { text: 'Start focus music or silence', duration: 1 },
      { text: 'Take 3 deep breaths', duration: 1 },
    ],
  },
  {
    name: 'Morning Power Ritual',
    type: 'morning' as const,
    color: '#eab308',
    steps: [
      { text: 'No phone for first 30 minutes', duration: 30 },
      { text: 'Drink a glass of water', duration: 2 },
      { text: 'Morning movement (stretches/walk)', duration: 10 },
      { text: 'Journal or set daily intention', duration: 5 },
      { text: 'Review your top 3 priorities', duration: 3 },
    ],
  },
  {
    name: 'Work Shutdown Ritual',
    type: 'post-work' as const,
    color: '#8b5cf6',
    steps: [
      { text: 'Review what you accomplished today', duration: 3 },
      { text: 'Clear task list for tomorrow', duration: 5 },
      { text: 'Close all work apps and tabs', duration: 2 },
      { text: 'Write 3 things that went well', duration: 3 },
      { text: 'Say "shutdown complete" out loud', duration: 1 },
    ],
  },
]

const STORAGE_KEY = 'focus_rituals'

export default function FocusRituals() {
  const { toastSuccess } = useToast()
  const [rituals, setRituals] = useState<Ritual[]>([])
  const [showForm, setShowForm] = useState(false)
  const [showPresets, setShowPresets] = useState(false)
  const [running, setRunning] = useState<string | null>(null)
  const [formName, setFormName] = useState('')
  const [formType, setFormType] = useState<Ritual['type']>('pre-work')
  const [formSteps, setFormSteps] = useState<{ text: string; duration: string }[]>([{ text: '', duration: '5' }])
  const [expanded, setExpanded] = useState<string | null>(null)

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) setRituals(JSON.parse(saved))
  }, [])

  const persist = (updated: Ritual[]) => {
    setRituals(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const addRitual = () => {
    if (!formName.trim() || formSteps.every(s => !s.text.trim())) return
    const t = RITUAL_TYPES.find(rt => rt.value === formType)
    const steps = formSteps.filter(s => s.text.trim()).map((s, i) => ({
      id: `${Date.now()}_${i}`,
      text: s.text,
      duration: parseInt(s.duration) || 5,
      done: false,
    }))
    const r: Ritual = {
      id: Date.now().toString(),
      name: formName,
      type: formType,
      steps,
      totalDuration: steps.reduce((s, step) => s + step.duration, 0),
      timesCompleted: 0,
      lastCompleted: '',
      streak: 0,
      color: t?.color || '#22c55e',
    }
    persist([...rituals, r])
    setFormName('')
    setFormSteps([{ text: '', duration: '5' }])
    setShowForm(false)
    toastSuccess('Ritual created!')
  }

  const addPreset = (preset: typeof PRESET_RITUALS[0]) => {
    const steps = preset.steps.map((s, i) => ({ id: `${Date.now()}_${i}`, text: s.text, duration: s.duration, done: false }))
    const r: Ritual = {
      id: Date.now().toString(),
      name: preset.name,
      type: preset.type,
      steps,
      totalDuration: steps.reduce((s, step) => s + step.duration, 0),
      timesCompleted: 0,
      lastCompleted: '',
      streak: 0,
      color: preset.color,
    }
    persist([...rituals, r])
    setShowPresets(false)
    toastSuccess(`Ritual added: ${preset.name}!`)
  }

  const toggleStep = (ritualId: string, stepId: string) => {
    const updated = rituals.map(r => {
      if (r.id !== ritualId) return r
      const steps = r.steps.map(s => s.id === stepId ? { ...s, done: !s.done } : s)
      return { ...r, steps }
    })
    persist(updated)
  }

  const completeRitual = (id: string) => {
    const updated = rituals.map(r => {
      if (r.id !== id) return r
      const wasYesterday = r.lastCompleted === new Date(Date.now() - 86400000).toISOString().split('T')[0]
      const steps = r.steps.map(s => ({ ...s, done: false }))
      return {
        ...r,
        steps,
        timesCompleted: r.timesCompleted + 1,
        lastCompleted: today,
        streak: wasYesterday || r.lastCompleted === today ? r.streak + 1 : 1,
      }
    })
    persist(updated)
    setRunning(null)
    toastSuccess('Ritual complete! 🔥')
  }

  const deleteRitual = (id: string) => persist(rituals.filter(r => r.id !== id))

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Flame className="w-7 h-7 text-orange-400" />
            Focus Rituals
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Build powerful entry and exit routines</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setShowPresets(true); setShowForm(false) }}
            className="px-3 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-sm font-semibold transition-colors">
            Presets
          </button>
          <button onClick={() => { setShowForm(true); setShowPresets(false) }}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm font-semibold transition-colors">
            <Plus className="w-4 h-4" /> Custom
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="game-card p-3 text-center">
          <Flame className="w-5 h-5 text-orange-400 mx-auto mb-1" />
          <div className="text-xl font-bold text-white">{rituals.length}</div>
          <div className="text-xs text-slate-500">Rituals</div>
        </div>
        <div className="game-card p-3 text-center">
          <Check className="w-5 h-5 text-green-400 mx-auto mb-1" />
          <div className="text-xl font-bold text-green-400">{rituals.reduce((s, r) => s + r.timesCompleted, 0)}</div>
          <div className="text-xs text-slate-500">Completions</div>
        </div>
        <div className="game-card p-3 text-center">
          <Clock className="w-5 h-5 text-blue-400 mx-auto mb-1" />
          <div className="text-xl font-bold text-blue-400">{Math.round(rituals.reduce((s, r) => s + r.totalDuration * r.timesCompleted, 0) / 60)}h</div>
          <div className="text-xs text-slate-500">Time Spent</div>
        </div>
      </div>

      {/* Presets */}
      {showPresets && (
        <div className="game-card p-4 space-y-3 border border-orange-500/20">
          <h3 className="font-semibold text-slate-300">Choose a Preset Ritual</h3>
          {PRESET_RITUALS.map((p, i) => (
            <div key={i} className="p-3 bg-slate-800/50 rounded-xl cursor-pointer hover:bg-slate-700/50 transition-colors"
              onClick={() => addPreset(p)}>
              <div className="font-semibold text-white text-sm">{p.name}</div>
              <div className="text-xs text-slate-500 mt-1">{p.steps.length} steps · {p.steps.reduce((s, step) => s + step.duration, 0)} min</div>
              <div className="flex gap-1 mt-2 flex-wrap">
                {p.steps.map((s, j) => <span key={j} className="text-[10px] bg-slate-700 text-slate-400 px-2 py-0.5 rounded">{s.text}</span>)}
              </div>
            </div>
          ))}
          <button onClick={() => setShowPresets(false)} className="text-xs text-slate-500 hover:text-slate-400">Cancel</button>
        </div>
      )}

      {/* Custom form */}
      {showForm && (
        <div className="game-card p-5 space-y-4 border border-orange-500/20">
          <h3 className="font-semibold text-slate-300">Create Custom Ritual</h3>
          <input value={formName} onChange={e => setFormName(e.target.value)}
            placeholder="Ritual name (e.g. Deep Work Entry)" className="game-input w-full" autoFocus />
          <div className="flex gap-2 flex-wrap">
            {RITUAL_TYPES.map(t => (
              <button key={t.value} onClick={() => setFormType(t.value as Ritual['type'])}
                className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                style={formType === t.value ? { background: t.color + '33', color: t.color, border: `1px solid ${t.color}` } : { background: '#1e293b', color: '#94a3b8' }}>
                {t.emoji} {t.label}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            <label className="text-xs text-slate-400">Steps</label>
            {formSteps.map((step, i) => (
              <div key={i} className="flex gap-2">
                <input value={step.text} onChange={e => setFormSteps(fs => fs.map((s, j) => j === i ? { ...s, text: e.target.value } : s))}
                  placeholder={`Step ${i + 1}…`} className="game-input flex-1 text-xs" />
                <input type="number" value={step.duration} onChange={e => setFormSteps(fs => fs.map((s, j) => j === i ? { ...s, duration: e.target.value } : s))}
                  className="game-input w-16 text-xs" placeholder="min" min="1" />
              </div>
            ))}
            <button onClick={() => setFormSteps(fs => [...fs, { text: '', duration: '5' }])}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors">+ Add Step</button>
          </div>
          <div className="flex gap-2">
            <button onClick={addRitual} className="flex-1 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-sm font-semibold transition-colors">
              Save Ritual
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Rituals list */}
      <div className="space-y-4">
        {rituals.map(r => {
          const t = RITUAL_TYPES.find(rt => rt.value === r.type)
          const allDone = r.steps.every(s => s.done)
          const doneCount = r.steps.filter(s => s.done).length
          const isRunning = running === r.id
          const completedToday = r.lastCompleted === today

          return (
            <div key={r.id} className="game-card p-4 space-y-3" style={{ borderLeft: `3px solid ${r.color}` }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>{t?.emoji}</span>
                  <div>
                    <h3 className="font-bold text-white text-sm">{r.name}</h3>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>{r.steps.length} steps · {r.totalDuration}m</span>
                      {r.streak > 0 && <span className="text-orange-400">🔥 {r.streak}d streak</span>}
                      <span>{r.timesCompleted}× done</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                    className="p-1 text-slate-500 hover:text-slate-300 transition-colors">
                    {expanded === r.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  <button onClick={() => deleteRitual(r.id)} className="p-1 text-slate-600 hover:text-red-400 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Steps */}
              {(isRunning || expanded === r.id) && (
                <div className="space-y-2 pt-1">
                  {r.steps.map(s => (
                    <div key={s.id} className="flex items-center gap-3 group cursor-pointer"
                      onClick={() => isRunning && toggleStep(r.id, s.id)}>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${s.done ? 'bg-green-500 border-green-500' : 'border-slate-600'}`}>
                        {s.done && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className={`text-sm flex-1 ${s.done ? 'line-through text-slate-600' : 'text-slate-300'}`}>{s.text}</span>
                      <span className="text-xs text-slate-600">{s.duration}m</span>
                    </div>
                  ))}
                </div>
              )}

              {completedToday ? (
                <div className="flex items-center gap-2 py-2 px-3 bg-green-900/20 text-green-400 rounded-xl text-xs font-semibold">
                  <Check className="w-4 h-4" /> Completed today!
                </div>
              ) : isRunning ? (
                <div className="flex gap-2">
                  {allDone && (
                    <button onClick={() => completeRitual(r.id)}
                      className="flex-1 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl text-sm font-semibold transition-colors">
                      ✅ Mark Complete
                    </button>
                  )}
                  <button onClick={() => setRunning(null)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">
                    {allDone ? 'Cancel' : 'Pause'}
                  </button>
                  <div className="flex items-center text-xs text-slate-500">
                    {doneCount}/{r.steps.length} done
                  </div>
                </div>
              ) : (
                <button onClick={() => { setRunning(r.id); setExpanded(r.id) }}
                  className="w-full py-2 border border-dashed hover:border-solid text-sm font-semibold transition-all rounded-xl"
                  style={{ borderColor: r.color + '60', color: r.color }}>
                  ▶ Start Ritual
                </button>
              )}
            </div>
          )
        })}
      </div>

      {rituals.length === 0 && !showForm && !showPresets && (
        <div className="text-center py-16 text-slate-500">
          <Flame className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="mb-2">No rituals created yet.</p>
          <p className="text-sm mb-5">Build powerful entry/exit routines for your best work.</p>
          <button onClick={() => setShowPresets(true)} className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-sm font-semibold transition-colors">
            Browse Presets
          </button>
        </div>
      )}
    </div>
  )
}

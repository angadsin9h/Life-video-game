import { useState, useEffect } from 'react'
import { FlaskConical, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type ExperimentArea = 'health' | 'productivity' | 'finance' | 'relationships' | 'mindset' | 'creativity' | 'learning' | 'habits' | 'diet' | 'other'
type ExperimentStatus = 'running' | 'completed' | 'failed' | 'paused' | 'planned'

interface LifeExperiment {
  id: string
  area: ExperimentArea
  status: ExperimentStatus
  hypothesis: string
  method: string
  duration: string
  successCriteria: string
  results: string
  conclusion: string
  willRepeat: boolean
  confidence: number
  startDate: string
  endDate: string
  date: string
  createdAt: string
}

const AREA_CONFIG: Record<ExperimentArea, { label: string; emoji: string; color: string }> = {
  health:        { label: 'Health',        emoji: '🏥', color: '#ef4444' },
  productivity:  { label: 'Productivity',  emoji: '⚡', color: '#f59e0b' },
  finance:       { label: 'Finance',       emoji: '💰', color: '#22c55e' },
  relationships: { label: 'Relationships', emoji: '❤️', color: '#ec4899' },
  mindset:       { label: 'Mindset',       emoji: '🧠', color: '#a855f7' },
  creativity:    { label: 'Creativity',    emoji: '🎨', color: '#f97316' },
  learning:      { label: 'Learning',      emoji: '📚', color: '#6366f1' },
  habits:        { label: 'Habits',        emoji: '🔄', color: '#3b82f6' },
  diet:          { label: 'Diet',          emoji: '🥗', color: '#84cc16' },
  other:         { label: 'Other',         emoji: '🔬', color: '#94a3b8' },
}

const STATUS_CONFIG: Record<ExperimentStatus, { label: string; color: string; emoji: string }> = {
  running:   { label: 'Running',   color: '#22c55e', emoji: '🟢' },
  completed: { label: 'Completed', color: '#3b82f6', emoji: '✅' },
  failed:    { label: 'Failed',    color: '#ef4444', emoji: '❌' },
  paused:    { label: 'Paused',    color: '#f59e0b', emoji: '⏸️' },
  planned:   { label: 'Planned',   color: '#a855f7', emoji: '📅' },
}

const STORAGE_KEY = 'life_experiments'

export default function LifeExperiments() {
  const { toastSuccess } = useToast()
  const [experiments, setExperiments] = useState<LifeExperiment[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<LifeExperiment, 'id' | 'createdAt'>>({
    area: 'habits', status: 'planned', hypothesis: '', method: '', duration: '30 days',
    successCriteria: '', results: '', conclusion: '', willRepeat: false, confidence: 7,
    startDate: new Date().toISOString().split('T')[0], endDate: '',
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setExperiments(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: LifeExperiment[]) => { setExperiments(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.hypothesis.trim()) return
    const e: LifeExperiment = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...experiments])
    setForm(f => ({ ...f, hypothesis: '', method: '', successCriteria: '', results: '', conclusion: '', willRepeat: false, endDate: '' }))
    setShowForm(false)
    toastSuccess('Experiment launched — life is your laboratory 🔬')
  }

  const running = experiments.filter(e => e.status === 'running').length
  const completed = experiments.filter(e => e.status === 'completed').length

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <FlaskConical className="w-7 h-7 text-cyan-400" />
            Life Experiments
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Run experiments on your own life. Test hypotheses. Learn fast.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-cyan-700 hover:bg-cyan-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Start
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{experiments.length}</div>
          <div className="text-xs text-slate-500">Total</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{running}</div>
          <div className="text-xs text-slate-500">Running</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-blue-400">{completed}</div>
          <div className="text-xs text-slate-500">Completed</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-cyan-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Start Experiment</h3>
          <div className="flex gap-2">
            <select value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value as ExperimentArea }))} className="game-input text-sm flex-1">
              {(Object.entries(AREA_CONFIG) as [ExperimentArea, typeof AREA_CONFIG.habits][]).map(([k, a]) => (
                <option key={k} value={k}>{a.emoji} {a.label}</option>
              ))}
            </select>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as ExperimentStatus }))} className="game-input text-sm flex-1">
              {(Object.entries(STATUS_CONFIG) as [ExperimentStatus, typeof STATUS_CONFIG.running][]).map(([k, s]) => (
                <option key={k} value={k}>{s.emoji} {s.label}</option>
              ))}
            </select>
          </div>
          <textarea value={form.hypothesis} onChange={e => setForm(f => ({ ...f, hypothesis: e.target.value }))}
            placeholder="Hypothesis: If I [action], then [expected result] *" className="game-input w-full h-12 resize-none text-sm" autoFocus />
          <input value={form.method} onChange={e => setForm(f => ({ ...f, method: e.target.value }))}
            placeholder="Method — how will you run this experiment?" className="game-input w-full text-sm" />
          <div className="flex gap-2">
            <input value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
              placeholder="Duration (e.g. 30 days)" className="game-input text-sm flex-1" />
            <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} className="game-input text-sm flex-1" />
          </div>
          <input value={form.successCriteria} onChange={e => setForm(f => ({ ...f, successCriteria: e.target.value }))}
            placeholder="Success criteria — how will you measure it?" className="game-input w-full text-sm" />
          <input value={form.results} onChange={e => setForm(f => ({ ...f, results: e.target.value }))}
            placeholder="Results (fill in after)" className="game-input w-full text-sm" />
          <input value={form.conclusion} onChange={e => setForm(f => ({ ...f, conclusion: e.target.value }))}
            placeholder="Conclusion / takeaway" className="game-input w-full text-sm" />
          <div className="flex items-center justify-between">
            <div className="flex-1 mr-4">
              <p className="text-xs text-slate-500 mb-1">Confidence: {form.confidence}/10</p>
              <input type="range" min={1} max={10} value={form.confidence}
                onChange={e => setForm(f => ({ ...f, confidence: Number(e.target.value) }))}
                className="w-full h-1 accent-cyan-400" />
            </div>
            <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
              <input type="checkbox" checked={form.willRepeat} onChange={e => setForm(f => ({ ...f, willRepeat: e.target.checked }))} />
              Will Repeat
            </label>
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-cyan-700 hover:bg-cyan-600 text-white rounded-xl text-sm font-semibold">Launch</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {experiments.map(e => {
          const a = AREA_CONFIG[e.area]
          const s = STATUS_CONFIG[e.status]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${s.color}` }}>
              <span className="text-2xl">{a.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs">{s.emoji}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: s.color + '20', color: s.color }}>{s.label}</span>
                  <span className="text-xs text-slate-500">{a.label}</span>
                  <span className="text-xs text-cyan-400">🔬 {e.duration}</span>
                </div>
                <p className="text-xs font-medium text-white mt-1 line-clamp-2">{e.hypothesis}</p>
                {e.results && <p className="text-xs text-green-300/80 mt-0.5">Results: {e.results}</p>}
                {e.willRepeat && <span className="text-xs text-yellow-400">✓ Will repeat</span>}
              </div>
              <button onClick={() => save(experiments.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {experiments.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <FlaskConical className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Life is the experiment. You are the scientist.</p>
          </div>
        )}
      </div>
    </div>
  )
}

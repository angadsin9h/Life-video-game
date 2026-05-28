import { useState, useEffect } from 'react'
import { FlaskConical, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type ExperimentDomain = 'health' | 'productivity' | 'relationships' | 'mindset' | 'finances' | 'creativity' | 'spirituality' | 'environment' | 'diet' | 'sleep'
type ExperimentOutcome = 'ongoing' | 'success' | 'failure' | 'mixed' | 'abandoned' | 'transformed'

interface LifeExperimentEntry {
  id: string
  domain: ExperimentDomain
  outcome: ExperimentOutcome
  hypothesis: string
  protocol: string
  duration: string
  metrics: string
  results: string
  keyLearning: string
  wouldRepeat: boolean
  successScore: number
  date: string
  createdAt: string
}

const DOMAIN_CONFIG: Record<ExperimentDomain, { label: string; emoji: string; color: string }> = {
  health:        { label: 'Health',        emoji: '💪', color: '#22c55e' },
  productivity:  { label: 'Productivity',  emoji: '⚡', color: '#f59e0b' },
  relationships: { label: 'Relationships', emoji: '❤️', color: '#ec4899' },
  mindset:       { label: 'Mindset',       emoji: '🧠', color: '#6366f1' },
  finances:      { label: 'Finances',      emoji: '💰', color: '#84cc16' },
  creativity:    { label: 'Creativity',    emoji: '🎨', color: '#a855f7' },
  spirituality:  { label: 'Spirituality',  emoji: '🙏', color: '#3b82f6' },
  environment:   { label: 'Environment',   emoji: '🏠', color: '#10b981' },
  diet:          { label: 'Diet',          emoji: '🥗', color: '#f97316' },
  sleep:         { label: 'Sleep',         emoji: '😴', color: '#94a3b8' },
}

const OUTCOME_CONFIG: Record<ExperimentOutcome, { label: string; color: string; emoji: string }> = {
  ongoing:     { label: 'Ongoing',     color: '#3b82f6', emoji: '🔬' },
  success:     { label: 'Success',     color: '#22c55e', emoji: '✅' },
  failure:     { label: 'Failure',     color: '#ef4444', emoji: '❌' },
  mixed:       { label: 'Mixed',       color: '#f59e0b', emoji: '⚖️' },
  abandoned:   { label: 'Abandoned',   color: '#94a3b8', emoji: '🚫' },
  transformed: { label: 'Transformed', color: '#a855f7', emoji: '✨' },
}

const STORAGE_KEY = 'life_experiment_log'

export default function LifeExperimentLog() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<LifeExperimentEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<LifeExperimentEntry, 'id' | 'createdAt'>>({
    domain: 'health', outcome: 'ongoing', hypothesis: '',
    protocol: '', duration: '', metrics: '', results: '',
    keyLearning: '', wouldRepeat: false, successScore: 7,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: LifeExperimentEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.hypothesis.trim()) return
    const e: LifeExperimentEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, hypothesis: '', protocol: '', duration: '', metrics: '', results: '', keyLearning: '' }))
    setShowForm(false)
    toastSuccess('Life experiment logged — test your assumptions, update your model 🔬')
  }

  const succeeded = entries.filter(e => e.outcome === 'success' || e.outcome === 'transformed').length
  const avgScore = entries.length ? Math.round(entries.reduce((s, e) => s + e.successScore, 0) / entries.length) : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <FlaskConical className="w-7 h-7 text-cyan-400" />
            Life Experiments
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Run structured experiments on your life, track results, iterate.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-cyan-700 hover:bg-cyan-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Experiment
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Experiments</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{succeeded}</div>
          <div className="text-xs text-slate-500">Succeeded</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-cyan-400">{avgScore}/10</div>
          <div className="text-xs text-slate-500">Avg Score</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-cyan-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Experiment</h3>
          <div className="flex gap-2">
            <select value={form.domain} onChange={e => setForm(f => ({ ...f, domain: e.target.value as ExperimentDomain }))} className="game-input text-sm flex-1">
              {(Object.entries(DOMAIN_CONFIG) as [ExperimentDomain, typeof DOMAIN_CONFIG.health][]).map(([k, d]) => (
                <option key={k} value={k}>{d.emoji} {d.label}</option>
              ))}
            </select>
            <select value={form.outcome} onChange={e => setForm(f => ({ ...f, outcome: e.target.value as ExperimentOutcome }))} className="game-input text-sm flex-1">
              {(Object.entries(OUTCOME_CONFIG) as [ExperimentOutcome, typeof OUTCOME_CONFIG.success][]).map(([k, o]) => (
                <option key={k} value={k}>{o.emoji} {o.label}</option>
              ))}
            </select>
          </div>
          <input value={form.hypothesis} onChange={e => setForm(f => ({ ...f, hypothesis: e.target.value }))}
            placeholder="Hypothesis: If I do X, then Y will happen *" className="game-input w-full text-sm" autoFocus />
          <textarea value={form.protocol} onChange={e => setForm(f => ({ ...f, protocol: e.target.value }))}
            placeholder="Protocol: exactly what you will do" className="game-input w-full h-12 resize-none text-sm" />
          <div className="flex gap-2">
            <input value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
              placeholder="Duration (e.g., 30 days)" className="game-input text-sm flex-1" />
            <input value={form.metrics} onChange={e => setForm(f => ({ ...f, metrics: e.target.value }))}
              placeholder="How you'll measure it" className="game-input text-sm flex-1" />
          </div>
          <input value={form.results} onChange={e => setForm(f => ({ ...f, results: e.target.value }))}
            placeholder="Results observed" className="game-input w-full text-sm" />
          <input value={form.keyLearning} onChange={e => setForm(f => ({ ...f, keyLearning: e.target.value }))}
            placeholder="Key learning from this experiment" className="game-input w-full text-sm" />
          <label className="flex items-center gap-2 text-xs text-slate-400">
            <input type="checkbox" checked={form.wouldRepeat}
              onChange={e => setForm(f => ({ ...f, wouldRepeat: e.target.checked }))} className="accent-cyan-400" />
            Would repeat / continue
          </label>
          <div>
            <p className="text-xs text-slate-500 mb-1">Success score: {form.successScore}/10</p>
            <input type="range" min={1} max={10} value={form.successScore}
              onChange={e => setForm(f => ({ ...f, successScore: Number(e.target.value) }))}
              className="w-full h-1 accent-cyan-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-cyan-700 hover:bg-cyan-600 text-white rounded-xl text-sm font-semibold">Log Experiment</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const d = DOMAIN_CONFIG[e.domain]
          const o = OUTCOME_CONFIG[e.outcome]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${d.color}` }}>
              <span className="text-2xl">{d.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-white">{d.label}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: o.color + '20', color: o.color }}>{o.emoji} {o.label}</span>
                  <span className="text-xs text-cyan-400">🔬 {e.successScore}/10</span>
                  {e.wouldRepeat && <span className="text-xs text-green-400">✓ Repeat</span>}
                </div>
                <p className="text-xs text-slate-300 mt-1 line-clamp-1 italic">{e.hypothesis}</p>
                {e.keyLearning && <p className="text-xs text-yellow-300/70 mt-0.5">💡 {e.keyLearning}</p>}
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <FlaskConical className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Treat your life like a laboratory. Test. Learn. Iterate.</p>
          </div>
        )}
      </div>
    </div>
  )
}

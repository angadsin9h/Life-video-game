import { useEffect, useState } from 'react'
import { Brain, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface AnxietyEntry {
  id: string
  date: string
  trigger: string
  anxietyLevel: number
  physicalSensations: string[]
  thoughts: string
  reframe: string
  action: string
  afterLevel: number
  outcome: string
}

const SENSATIONS = ['Racing heart', 'Tight chest', 'Shallow breathing', 'Sweating', 'Nausea', 'Trembling', 'Headache', 'Dizziness', 'Restlessness', 'Fatigue']

const REFRAME_PROMPTS = [
  'Is this thought 100% true? What evidence contradicts it?',
  'What would I tell a close friend in this situation?',
  'Will this matter in 5 years? In 1 year? In 1 week?',
  'What is the most likely outcome — not the worst case?',
  'What\'s within my control right now?',
  'What has helped me through similar situations before?',
]

const COPING_ACTIONS = [
  '4-7-8 breathing (inhale 4s, hold 7s, exhale 8s)',
  'Box breathing (4-4-4-4)',
  '5-4-3-2-1 grounding (5 things you see, 4 hear...)',
  'Take a 10-minute walk',
  'Write out your worries on paper',
  'Call a trusted person',
  'Splash cold water on face',
  'Progressive muscle relaxation',
]

const STORAGE_KEY = 'anxiety_journal'

export default function AnxietyJournal() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<AnxietyEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<Omit<AnxietyEntry, 'id' | 'date'>>({
    trigger: '', anxietyLevel: 5, physicalSensations: [], thoughts: '',
    reframe: '', action: '', afterLevel: 0, outcome: '',
  })

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) setEntries(JSON.parse(saved))
  }, [])

  const persist = (updated: AnxietyEntry[]) => {
    setEntries(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const saveEntry = () => {
    const entry: AnxietyEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      ...form,
    }
    persist([entry, ...entries])
    setForm({ trigger: '', anxietyLevel: 5, physicalSensations: [], thoughts: '', reframe: '', action: '', afterLevel: 0, outcome: '' })
    setShowForm(false)
    setStep(1)
    toastSuccess('Anxiety entry logged. You did great acknowledging it.')
  }

  const toggleSensation = (s: string) => {
    setForm(f => ({
      ...f,
      physicalSensations: f.physicalSensations.includes(s) ? f.physicalSensations.filter(x => x !== s) : [...f.physicalSensations, s],
    }))
  }

  const levelColor = (l: number) => l <= 3 ? '#22c55e' : l <= 6 ? '#eab308' : l <= 8 ? '#f97316' : '#ef4444'
  const levelLabel = (l: number) => l <= 2 ? 'Mild' : l <= 4 ? 'Moderate' : l <= 6 ? 'High' : l <= 8 ? 'Severe' : 'Extreme'

  const avgLevel = entries.length > 0 ? +(entries.reduce((s, e) => s + e.anxietyLevel, 0) / entries.length).toFixed(1) : 0
  const avgAfter = entries.filter(e => e.afterLevel > 0).length > 0
    ? +(entries.filter(e => e.afterLevel > 0).reduce((s, e) => s + e.afterLevel, 0) / entries.filter(e => e.afterLevel > 0).length).toFixed(1)
    : 0
  const reduction = avgAfter > 0 ? +(avgLevel - avgAfter).toFixed(1) : null

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Brain className="w-7 h-7 text-violet-400" />
            Anxiety Journal
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Understand and reframe anxious thoughts</p>
        </div>
        <button onClick={() => { setShowForm(true); setStep(1) }}
          className="flex items-center gap-2 px-3 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-semibold transition-colors">
          <Plus className="w-4 h-4" /> Log Episode
        </button>
      </div>

      {/* Stats */}
      {entries.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="game-card p-3 text-center">
            <div className="text-xl font-bold" style={{ color: levelColor(avgLevel) }}>{avgLevel}/10</div>
            <div className="text-xs text-slate-500">Avg Anxiety</div>
          </div>
          <div className="game-card p-3 text-center">
            <div className="text-xl font-bold text-green-400">{avgAfter > 0 ? `${avgAfter}/10` : '—'}</div>
            <div className="text-xs text-slate-500">After Coping</div>
          </div>
          <div className="game-card p-3 text-center">
            <div className="text-xl font-bold text-blue-400">{reduction !== null ? `↓${reduction}` : '—'}</div>
            <div className="text-xs text-slate-500">Avg Reduction</div>
          </div>
        </div>
      )}

      {/* Multi-step form */}
      {showForm && (
        <div className="game-card p-5 space-y-4 border border-violet-500/20">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-300">Log Anxiety Episode — Step {step}/4</h3>
            <div className="flex gap-1">
              {[1, 2, 3, 4].map(s => (
                <div key={s} className="w-2 h-2 rounded-full" style={{ background: s <= step ? '#8b5cf6' : '#1e293b' }} />
              ))}
            </div>
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">What triggered this anxiety?</label>
                <textarea value={form.trigger} onChange={e => setForm(f => ({ ...f, trigger: e.target.value }))}
                  placeholder="Describe the situation, thought, or event that caused this feeling..." className="game-input w-full h-20 resize-none" autoFocus />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <label className="text-slate-400">Anxiety Level</label>
                  <span className="font-bold" style={{ color: levelColor(form.anxietyLevel) }}>{form.anxietyLevel}/10 — {levelLabel(form.anxietyLevel)}</span>
                </div>
                <input type="range" min="1" max="10" value={form.anxietyLevel}
                  onChange={e => setForm(f => ({ ...f, anxietyLevel: +e.target.value }))}
                  className="w-full accent-violet-400" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-2 block">Physical Sensations</label>
                <div className="flex flex-wrap gap-2">
                  {SENSATIONS.map(s => (
                    <button key={s} onClick={() => toggleSensation(s)}
                      className="px-2 py-1 rounded-lg text-xs transition-all"
                      style={form.physicalSensations.includes(s) ? { background: '#8b5cf633', color: '#8b5cf6', border: '1px solid #8b5cf6' } : { background: '#1e293b', color: '#64748b' }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">What thoughts are running through your mind?</label>
                <textarea value={form.thoughts} onChange={e => setForm(f => ({ ...f, thoughts: e.target.value }))}
                  placeholder="Write out the anxious thoughts without judgment..." className="game-input w-full h-24 resize-none" autoFocus />
              </div>
              <div className="p-3 bg-slate-800/50 rounded-xl">
                <p className="text-xs text-violet-400 font-medium mb-1">Reflection prompt:</p>
                <p className="text-xs text-slate-400 italic">{REFRAME_PROMPTS[Math.floor(Math.random() * REFRAME_PROMPTS.length)]}</p>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Reframe — a more balanced perspective</label>
                <textarea value={form.reframe} onChange={e => setForm(f => ({ ...f, reframe: e.target.value }))}
                  placeholder="Challenge the thought. What's a more realistic view?" className="game-input w-full h-20 resize-none" />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <label className="text-xs text-slate-400 block">Choose a coping action</label>
              <div className="space-y-2">
                {COPING_ACTIONS.map(a => (
                  <button key={a} onClick={() => setForm(f => ({ ...f, action: a }))}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm transition-all"
                    style={form.action === a ? { background: '#8b5cf633', color: '#8b5cf6', border: '1px solid #8b5cf6' } : { background: '#1e293b', color: '#94a3b8' }}>
                    {a}
                  </button>
                ))}
              </div>
              <input value={form.action} onChange={e => setForm(f => ({ ...f, action: e.target.value }))}
                placeholder="Or write your own coping action..." className="game-input w-full" />
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <label className="text-slate-400">Anxiety Level After Coping</label>
                  <span className="font-bold" style={{ color: levelColor(form.afterLevel) }}>{form.afterLevel}/10</span>
                </div>
                <input type="range" min="0" max="10" value={form.afterLevel}
                  onChange={e => setForm(f => ({ ...f, afterLevel: +e.target.value }))}
                  className="w-full accent-green-400" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">What happened / outcome?</label>
                <textarea value={form.outcome} onChange={e => setForm(f => ({ ...f, outcome: e.target.value }))}
                  placeholder="What did you learn? How did you handle it?" className="game-input w-full h-20 resize-none" />
              </div>
            </div>
          )}

          <div className="flex gap-2">
            {step > 1 && <button onClick={() => setStep(s => s - 1)} className="px-4 py-2 bg-slate-700 text-slate-300 rounded-xl text-sm">Back</button>}
            {step < 4 ? (
              <button onClick={() => setStep(s => s + 1)} className="flex-1 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-semibold transition-colors">
                Next →
              </button>
            ) : (
              <button onClick={saveEntry} className="flex-1 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl text-sm font-semibold transition-colors">
                Save Entry
              </button>
            )}
            <button onClick={() => { setShowForm(false); setStep(1) }} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Entries */}
      <div className="space-y-3">
        {entries.map(e => (
          <div key={e.id} className="game-card overflow-hidden" style={{ borderLeft: `3px solid ${levelColor(e.anxietyLevel)}` }}>
            <div className="p-4 cursor-pointer flex items-start justify-between"
              onClick={() => setExpanded(expanded === e.id ? null : e.id)}>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold" style={{ color: levelColor(e.anxietyLevel) }}>{e.anxietyLevel}/10</span>
                  <span className="text-xs text-slate-500">→</span>
                  {e.afterLevel > 0 && <span className="text-sm font-bold text-green-400">{e.afterLevel}/10</span>}
                  <span className="text-xs text-slate-500">{e.date}</span>
                </div>
                <p className="text-sm text-slate-300 line-clamp-1">{e.trigger}</p>
                {e.physicalSensations.length > 0 && (
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {e.physicalSensations.slice(0, 3).map(s => (
                      <span key={s} className="text-[10px] bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded">{s}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {expanded === e.id ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                <button onClick={ev => { ev.stopPropagation(); persist(entries.filter(x => x.id !== e.id)) }}
                  className="p-1 text-slate-600 hover:text-red-400 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            {expanded === e.id && (
              <div className="px-4 pb-4 space-y-2 border-t border-slate-800 pt-3 text-sm">
                {e.thoughts && <div><span className="text-xs text-slate-500 uppercase">Thoughts:</span><p className="text-slate-300 mt-0.5">{e.thoughts}</p></div>}
                {e.reframe && <div><span className="text-xs text-green-500 uppercase">Reframe:</span><p className="text-green-300 mt-0.5">{e.reframe}</p></div>}
                {e.action && <div><span className="text-xs text-blue-500 uppercase">Coping:</span><p className="text-blue-300 mt-0.5">{e.action}</p></div>}
                {e.outcome && <div><span className="text-xs text-slate-500 uppercase">Outcome:</span><p className="text-slate-300 mt-0.5">{e.outcome}</p></div>}
              </div>
            )}
          </div>
        ))}
      </div>

      {entries.length === 0 && !showForm && (
        <div className="text-center py-16 text-slate-500">
          <Brain className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="mb-2">No anxiety entries yet.</p>
          <p className="text-sm mb-5">Logging anxious episodes helps you understand and reduce them over time.</p>
          <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-semibold transition-colors">
            Log Your First Entry
          </button>
        </div>
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { Target, Plus, Trash2, Star, Check, X, BarChart3 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface Criterion {
  id: string
  name: string
  weight: number
}

interface Option {
  id: string
  name: string
  scores: Record<string, number>
  pros: string
  cons: string
}

interface Decision {
  id: string
  question: string
  criteria: Criterion[]
  options: Option[]
  chosen: string
  notes: string
  createdAt: string
}

const STORAGE_KEY = 'decision_matrix'

const PRESET_CRITERIA = [
  { name: 'Impact', weight: 5 },
  { name: 'Effort', weight: 3 },
  { name: 'Risk', weight: 4 },
  { name: 'Alignment with values', weight: 5 },
  { name: 'Cost', weight: 3 },
  { name: 'Time required', weight: 3 },
]

export default function DecisionMatrix() {
  const { toastSuccess } = useToast()
  const [decisions, setDecisions] = useState<Decision[]>([])
  const [current, setCurrent] = useState<Decision | null>(null)
  const [step, setStep] = useState<'list' | 'question' | 'criteria' | 'options' | 'score' | 'result'>('list')
  const [question, setQuestion] = useState('')

  useEffect(() => {
    try {
      setDecisions(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'))
    } catch { /**/ }
  }, [])

  const save = (updated: Decision[]) => {
    setDecisions(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const startNew = () => {
    setCurrent({
      id: Date.now().toString(),
      question: '',
      criteria: [],
      options: [],
      chosen: '',
      notes: '',
      createdAt: new Date().toISOString(),
    })
    setQuestion('')
    setStep('question')
  }

  const setCurrentField = <K extends keyof Decision>(key: K, val: Decision[K]) => {
    setCurrent(c => c ? { ...c, [key]: val } : c)
  }

  const addCriterion = (name = '', weight = 3) => {
    if (!current) return
    const c: Criterion = { id: Date.now().toString(), name, weight }
    setCurrentField('criteria', [...current.criteria, c])
  }

  const updateCriterion = (id: string, field: keyof Criterion, val: string | number) => {
    if (!current) return
    setCurrentField('criteria', current.criteria.map(c => c.id === id ? { ...c, [field]: val } : c))
  }

  const addOption = () => {
    if (!current) return
    const scores: Record<string, number> = {}
    current.criteria.forEach(c => { scores[c.id] = 5 })
    const o: Option = { id: Date.now().toString(), name: '', scores, pros: '', cons: '' }
    setCurrentField('options', [...current.options, o])
  }

  const updateOption = (id: string, field: keyof Option, val: string | Record<string, number>) => {
    if (!current) return
    setCurrentField('options', current.options.map(o => o.id === id ? { ...o, [field]: val } : o))
  }

  const setScore = (optId: string, critId: string, val: number) => {
    if (!current) return
    const opt = current.options.find(o => o.id === optId)
    if (!opt) return
    const scores = { ...opt.scores, [critId]: val }
    updateOption(optId, 'scores', scores)
  }

  const getWeightedScore = (opt: Option): number => {
    if (!current || current.criteria.length === 0) return 0
    const totalWeight = current.criteria.reduce((s, c) => s + c.weight, 0)
    if (totalWeight === 0) return 0
    const score = current.criteria.reduce((s, c) => s + (opt.scores[c.id] ?? 5) * c.weight, 0)
    return Math.round((score / (totalWeight * 10)) * 100)
  }

  const finalize = () => {
    if (!current) return
    const best = [...current.options].sort((a, b) => getWeightedScore(b) - getWeightedScore(a))[0]
    const final = { ...current, question, chosen: best?.id ?? '' }
    save([final, ...decisions])
    setCurrent(final)
    setStep('result')
    toastSuccess(`Decision analyzed! "${best?.name}" scores highest 🎯`)
  }

  const del = (id: string) => save(decisions.filter(d => d.id !== id))

  if (step === 'question') return (
    <div className="space-y-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Orbitron, monospace' }}>Decision Matrix</h1>
      <div className="game-card p-5 space-y-4">
        <h3 className="font-semibold text-slate-300">Step 1: Define the Decision</h3>
        <textarea value={question} onChange={e => setQuestion(e.target.value)}
          placeholder="What decision do you need to make? (e.g., 'Should I change careers?', 'Which job offer to take?')"
          className="game-input w-full h-24 resize-none" autoFocus />
        <div className="flex gap-2">
          <button onClick={() => { setCurrentField('question', question); setStep('criteria') }}
            disabled={!question.trim()}
            className="flex-1 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold">
            Next: Define Criteria →
          </button>
          <button onClick={() => setStep('list')} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
        </div>
      </div>
    </div>
  )

  if (step === 'criteria') return (
    <div className="space-y-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Orbitron, monospace' }}>Decision Matrix</h1>
      <div className="game-card p-5 space-y-4">
        <div>
          <h3 className="font-semibold text-slate-300 mb-1">Step 2: What matters to you?</h3>
          <p className="text-xs text-slate-500">Weight: 1 (low importance) → 5 (critical)</p>
        </div>
        <div className="flex flex-wrap gap-2 mb-2">
          {PRESET_CRITERIA.filter(p => !current?.criteria.some(c => c.name === p.name)).map(p => (
            <button key={p.name} onClick={() => addCriterion(p.name, p.weight)}
              className="text-xs px-2 py-1 rounded-lg bg-slate-800 text-slate-400 hover:text-violet-400 transition-colors">
              + {p.name}
            </button>
          ))}
        </div>
        {current?.criteria.map(c => (
          <div key={c.id} className="flex items-center gap-2">
            <input value={c.name} onChange={e => updateCriterion(c.id, 'name', e.target.value)}
              placeholder="Criterion name..." className="game-input flex-1 text-sm" />
            <div className="flex gap-1">
              {[1,2,3,4,5].map(n => (
                <button key={n} onClick={() => updateCriterion(c.id, 'weight', n)}
                  className={`w-6 h-6 rounded text-xs font-bold transition-all ${n <= c.weight ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-600'}`}>
                  {n}
                </button>
              ))}
            </div>
            <button onClick={() => setCurrentField('criteria', current.criteria.filter(x => x.id !== c.id))}
              className="p-1 text-slate-600 hover:text-red-400">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        <button onClick={() => addCriterion()} className="w-full py-2 border border-dashed border-slate-700 rounded-xl text-slate-500 hover:text-slate-300 text-sm">
          <Plus className="w-4 h-4 inline mr-1" /> Add criterion
        </button>
        <div className="flex gap-2">
          <button onClick={() => setStep('options')} disabled={!current?.criteria.length || !current.criteria.every(c => c.name.trim())}
            className="flex-1 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold">
            Next: Add Options →
          </button>
          <button onClick={() => setStep('question')} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Back</button>
        </div>
      </div>
    </div>
  )

  if (step === 'options') return (
    <div className="space-y-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Orbitron, monospace' }}>Decision Matrix</h1>
      <div className="game-card p-5 space-y-4">
        <h3 className="font-semibold text-slate-300">Step 3: What are your options?</h3>
        {current?.options.map(o => (
          <div key={o.id} className="p-3 bg-slate-800 rounded-xl space-y-2">
            <div className="flex gap-2">
              <input value={o.name} onChange={e => updateOption(o.id, 'name', e.target.value)}
                placeholder="Option name..." className="game-input flex-1 text-sm" />
              <button onClick={() => setCurrentField('options', current.options.filter(x => x.id !== o.id))}
                className="p-1 text-slate-600 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input value={o.pros} onChange={e => updateOption(o.id, 'pros', e.target.value)}
                placeholder="Pros..." className="game-input text-xs" />
              <input value={o.cons} onChange={e => updateOption(o.id, 'cons', e.target.value)}
                placeholder="Cons..." className="game-input text-xs" />
            </div>
          </div>
        ))}
        <button onClick={addOption} className="w-full py-2 border border-dashed border-slate-700 rounded-xl text-slate-500 hover:text-slate-300 text-sm">
          <Plus className="w-4 h-4 inline mr-1" /> Add option
        </button>
        <div className="flex gap-2">
          <button onClick={() => setStep('score')}
            disabled={!current?.options || current.options.length < 2 || !current.options.every(o => o.name.trim())}
            className="flex-1 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold">
            Next: Score Options →
          </button>
          <button onClick={() => setStep('criteria')} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Back</button>
        </div>
      </div>
    </div>
  )

  if (step === 'score') return (
    <div className="space-y-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Orbitron, monospace' }}>Decision Matrix</h1>
      <div className="game-card p-5 space-y-4">
        <div>
          <h3 className="font-semibold text-slate-300 mb-1">Step 4: Score each option</h3>
          <p className="text-xs text-slate-500">1 = very poor, 10 = excellent for this criterion</p>
        </div>
        {current?.options.map(o => (
          <div key={o.id} className="p-3 bg-slate-800 rounded-xl">
            <div className="font-semibold text-white text-sm mb-3">{o.name}</div>
            {current.criteria.map(c => (
              <div key={c.id} className="flex items-center gap-2 mb-2">
                <span className="text-xs text-slate-400 w-32 flex-shrink-0">{c.name} (×{c.weight})</span>
                <input type="range" min="1" max="10" value={o.scores[c.id] ?? 5}
                  onChange={e => setScore(o.id, c.id, +e.target.value)}
                  className="flex-1" />
                <span className="text-xs font-bold text-violet-400 w-6 text-right">{o.scores[c.id] ?? 5}</span>
              </div>
            ))}
            <div className="text-xs text-slate-500 mt-2 text-right">
              Weighted: <span className="text-violet-400 font-bold">{getWeightedScore(o)}%</span>
            </div>
          </div>
        ))}
        <div className="flex gap-2">
          <button onClick={finalize} className="flex-1 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-semibold">
            <BarChart3 className="w-4 h-4 inline mr-1" /> Analyze Decision
          </button>
          <button onClick={() => setStep('options')} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Back</button>
        </div>
      </div>
    </div>
  )

  if (step === 'result' && current) {
    const sorted = [...current.options].sort((a, b) => getWeightedScore(b) - getWeightedScore(a))
    return (
      <div className="space-y-6 max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Orbitron, monospace' }}>Decision Result</h1>
        <div className="game-card p-4 border border-violet-500/30">
          <p className="text-xs text-slate-500 mb-1">Decision</p>
          <p className="text-sm text-white font-medium">{question}</p>
        </div>
        <div className="space-y-3">
          {sorted.map((o, i) => {
            const score = getWeightedScore(o)
            return (
              <div key={o.id} className={`game-card p-4 ${i === 0 ? 'border border-green-500/30' : ''}`}>
                <div className="flex items-center gap-2 mb-2">
                  {i === 0 && <span className="text-green-400 text-xs font-bold">✓ RECOMMENDED</span>}
                  <span className={`font-semibold ${i === 0 ? 'text-white' : 'text-slate-400'}`}>{o.name}</span>
                  <span className="ml-auto font-bold text-violet-400">{score}%</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${score}%`, background: i === 0 ? '#22c55e' : '#6366f1' }} />
                </div>
                {(o.pros || o.cons) && (
                  <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                    {o.pros && <span className="text-green-500">+ {o.pros}</span>}
                    {o.cons && <span className="text-red-500">- {o.cons}</span>}
                  </div>
                )}
              </div>
            )
          })}
        </div>
        <button onClick={() => setStep('list')} className="w-full py-2 bg-slate-700 text-slate-300 rounded-xl text-sm">
          ← Back to all decisions
        </button>
      </div>
    )
  }

  // List view
  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Target className="w-7 h-7 text-violet-400" />
            Decision Matrix
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Make better decisions with weighted criteria scoring.</p>
        </div>
        <button onClick={startNew}
          className="flex items-center gap-2 px-3 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-semibold transition-colors">
          <Plus className="w-4 h-4" /> New Decision
        </button>
      </div>

      {decisions.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          <Target className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="mb-2">No decisions analyzed yet.</p>
          <p className="text-sm">Use the matrix to score options by weighted criteria.</p>
        </div>
      )}

      {decisions.map(d => {
        const best = [...d.options].sort((a, b) => {
          const scoreA = d.criteria.reduce((s, c) => s + (a.scores[c.id] ?? 5) * c.weight, 0)
          const scoreB = d.criteria.reduce((s, c) => s + (b.scores[c.id] ?? 5) * c.weight, 0)
          return scoreB - scoreA
        })[0]
        return (
          <div key={d.id} className="game-card p-4">
            <div className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white mb-1">{d.question}</p>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span>{d.options.length} options</span>
                  <span>{d.criteria.length} criteria</span>
                  {best && <span className="text-green-400">→ {best.name}</span>}
                </div>
                <p className="text-xs text-slate-600 mt-1">{d.createdAt.split('T')[0]}</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => { setCurrent(d); setQuestion(d.question); setStep('result') }}
                  className="p-1.5 text-slate-600 hover:text-violet-400">
                  <BarChart3 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => del(d.id)} className="p-1.5 text-slate-700 hover:text-red-400">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

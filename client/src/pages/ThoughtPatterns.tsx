import { useState, useEffect } from 'react'
import { Brain, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type PatternType = 'limiting' | 'empowering' | 'recurring' | 'cognitive-distortion' | 'core-belief' | 'assumption' | 'narrative' | 'trigger' | 'other'

interface ThoughtPattern {
  id: string
  type: PatternType
  pattern: string
  trigger: string
  impact: string
  reframe: string
  frequency: 'rarely' | 'sometimes' | 'often' | 'always'
  intensity: number
  isAddressed: boolean
  evidence: string
  createdAt: string
}

const TYPE_CONFIG: Record<PatternType, { label: string; emoji: string; color: string }> = {
  limiting:              { label: 'Limiting Belief',     emoji: '🔒', color: '#ef4444' },
  empowering:            { label: 'Empowering Belief',   emoji: '💪', color: '#22c55e' },
  recurring:             { label: 'Recurring Thought',   emoji: '🔄', color: '#f59e0b' },
  'cognitive-distortion':{ label: 'Cognitive Distortion',emoji: '🌀', color: '#a855f7' },
  'core-belief':         { label: 'Core Belief',         emoji: '🌱', color: '#3b82f6' },
  assumption:            { label: 'Assumption',          emoji: '❓', color: '#f97316' },
  narrative:             { label: 'Life Narrative',      emoji: '📖', color: '#6366f1' },
  trigger:               { label: 'Trigger Pattern',     emoji: '⚡', color: '#ec4899' },
  other:                 { label: 'Other',               emoji: '💭', color: '#94a3b8' },
}

const DISTORTIONS = ['All-or-nothing thinking', 'Overgeneralization', 'Mental filter', 'Disqualifying the positive', 'Mind reading', 'Fortune telling', 'Magnification', 'Emotional reasoning', 'Should statements', 'Labeling', 'Personalization']

const STORAGE_KEY = 'thought_patterns'

export default function ThoughtPatterns() {
  const { toastSuccess } = useToast()
  const [patterns, setPatterns] = useState<ThoughtPattern[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<string>('all')
  const [showDistortions, setShowDistortions] = useState(false)
  const [form, setForm] = useState<Omit<ThoughtPattern, 'id' | 'createdAt'>>({
    type: 'limiting', pattern: '', trigger: '', impact: '', reframe: '',
    frequency: 'sometimes', intensity: 5, isAddressed: false, evidence: '',
  })

  useEffect(() => {
    try { setPatterns(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: ThoughtPattern[]) => { setPatterns(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.pattern.trim()) return
    const p: ThoughtPattern = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([p, ...patterns])
    setForm(f => ({ ...f, pattern: '', trigger: '', impact: '', reframe: '', evidence: '' }))
    setShowForm(false)
    toastSuccess('Thought pattern logged 🧠')
  }

  const filtered = patterns.filter(p => filterType === 'all' || p.type === filterType)
  const limiting = patterns.filter(p => p.type === 'limiting').length
  const empowering = patterns.filter(p => p.type === 'empowering').length
  const addressed = patterns.filter(p => p.isAddressed).length

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Brain className="w-7 h-7 text-purple-400" />
            Thought Patterns
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Identify, understand, and reshape your thinking.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-red-400">{limiting}</div>
          <div className="text-xs text-slate-500">Limiting</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{empowering}</div>
          <div className="text-xs text-slate-500">Empowering</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-blue-400">{addressed}</div>
          <div className="text-xs text-slate-500">Addressed</div>
        </div>
      </div>

      <button onClick={() => setShowDistortions(!showDistortions)}
        className="w-full text-left px-3 py-2 bg-slate-800 rounded-xl text-xs text-slate-400 hover:text-slate-300">
        {showDistortions ? '▼' : '▶'} Common Cognitive Distortions
      </button>
      {showDistortions && (
        <div className="game-card p-3 grid grid-cols-2 gap-1">
          {DISTORTIONS.map(d => (
            <button key={d} onClick={() => setForm(f => ({ ...f, pattern: d, type: 'cognitive-distortion' }))}
              className="text-xs text-left px-2 py-1 bg-purple-900/20 text-purple-300 rounded hover:bg-purple-900/40">
              {d}
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilterType('all')}
          className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterType === 'all' ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30' : 'bg-slate-800 text-slate-500'}`}>
          All
        </button>
        {(Object.entries(TYPE_CONFIG) as [PatternType, typeof TYPE_CONFIG.limiting][]).map(([k, t]) => (
          <button key={k} onClick={() => setFilterType(k)}
            className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterType === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
            style={filterType === k ? { background: t.color + '30', color: t.color } : {}}>
            {t.emoji}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-purple-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Thought Pattern</h3>
          <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as PatternType }))} className="game-input w-full text-sm">
            {(Object.entries(TYPE_CONFIG) as [PatternType, typeof TYPE_CONFIG.limiting][]).map(([k, t]) => (
              <option key={k} value={k}>{t.emoji} {t.label}</option>
            ))}
          </select>
          <textarea value={form.pattern} onChange={e => setForm(f => ({ ...f, pattern: e.target.value }))}
            placeholder="Describe the thought pattern... *" className="game-input w-full h-16 resize-none" autoFocus />
          <input value={form.trigger} onChange={e => setForm(f => ({ ...f, trigger: e.target.value }))}
            placeholder="What triggers this thought?" className="game-input w-full text-sm" />
          <input value={form.impact} onChange={e => setForm(f => ({ ...f, impact: e.target.value }))}
            placeholder="How does it impact you?" className="game-input w-full text-sm" />
          <textarea value={form.reframe} onChange={e => setForm(f => ({ ...f, reframe: e.target.value }))}
            placeholder="Reframe / more helpful thought..." className="game-input w-full h-12 resize-none text-sm" />
          <textarea value={form.evidence} onChange={e => setForm(f => ({ ...f, evidence: e.target.value }))}
            placeholder="Evidence for / against this pattern..." className="game-input w-full h-12 resize-none text-sm" />
          <div className="flex gap-3 items-center">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Intensity: {form.intensity}/10</p>
              <input type="range" min={1} max={10} value={form.intensity}
                onChange={e => setForm(f => ({ ...f, intensity: Number(e.target.value) }))}
                className="w-full h-1 accent-purple-400" />
            </div>
            <select value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value as ThoughtPattern['frequency'] }))}
              className="game-input text-sm">
              <option value="rarely">Rarely</option>
              <option value="sometimes">Sometimes</option>
              <option value="often">Often</option>
              <option value="always">Always</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
            <input type="checkbox" checked={form.isAddressed} onChange={e => setForm(f => ({ ...f, isAddressed: e.target.checked }))} />
            I've addressed/reframed this
          </label>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(p => {
          const t = TYPE_CONFIG[p.type]
          const isExp = expanded === p.id
          return (
            <div key={p.id} className="game-card overflow-hidden" style={{ borderLeft: `3px solid ${t.color}` }}>
              <div className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isExp ? null : p.id)}>
                <span className="text-2xl">{t.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white text-sm truncate">{p.pattern}</span>
                    {p.isAddressed && <span className="text-xs text-green-500">✅</span>}
                  </div>
                  <p className="text-xs text-slate-500">{t.label} · {p.frequency} · intensity {p.intensity}/10</p>
                </div>
                {isExp ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
              </div>
              {isExp && (
                <div className="border-t border-slate-800 p-3 space-y-1.5">
                  {p.trigger && <p className="text-xs text-slate-300">⚡ Trigger: {p.trigger}</p>}
                  {p.impact && <p className="text-xs text-red-300">⚠️ Impact: {p.impact}</p>}
                  {p.reframe && <p className="text-xs text-green-300">💡 Reframe: {p.reframe}</p>}
                  {p.evidence && <p className="text-xs text-blue-300">🔍 Evidence: {p.evidence}</p>}
                  <div className="flex gap-2 items-center">
                    <button onClick={() => save(patterns.map(x => x.id === p.id ? { ...x, isAddressed: !x.isAddressed } : x))}
                      className="text-xs text-green-600 hover:text-green-400">
                      {p.isAddressed ? 'Mark unresolved' : 'Mark addressed'}
                    </button>
                    <button onClick={() => save(patterns.filter(x => x.id !== p.id))} className="ml-auto text-slate-700 hover:text-red-400">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
        {filtered.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Brain className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Awareness is the first step. What patterns run your mind?</p>
          </div>
        )}
      </div>
    </div>
  )
}

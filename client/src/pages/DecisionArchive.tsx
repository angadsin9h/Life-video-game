import { useState, useEffect } from 'react'
import { Star, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type DecisionSize = 'micro' | 'small' | 'medium' | 'major' | 'life-defining'
type DecisionOutcome = 'pending' | 'good' | 'great' | 'okay' | 'poor' | 'mixed'
type DecisionArea = 'career' | 'relationship' | 'financial' | 'health' | 'location' | 'education' | 'lifestyle' | 'spiritual' | 'creative' | 'other'

interface DecisionEntry {
  id: string
  decision: string
  size: DecisionSize
  outcome: DecisionOutcome
  area: DecisionArea
  options: string
  rationale: string
  alternatives: string
  whatWorried: string
  lessonLearned: string
  wouldRepeat: boolean
  confidenceAtTime: number
  satisfactionNow: number
  date: string
  createdAt: string
}

const SIZE_CONFIG: Record<DecisionSize, { label: string; emoji: string; color: string }> = {
  micro:         { label: 'Micro',         emoji: '🔹', color: '#94a3b8' },
  small:         { label: 'Small',         emoji: '🔸', color: '#f59e0b' },
  medium:        { label: 'Medium',        emoji: '🟡', color: '#f97316' },
  major:         { label: 'Major',         emoji: '🔴', color: '#ef4444' },
  'life-defining':{ label: 'Life-Defining',emoji: '💎', color: '#a855f7' },
}

const OUTCOME_CONFIG: Record<DecisionOutcome, { label: string; color: string }> = {
  pending: { label: 'Pending', color: '#94a3b8' },
  good:    { label: 'Good',    color: '#22c55e' },
  great:   { label: 'Great',   color: '#3b82f6' },
  okay:    { label: 'Okay',    color: '#f59e0b' },
  poor:    { label: 'Poor',    color: '#ef4444' },
  mixed:   { label: 'Mixed',   color: '#f97316' },
}

const AREA_CONFIG: Record<DecisionArea, { label: string; emoji: string }> = {
  career:       { label: 'Career',       emoji: '💼' },
  relationship: { label: 'Relationship', emoji: '❤️' },
  financial:    { label: 'Financial',    emoji: '💰' },
  health:       { label: 'Health',       emoji: '💪' },
  location:     { label: 'Location',     emoji: '🌍' },
  education:    { label: 'Education',    emoji: '📚' },
  lifestyle:    { label: 'Lifestyle',    emoji: '🌴' },
  spiritual:    { label: 'Spiritual',    emoji: '✨' },
  creative:     { label: 'Creative',     emoji: '🎨' },
  other:        { label: 'Other',        emoji: '🔮' },
}

const STORAGE_KEY = 'decision_archive'

export default function DecisionArchive() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<DecisionEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<DecisionEntry, 'id' | 'createdAt'>>({
    decision: '', size: 'medium', outcome: 'pending', area: 'career',
    options: '', rationale: '', alternatives: '', whatWorried: '', lessonLearned: '',
    wouldRepeat: true, confidenceAtTime: 7, satisfactionNow: 7,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: DecisionEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.decision.trim()) return
    const e: DecisionEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, decision: '', options: '', rationale: '', alternatives: '', whatWorried: '', lessonLearned: '' }))
    setShowForm(false)
    toastSuccess('Decision archived — wisdom comes from reflection 📊')
  }

  const great = entries.filter(e => e.outcome === 'great').length
  const lifeDefining = entries.filter(e => e.size === 'life-defining').length

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Star className="w-7 h-7 text-amber-400" />
            Decision Archive
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Archive major decisions to learn your decision patterns.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Archive
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Decisions</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-purple-400">{lifeDefining}</div>
          <div className="text-xs text-slate-500">Life-Defining</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-blue-400">{great}</div>
          <div className="text-xs text-slate-500">Great Outcomes</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-amber-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Archive Decision</h3>
          <input value={form.decision} onChange={e => setForm(f => ({ ...f, decision: e.target.value }))}
            placeholder="What was the decision? *" className="game-input w-full text-sm" autoFocus />
          <div className="flex gap-2">
            <select value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value as DecisionArea }))} className="game-input text-sm flex-1">
              {(Object.entries(AREA_CONFIG) as [DecisionArea, typeof AREA_CONFIG.career][]).map(([k, a]) => (
                <option key={k} value={k}>{a.emoji} {a.label}</option>
              ))}
            </select>
            <select value={form.size} onChange={e => setForm(f => ({ ...f, size: e.target.value as DecisionSize }))} className="game-input text-sm flex-1">
              {(Object.entries(SIZE_CONFIG) as [DecisionSize, typeof SIZE_CONFIG.medium][]).map(([k, s]) => (
                <option key={k} value={k}>{s.emoji} {s.label}</option>
              ))}
            </select>
          </div>
          <select value={form.outcome} onChange={e => setForm(f => ({ ...f, outcome: e.target.value as DecisionOutcome }))} className="game-input w-full text-sm">
            {(Object.entries(OUTCOME_CONFIG) as [DecisionOutcome, typeof OUTCOME_CONFIG.good][]).map(([k, o]) => (
              <option key={k} value={k}>{o.label}</option>
            ))}
          </select>
          <input value={form.options} onChange={e => setForm(f => ({ ...f, options: e.target.value }))}
            placeholder="Options you considered" className="game-input w-full text-sm" />
          <input value={form.rationale} onChange={e => setForm(f => ({ ...f, rationale: e.target.value }))}
            placeholder="Your rationale at the time" className="game-input w-full text-sm" />
          <input value={form.alternatives} onChange={e => setForm(f => ({ ...f, alternatives: e.target.value }))}
            placeholder="What were the alternatives?" className="game-input w-full text-sm" />
          <input value={form.whatWorried} onChange={e => setForm(f => ({ ...f, whatWorried: e.target.value }))}
            placeholder="What were you most worried about?" className="game-input w-full text-sm" />
          <input value={form.lessonLearned} onChange={e => setForm(f => ({ ...f, lessonLearned: e.target.value }))}
            placeholder="Key lesson from this decision" className="game-input w-full text-sm" />
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
              <input type="checkbox" checked={form.wouldRepeat}
                onChange={e => setForm(f => ({ ...f, wouldRepeat: e.target.checked }))} />
              Would make same decision again
            </label>
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Confidence then: {form.confidenceAtTime}/10</p>
              <input type="range" min={1} max={10} value={form.confidenceAtTime}
                onChange={e => setForm(f => ({ ...f, confidenceAtTime: Number(e.target.value) }))}
                className="w-full h-1 accent-amber-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Satisfaction now: {form.satisfactionNow}/10</p>
              <input type="range" min={1} max={10} value={form.satisfactionNow}
                onChange={e => setForm(f => ({ ...f, satisfactionNow: Number(e.target.value) }))}
                className="w-full h-1 accent-blue-400" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold">Archive Decision</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const s = SIZE_CONFIG[e.size]
          const o = OUTCOME_CONFIG[e.outcome]
          const a = AREA_CONFIG[e.area]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${s.color}` }}>
              <span className="text-2xl">{s.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-white">{e.decision}</span>
                  <span className="text-xs">{a.emoji}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: o.color + '20', color: o.color }}>{o.label}</span>
                  {e.wouldRepeat && <span className="text-xs text-green-400">✓ repeat</span>}
                </div>
                {e.rationale && <p className="text-xs text-slate-400 mt-1 line-clamp-2">{e.rationale}</p>}
                {e.lessonLearned && <p className="text-xs text-yellow-300/70 mt-0.5">💡 {e.lessonLearned}</p>}
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Star className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Good decisions come from experience. Archive yours.</p>
          </div>
        )}
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { Target, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type PostMortemType = 'achieved' | 'missed' | 'abandoned' | 'pivoted'
type GoalArea = 'health' | 'career' | 'finance' | 'relationships' | 'learning' | 'personal' | 'creative' | 'other'

interface GoalPostMortem {
  id: string
  type: PostMortemType
  area: GoalArea
  goalTitle: string
  originalTarget: string
  outcome: string
  whatWorked: string
  whatDidnt: string
  keyLesson: string
  wouldDoDifferently: string
  successScore: number
  timeframe: string
  effort: number
  createdAt: string
}

const TYPE_CONFIG: Record<PostMortemType, { label: string; emoji: string; color: string }> = {
  achieved:  { label: 'Achieved',  emoji: '✅', color: '#22c55e' },
  missed:    { label: 'Missed',    emoji: '❌', color: '#ef4444' },
  abandoned: { label: 'Abandoned', emoji: '🚫', color: '#f97316' },
  pivoted:   { label: 'Pivoted',   emoji: '🔄', color: '#f59e0b' },
}

const AREA_CONFIG: Record<GoalArea, { label: string; emoji: string; color: string }> = {
  health:        { label: 'Health',        emoji: '💪', color: '#22c55e' },
  career:        { label: 'Career',        emoji: '💼', color: '#3b82f6' },
  finance:       { label: 'Finance',       emoji: '💰', color: '#f59e0b' },
  relationships: { label: 'Relationships', emoji: '❤️', color: '#ec4899' },
  learning:      { label: 'Learning',      emoji: '📚', color: '#a855f7' },
  personal:      { label: 'Personal',      emoji: '🌟', color: '#6366f1' },
  creative:      { label: 'Creative',      emoji: '🎨', color: '#f97316' },
  other:         { label: 'Other',         emoji: '🎯', color: '#94a3b8' },
}

const STORAGE_KEY = 'goal_post_mortem'

export default function GoalPostMortem() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<GoalPostMortem[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<string>('all')
  const [form, setForm] = useState<Omit<GoalPostMortem, 'id' | 'createdAt'>>({
    type: 'achieved', area: 'personal', goalTitle: '', originalTarget: '', outcome: '',
    whatWorked: '', whatDidnt: '', keyLesson: '', wouldDoDifferently: '',
    successScore: 7, timeframe: '', effort: 5,
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: GoalPostMortem[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.goalTitle.trim()) return
    const e: GoalPostMortem = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, goalTitle: '', originalTarget: '', outcome: '', whatWorked: '', whatDidnt: '', keyLesson: '', wouldDoDifferently: '', timeframe: '' }))
    setShowForm(false)
    toastSuccess('Goal post-mortem saved 🎯')
  }

  const filtered = entries.filter(e => filterType === 'all' || e.type === filterType)
  const achieved = entries.filter(e => e.type === 'achieved').length
  const avgSuccess = entries.length > 0 ? Math.round(entries.reduce((s, e) => s + e.successScore, 0) / entries.length * 10) / 10 : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Target className="w-7 h-7 text-blue-400" />
            Goal Post-Mortem
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Analyze completed or abandoned goals to learn and improve.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Analyze
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Analyzed</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{achieved}</div>
          <div className="text-xs text-slate-500">Achieved</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-blue-400">{avgSuccess}/10</div>
          <div className="text-xs text-slate-500">Avg Score</div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilterType('all')}
          className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterType === 'all' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'bg-slate-800 text-slate-500'}`}>
          All
        </button>
        {(Object.entries(TYPE_CONFIG) as [PostMortemType, typeof TYPE_CONFIG.achieved][]).map(([k, t]) => (
          <button key={k} onClick={() => setFilterType(k)}
            className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterType === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
            style={filterType === k ? { background: t.color + '30', color: t.color } : {}}>
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-blue-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Goal Post-Mortem</h3>
          <div className="flex gap-2">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Outcome</p>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as PostMortemType }))} className="game-input w-full text-sm">
                {(Object.entries(TYPE_CONFIG) as [PostMortemType, typeof TYPE_CONFIG.achieved][]).map(([k, t]) => (
                  <option key={k} value={k}>{t.emoji} {t.label}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Area</p>
              <select value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value as GoalArea }))} className="game-input w-full text-sm">
                {(Object.entries(AREA_CONFIG) as [GoalArea, typeof AREA_CONFIG.health][]).map(([k, a]) => (
                  <option key={k} value={k}>{a.emoji} {a.label}</option>
                ))}
              </select>
            </div>
          </div>
          <input value={form.goalTitle} onChange={e => setForm(f => ({ ...f, goalTitle: e.target.value }))}
            placeholder="What was the goal? *" className="game-input w-full" autoFocus />
          <input value={form.originalTarget} onChange={e => setForm(f => ({ ...f, originalTarget: e.target.value }))}
            placeholder="Original target / metric" className="game-input w-full text-sm" />
          <input value={form.timeframe} onChange={e => setForm(f => ({ ...f, timeframe: e.target.value }))}
            placeholder="Timeframe (e.g., Q1 2024, 3 months)" className="game-input w-full text-sm" />
          <textarea value={form.outcome} onChange={e => setForm(f => ({ ...f, outcome: e.target.value }))}
            placeholder="What actually happened?" className="game-input w-full h-12 resize-none text-sm" />
          <textarea value={form.whatWorked} onChange={e => setForm(f => ({ ...f, whatWorked: e.target.value }))}
            placeholder="What worked well?" className="game-input w-full h-12 resize-none text-sm" />
          <textarea value={form.whatDidnt} onChange={e => setForm(f => ({ ...f, whatDidnt: e.target.value }))}
            placeholder="What didn't work?" className="game-input w-full h-12 resize-none text-sm" />
          <textarea value={form.keyLesson} onChange={e => setForm(f => ({ ...f, keyLesson: e.target.value }))}
            placeholder="Key lesson learned" className="game-input w-full h-12 resize-none text-sm" />
          <textarea value={form.wouldDoDifferently} onChange={e => setForm(f => ({ ...f, wouldDoDifferently: e.target.value }))}
            placeholder="What would you do differently?" className="game-input w-full h-12 resize-none text-sm" />
          <div className="flex gap-4">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Success score: {form.successScore}/10</p>
              <input type="range" min={0} max={10} value={form.successScore}
                onChange={e => setForm(f => ({ ...f, successScore: Number(e.target.value) }))}
                className="w-full h-1 accent-blue-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Effort level: {form.effort}/10</p>
              <input type="range" min={1} max={10} value={form.effort}
                onChange={e => setForm(f => ({ ...f, effort: Number(e.target.value) }))}
                className="w-full h-1 accent-yellow-400" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(e => {
          const t = TYPE_CONFIG[e.type]
          const a = AREA_CONFIG[e.area]
          const isExp = expanded === e.id
          return (
            <div key={e.id} className="game-card overflow-hidden" style={{ borderLeft: `3px solid ${t.color}` }}>
              <div className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isExp ? null : e.id)}>
                <span className="text-2xl">{t.emoji}</span>
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-white text-sm">{e.goalTitle}</span>
                  <p className="text-xs text-slate-500">{a.emoji} {a.label} · {t.label} · score {e.successScore}/10</p>
                </div>
                {isExp ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
              </div>
              {isExp && (
                <div className="border-t border-slate-800 p-3 space-y-1.5">
                  {e.originalTarget && <p className="text-xs text-slate-400">🎯 Target: {e.originalTarget}</p>}
                  {e.timeframe && <p className="text-xs text-slate-400">⏱ {e.timeframe}</p>}
                  {e.outcome && <p className="text-xs text-slate-300">📊 {e.outcome}</p>}
                  {e.whatWorked && <p className="text-xs text-green-300">✅ {e.whatWorked}</p>}
                  {e.whatDidnt && <p className="text-xs text-red-300">❌ {e.whatDidnt}</p>}
                  {e.keyLesson && <p className="text-xs text-yellow-300">💡 {e.keyLesson}</p>}
                  {e.wouldDoDifferently && <p className="text-xs text-blue-300">🔄 {e.wouldDoDifferently}</p>}
                  <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400 mt-1">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )
        })}
        {filtered.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Target className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Every goal, win or loss, is a learning opportunity. Analyze them.</p>
          </div>
        )}
      </div>
    </div>
  )
}

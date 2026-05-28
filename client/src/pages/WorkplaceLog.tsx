import { useState, useEffect } from 'react'
import { Briefcase, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type WorkEntryType = 'win' | 'challenge' | 'feedback' | 'meeting' | 'project' | '1on1' | 'conflict' | 'learning' | 'idea' | 'milestone'
type WorkSentiment = 'positive' | 'neutral' | 'negative' | 'mixed'

interface WorkEntry {
  id: string
  type: WorkEntryType
  sentiment: WorkSentiment
  title: string
  description: string
  people: string
  action: string
  impact: string
  lesson: string
  followUp: string
  date: string
  createdAt: string
}

const TYPE_CONFIG: Record<WorkEntryType, { label: string; emoji: string; color: string }> = {
  win:       { label: 'Win',       emoji: '🏆', color: '#f59e0b' },
  challenge: { label: 'Challenge', emoji: '⚡', color: '#ef4444' },
  feedback:  { label: 'Feedback',  emoji: '💬', color: '#3b82f6' },
  meeting:   { label: 'Meeting',   emoji: '👥', color: '#22c55e' },
  project:   { label: 'Project',   emoji: '📁', color: '#a855f7' },
  '1on1':    { label: '1-on-1',    emoji: '🤝', color: '#6366f1' },
  conflict:  { label: 'Conflict',  emoji: '⚔️', color: '#dc2626' },
  learning:  { label: 'Learning',  emoji: '📚', color: '#0ea5e9' },
  idea:      { label: 'Idea',      emoji: '💡', color: '#84cc16' },
  milestone: { label: 'Milestone', emoji: '🎯', color: '#f97316' },
}

const SENTIMENT_CONFIG: Record<WorkSentiment, { label: string; color: string }> = {
  positive: { label: 'Positive', color: '#22c55e' },
  neutral:  { label: 'Neutral',  color: '#94a3b8' },
  negative: { label: 'Negative', color: '#ef4444' },
  mixed:    { label: 'Mixed',    color: '#f59e0b' },
}

const STORAGE_KEY = 'workplace_log'

export default function WorkplaceLog() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<WorkEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<string>('all')
  const [form, setForm] = useState<Omit<WorkEntry, 'id' | 'createdAt'>>({
    type: 'win', sentiment: 'positive', title: '', description: '',
    people: '', action: '', impact: '', lesson: '', followUp: '',
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: WorkEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.title.trim()) return
    const e: WorkEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, title: '', description: '', people: '', action: '', impact: '', lesson: '', followUp: '' }))
    setShowForm(false)
    toastSuccess('Work entry logged 💼')
  }

  const filtered = entries.filter(e => filterType === 'all' || e.type === filterType)
  const wins = entries.filter(e => e.type === 'win').length
  const positives = entries.filter(e => e.sentiment === 'positive').length

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Briefcase className="w-7 h-7 text-blue-400" />
            Workplace Log
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Document wins, feedback, and workplace moments.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Entries</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">{wins}</div>
          <div className="text-xs text-slate-500">Wins</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{positives}</div>
          <div className="text-xs text-slate-500">Positive</div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilterType('all')}
          className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterType === 'all' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'bg-slate-800 text-slate-500'}`}>
          All
        </button>
        {(Object.entries(TYPE_CONFIG) as [WorkEntryType, typeof TYPE_CONFIG.win][]).map(([k, t]) => (
          <button key={k} onClick={() => setFilterType(k)}
            className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterType === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
            style={filterType === k ? { background: t.color + '30', color: t.color } : {}}>
            {t.emoji}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-blue-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Work Entry</h3>
          <div className="flex gap-2">
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as WorkEntryType }))} className="game-input text-sm flex-1">
              {(Object.entries(TYPE_CONFIG) as [WorkEntryType, typeof TYPE_CONFIG.win][]).map(([k, t]) => (
                <option key={k} value={k}>{t.emoji} {t.label}</option>
              ))}
            </select>
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              className="game-input text-sm flex-1" />
          </div>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Title *" className="game-input w-full" autoFocus />
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="What happened?" className="game-input w-full h-14 resize-none text-sm" />
          <div className="flex gap-2">
            <input value={form.people} onChange={e => setForm(f => ({ ...f, people: e.target.value }))}
              placeholder="People involved" className="game-input flex-1 text-sm" />
            <select value={form.sentiment} onChange={e => setForm(f => ({ ...f, sentiment: e.target.value as WorkSentiment }))} className="game-input text-sm">
              {(Object.entries(SENTIMENT_CONFIG) as [WorkSentiment, typeof SENTIMENT_CONFIG.positive][]).map(([k, s]) => (
                <option key={k} value={k}>{s.label}</option>
              ))}
            </select>
          </div>
          <input value={form.impact} onChange={e => setForm(f => ({ ...f, impact: e.target.value }))}
            placeholder="Impact / outcome..." className="game-input w-full text-sm" />
          <input value={form.action} onChange={e => setForm(f => ({ ...f, action: e.target.value }))}
            placeholder="Action taken or needed..." className="game-input w-full text-sm" />
          <input value={form.lesson} onChange={e => setForm(f => ({ ...f, lesson: e.target.value }))}
            placeholder="Lesson learned..." className="game-input w-full text-sm" />
          <input value={form.followUp} onChange={e => setForm(f => ({ ...f, followUp: e.target.value }))}
            placeholder="Follow-up needed?" className="game-input w-full text-sm" />
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(e => {
          const t = TYPE_CONFIG[e.type]
          const s = SENTIMENT_CONFIG[e.sentiment]
          const isExp = expanded === e.id
          return (
            <div key={e.id} className="game-card overflow-hidden" style={{ borderLeft: `3px solid ${t.color}` }}>
              <div className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isExp ? null : e.id)}>
                <span className="text-2xl">{t.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white text-sm truncate">{e.title}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: s.color + '20', color: s.color }}>{s.label}</span>
                  </div>
                  <p className="text-xs text-slate-500">{t.label} · {e.date}{e.people && ` · ${e.people}`}</p>
                </div>
                {isExp ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
              </div>
              {isExp && (
                <div className="border-t border-slate-800 p-3 space-y-1.5">
                  {e.description && <p className="text-xs text-slate-300">{e.description}</p>}
                  {e.impact && <p className="text-xs text-blue-300">📊 {e.impact}</p>}
                  {e.action && <p className="text-xs text-yellow-300">⚡ {e.action}</p>}
                  {e.lesson && <p className="text-xs text-green-300">📖 {e.lesson}</p>}
                  {e.followUp && <p className="text-xs text-orange-300">🔔 Follow-up: {e.followUp}</p>}
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
            <Briefcase className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Document your workplace journey — wins, lessons, and growth.</p>
          </div>
        )}
      </div>
    </div>
  )
}

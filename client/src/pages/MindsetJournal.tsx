import { useState, useEffect } from 'react'
import { Brain, Plus, Trash2, ChevronLeft, ChevronRight, Lightbulb } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface MindsetEntry {
  id: string
  date: string
  type: 'reframe' | 'belief' | 'lesson' | 'win' | 'obstacle'
  situation: string
  old_thought: string
  new_thought: string
  evidence: string
  action: string
}

const ENTRY_TYPES = [
  { value: 'reframe' as const, label: 'Cognitive Reframe', emoji: '🔄', desc: 'Change a negative thought pattern', color: '#8b5cf6' },
  { value: 'belief' as const, label: 'Limiting Belief', emoji: '🚧', desc: 'Challenge a belief holding you back', color: '#ef4444' },
  { value: 'lesson' as const, label: 'Lesson Learned', emoji: '📚', desc: 'Extract wisdom from an experience', color: '#3b82f6' },
  { value: 'win' as const, label: 'Mental Win', emoji: '🏆', desc: 'Record a mindset victory', color: '#22c55e' },
  { value: 'obstacle' as const, label: 'Obstacle Solved', emoji: '🧩', desc: 'How you overcame a mental block', color: '#f97316' },
]

const PROMPTS: Record<string, { situation: string; old: string; new_: string; evidence: string; action: string }> = {
  reframe: {
    situation: 'What situation triggered the negative thought?',
    old: 'What was your initial (unhelpful) thought?',
    new_: 'What\'s a more balanced, helpful way to see this?',
    evidence: 'What evidence supports the new perspective?',
    action: 'What will you do differently based on this reframe?',
  },
  belief: {
    situation: 'What limiting belief did you catch yourself having?',
    old: 'How does this belief hold you back?',
    new_: 'What empowering belief can replace it?',
    evidence: 'What proof exists that the new belief is true?',
    action: 'What one action will you take to reinforce the new belief?',
  },
  lesson: {
    situation: 'What happened? Describe the situation.',
    old: 'What was your first reaction or takeaway?',
    new_: 'What is the deeper lesson you can carry forward?',
    evidence: 'How does this lesson connect to your goals?',
    action: 'How will you apply this lesson going forward?',
  },
  win: {
    situation: 'What situation did you face that tested your mindset?',
    old: 'What was the tempting negative response?',
    new_: 'What did you choose to think/do instead?',
    evidence: 'What was the positive outcome?',
    action: 'How will you replicate this win?',
  },
  obstacle: {
    situation: 'What mental obstacle were you facing?',
    old: 'How was it stopping you?',
    new_: 'How did you shift your thinking?',
    evidence: 'What breakthrough occurred?',
    action: 'What\'s the next step now that you\'ve cleared this?',
  },
}

const STORAGE_KEY = 'mindset_journal'

function loadEntries(): MindsetEntry[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
}
function saveEntries(entries: MindsetEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}

export default function MindsetJournal() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<MindsetEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState<string | null>(null)
  const [form, setForm] = useState<Omit<MindsetEntry, 'id' | 'date'>>({
    type: 'reframe', situation: '', old_thought: '', new_thought: '', evidence: '', action: '',
  })

  useEffect(() => { setEntries(loadEntries()) }, [])

  const today = new Date().toISOString().split('T')[0]

  const submit = () => {
    if (!form.situation.trim() || !form.new_thought.trim()) return
    const entry: MindsetEntry = { id: Date.now().toString(), date: today, ...form }
    const updated = [entry, ...loadEntries()]
    saveEntries(updated)
    setEntries(updated)
    setForm({ type: 'reframe', situation: '', old_thought: '', new_thought: '', evidence: '', action: '' })
    setShowForm(false)
    toastSuccess('Mindset entry saved!')
  }

  const remove = (id: string) => {
    const updated = entries.filter(e => e.id !== id)
    saveEntries(updated)
    setEntries(updated)
  }

  const typeConf = ENTRY_TYPES.find(t => t.value === form.type)!
  const prompts = PROMPTS[form.type]
  const displayed = filter ? entries.filter(e => e.type === filter) : entries

  // Stats
  const streak = (() => {
    const dateSet = new Set(entries.map(e => e.date))
    let s = 0
    for (let i = 0; i < 365; i++) {
      const d = new Date(); d.setDate(d.getDate() - i)
      if (dateSet.has(d.toISOString().split('T')[0])) s++
      else if (i > 0) break
    }
    return s
  })()

  const byType = ENTRY_TYPES.map(t => ({ ...t, count: entries.filter(e => e.type === t.value).length }))

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Brain className="w-7 h-7 text-violet-400" />
            Mindset Journal
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Rewire your thinking patterns</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-3 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-semibold transition-colors">
          <Plus className="w-4 h-4" /> New Entry
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Total Entries</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-violet-400">{streak}d</div>
          <div className="text-xs text-slate-500">Streak</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-green-400">{entries.filter(e => e.type === 'win').length}</div>
          <div className="text-xs text-slate-500">Mental Wins</div>
        </div>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="game-card p-5 space-y-4 border border-violet-500/20">
          <h3 className="font-semibold text-slate-300 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-yellow-400" /> New Mindset Entry
          </h3>
          <div className="flex flex-wrap gap-2">
            {ENTRY_TYPES.map(t => (
              <button key={t.value} onClick={() => setForm(f => ({ ...f, type: t.value }))}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={form.type === t.value
                  ? { background: t.color + '33', color: t.color, border: `1px solid ${t.color}` }
                  : { background: '#1e293b', color: '#94a3b8' }
                }>
                {t.emoji} {t.label}
              </button>
            ))}
          </div>
          <div className="space-y-3">
            {[
              { key: 'situation', label: prompts.situation, multiline: true },
              { key: 'old_thought', label: prompts.old, multiline: false },
              { key: 'new_thought', label: prompts.new_, multiline: true },
              { key: 'evidence', label: prompts.evidence, multiline: false },
              { key: 'action', label: prompts.action, multiline: false },
            ].map(field => (
              <div key={field.key}>
                <label className="text-xs text-slate-400 mb-1 block" style={{ color: typeConf.color }}>{field.label}</label>
                {field.multiline ? (
                  <textarea value={(form as any)[field.key]} onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                    className="game-input w-full h-20 resize-none" />
                ) : (
                  <input value={(form as any)[field.key]} onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                    className="game-input w-full" />
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 text-white rounded-xl text-sm font-semibold transition-colors" style={{ background: typeConf.color }}>
              Save Entry
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-400 rounded-xl text-sm transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Type filter */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setFilter(null)}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${!filter ? 'bg-violet-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}>
          All ({entries.length})
        </button>
        {byType.filter(t => t.count > 0).map(t => (
          <button key={t.value} onClick={() => setFilter(filter === t.value ? null : t.value)}
            className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
            style={filter === t.value
              ? { background: t.color + '33', color: t.color, border: `1px solid ${t.color}` }
              : { background: '#1e293b', color: '#94a3b8' }
            }>
            {t.emoji} {t.label} ({t.count})
          </button>
        ))}
      </div>

      {/* Entries */}
      <div className="space-y-3">
        {displayed.map(e => {
          const type = ENTRY_TYPES.find(t => t.value === e.type)!
          return (
            <div key={e.id} className="game-card p-4 space-y-3" style={{ borderLeft: `3px solid ${type.color}` }}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{type.emoji}</span>
                  <div>
                    <span className="text-xs font-semibold" style={{ color: type.color }}>{type.label}</span>
                    <div className="text-xs text-slate-600">{e.date}</div>
                  </div>
                </div>
                <button onClick={() => remove(e.id)} className="p-1 text-slate-600 hover:text-red-400 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="space-y-2 text-sm">
                <p className="text-slate-400"><span className="text-slate-500 text-xs">Situation: </span>{e.situation}</p>
                {e.old_thought && <p className="text-slate-500 text-xs line-through">{e.old_thought}</p>}
                <p className="text-slate-200 font-medium">→ {e.new_thought}</p>
                {e.evidence && <p className="text-slate-500 text-xs">Evidence: {e.evidence}</p>}
                {e.action && (
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: type.color }}>
                    <ChevronRight className="w-3 h-3" />
                    Action: {e.action}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {entries.length === 0 && !showForm && (
        <div className="text-center py-16 text-slate-500">
          <Brain className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="mb-3">No mindset entries yet.</p>
          <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-semibold transition-colors">
            Start reframing
          </button>
        </div>
      )}
    </div>
  )
}

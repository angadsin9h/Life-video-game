import { useState, useEffect } from 'react'
import { Heart, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type HealingPhase = 'denial' | 'anger' | 'bargaining' | 'depression' | 'acceptance' | 'growth' | 'healed'
type EntryType = 'feeling' | 'memory' | 'lesson' | 'letter' | 'gratitude' | 'boundary' | 'no-contact' | 'milestone' | 'affirmation'

interface BreakupEntry {
  id: string
  phase: HealingPhase
  type: EntryType
  title: string
  content: string
  pain: number
  hope: number
  date: string
  createdAt: string
}

const PHASE_CONFIG: Record<HealingPhase, { label: string; emoji: string; color: string }> = {
  denial:     { label: 'Denial',      emoji: '😶', color: '#94a3b8' },
  anger:      { label: 'Anger',       emoji: '😤', color: '#ef4444' },
  bargaining: { label: 'Bargaining',  emoji: '🙏', color: '#f97316' },
  depression: { label: 'Depression',  emoji: '💙', color: '#3b82f6' },
  acceptance: { label: 'Acceptance',  emoji: '🌿', color: '#22c55e' },
  growth:     { label: 'Growth',      emoji: '🌱', color: '#a855f7' },
  healed:     { label: 'Healed',      emoji: '✨', color: '#f59e0b' },
}

const TYPE_CONFIG: Record<EntryType, { label: string; emoji: string }> = {
  feeling:      { label: 'Feeling',        emoji: '💭' },
  memory:       { label: 'Memory',         emoji: '📸' },
  lesson:       { label: 'Lesson',         emoji: '📖' },
  letter:       { label: 'Letter',         emoji: '✉️' },
  gratitude:    { label: 'Gratitude',      emoji: '🙏' },
  boundary:     { label: 'Boundary',       emoji: '🛡️' },
  'no-contact': { label: 'No Contact',     emoji: '✅' },
  milestone:    { label: 'Milestone',      emoji: '🎯' },
  affirmation:  { label: 'Affirmation',    emoji: '⭐' },
}

const STORAGE_KEY = 'breakup_journal'

export default function BreakupJournal() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<BreakupEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filterPhase, setFilterPhase] = useState<string>('all')
  const [form, setForm] = useState<Omit<BreakupEntry, 'id' | 'createdAt'>>({
    phase: 'anger', type: 'feeling', title: '', content: '',
    pain: 7, hope: 3, date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: BreakupEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.content.trim()) return
    const e: BreakupEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, title: '', content: '' }))
    setShowForm(false)
    toastSuccess('Entry saved 💙')
  }

  const filtered = entries.filter(e => filterPhase === 'all' || e.phase === filterPhase)
  const avgHope = entries.length > 0 ? Math.round(entries.reduce((s, e) => s + e.hope, 0) / entries.length * 10) / 10 : 0
  const milestones = entries.filter(e => e.type === 'milestone').length

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Heart className="w-7 h-7 text-blue-400" />
            Healing Journal
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Process heartbreak and journey toward healing.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Write
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Entries</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{avgHope}</div>
          <div className="text-xs text-slate-500">Avg Hope</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">{milestones}</div>
          <div className="text-xs text-slate-500">Milestones</div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilterPhase('all')}
          className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterPhase === 'all' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'bg-slate-800 text-slate-500'}`}>
          All
        </button>
        {(Object.entries(PHASE_CONFIG) as [HealingPhase, typeof PHASE_CONFIG.denial][]).map(([k, p]) => (
          <button key={k} onClick={() => setFilterPhase(k)}
            className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterPhase === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
            style={filterPhase === k ? { background: p.color + '30', color: p.color } : {}}>
            {p.emoji}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-blue-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Write Entry</h3>
          <div className="flex gap-2">
            <select value={form.phase} onChange={e => setForm(f => ({ ...f, phase: e.target.value as HealingPhase }))} className="game-input text-sm flex-1">
              {(Object.entries(PHASE_CONFIG) as [HealingPhase, typeof PHASE_CONFIG.denial][]).map(([k, p]) => (
                <option key={k} value={k}>{p.emoji} {p.label}</option>
              ))}
            </select>
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as EntryType }))} className="game-input text-sm flex-1">
              {(Object.entries(TYPE_CONFIG) as [EntryType, typeof TYPE_CONFIG.feeling][]).map(([k, t]) => (
                <option key={k} value={k}>{t.emoji} {t.label}</option>
              ))}
            </select>
          </div>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Title (optional)" className="game-input w-full text-sm" />
          <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
            placeholder="Write freely... *" className="game-input w-full h-20 resize-none" autoFocus />
          <div className="flex gap-3">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Pain: {form.pain}/10</p>
              <input type="range" min={1} max={10} value={form.pain}
                onChange={e => setForm(f => ({ ...f, pain: Number(e.target.value) }))}
                className="w-full h-1 accent-red-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Hope: {form.hope}/10</p>
              <input type="range" min={1} max={10} value={form.hope}
                onChange={e => setForm(f => ({ ...f, hope: Number(e.target.value) }))}
                className="w-full h-1 accent-green-400" />
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
          const p = PHASE_CONFIG[e.phase]
          const t = TYPE_CONFIG[e.type]
          const isExp = expanded === e.id
          return (
            <div key={e.id} className="game-card overflow-hidden" style={{ borderLeft: `3px solid ${p.color}` }}>
              <div className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isExp ? null : e.id)}>
                <span className="text-xl">{t.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white text-sm truncate">{e.title || e.content.slice(0, 40)}</p>
                  <p className="text-xs text-slate-500">{p.emoji} {p.label} · Pain {e.pain} · Hope {e.hope} · {e.date}</p>
                </div>
                {isExp ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
              </div>
              {isExp && (
                <div className="border-t border-slate-800 p-3 space-y-1.5">
                  <p className="text-xs text-slate-300 whitespace-pre-line">{e.content}</p>
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
            <Heart className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Healing is not linear. Be gentle with yourself.</p>
          </div>
        )}
      </div>
    </div>
  )
}

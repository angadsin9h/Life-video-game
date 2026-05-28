import { useState, useEffect } from 'react'
import { Scroll, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type WisdomSource = 'book' | 'mentor' | 'experience' | 'conversation' | 'meditation' | 'nature' | 'failure' | 'success' | 'travel' | 'other'

interface WisdomEntry {
  id: string
  source: WisdomSource
  title: string
  wisdom: string
  context: string
  author: string
  howApply: string
  resonance: number
  isMasterLesson: boolean
  tags: string[]
  date: string
  createdAt: string
}

const SOURCE_CONFIG: Record<WisdomSource, { label: string; emoji: string; color: string }> = {
  book:         { label: 'Book',         emoji: '📚', color: '#3b82f6' },
  mentor:       { label: 'Mentor',       emoji: '👨‍🏫', color: '#22c55e' },
  experience:   { label: 'Experience',   emoji: '🌱', color: '#f59e0b' },
  conversation: { label: 'Conversation', emoji: '💬', color: '#a855f7' },
  meditation:   { label: 'Meditation',   emoji: '🧘', color: '#6366f1' },
  nature:       { label: 'Nature',       emoji: '🌿', color: '#84cc16' },
  failure:      { label: 'Failure',      emoji: '💔', color: '#ef4444' },
  success:      { label: 'Success',      emoji: '🏆', color: '#f97316' },
  travel:       { label: 'Travel',       emoji: '✈️', color: '#0ea5e9' },
  other:        { label: 'Other',        emoji: '💡', color: '#94a3b8' },
}

const STORAGE_KEY = 'wisdom_log'

export default function WisdomLog() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<WisdomEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [filterSource, setFilterSource] = useState<string>('all')
  const [newTag, setNewTag] = useState('')
  const [form, setForm] = useState<Omit<WisdomEntry, 'id' | 'createdAt'>>({
    source: 'experience', title: '', wisdom: '', context: '', author: '',
    howApply: '', resonance: 8, isMasterLesson: false, tags: [],
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: WisdomEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.wisdom.trim()) return
    const e: WisdomEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, title: '', wisdom: '', context: '', author: '', howApply: '', tags: [] }))
    setNewTag('')
    setShowForm(false)
    toastSuccess('Wisdom captured 📜')
  }

  const filtered = entries.filter(e => filterSource === 'all' || e.source === filterSource)
  const masterLessons = entries.filter(e => e.isMasterLesson).length
  const avgResonance = entries.length ? Math.round(entries.reduce((s, e) => s + e.resonance, 0) / entries.length) : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Scroll className="w-7 h-7 text-amber-400" />
            Wisdom Log
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Capture and revisit life's most important lessons.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Capture
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Lessons</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-amber-400">{masterLessons}</div>
          <div className="text-xs text-slate-500">Master Lessons</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-indigo-400">{avgResonance}/10</div>
          <div className="text-xs text-slate-500">Avg Depth</div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilterSource('all')}
          className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterSource === 'all' ? 'bg-amber-600/20 text-amber-400 border border-amber-500/30' : 'bg-slate-800 text-slate-500'}`}>
          All
        </button>
        {(Object.entries(SOURCE_CONFIG) as [WisdomSource, typeof SOURCE_CONFIG.book][]).map(([k, c]) => (
          <button key={k} onClick={() => setFilterSource(k)}
            className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterSource === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
            style={filterSource === k ? { background: c.color + '30', color: c.color } : {}}>
            {c.emoji}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-amber-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Capture Wisdom</h3>
          <select value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value as WisdomSource }))} className="game-input w-full text-sm">
            {(Object.entries(SOURCE_CONFIG) as [WisdomSource, typeof SOURCE_CONFIG.book][]).map(([k, c]) => (
              <option key={k} value={k}>{c.emoji} {c.label}</option>
            ))}
          </select>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Short title or headline" className="game-input w-full" autoFocus />
          <textarea value={form.wisdom} onChange={e => setForm(f => ({ ...f, wisdom: e.target.value }))}
            placeholder="The wisdom / lesson * (in your own words)" className="game-input w-full h-16 resize-none text-sm" />
          <input value={form.context} onChange={e => setForm(f => ({ ...f, context: e.target.value }))}
            placeholder="Context: what situation taught you this?" className="game-input w-full text-sm" />
          <input value={form.author} onChange={e => setForm(f => ({ ...f, author: e.target.value }))}
            placeholder="Source/author (if from book or mentor)" className="game-input w-full text-sm" />
          <input value={form.howApply} onChange={e => setForm(f => ({ ...f, howApply: e.target.value }))}
            placeholder="How will you apply this?" className="game-input w-full text-sm" />
          <div className="flex gap-2">
            <input value={newTag} onChange={e => setNewTag(e.target.value)}
              placeholder="Tag..." className="game-input flex-1 text-sm"
              onKeyDown={e => { if (e.key === 'Enter' && newTag.trim()) { setForm(f => ({ ...f, tags: [...f.tags, newTag.trim()] })); setNewTag('') } }} />
            <button onClick={() => { if (newTag.trim()) { setForm(f => ({ ...f, tags: [...f.tags, newTag.trim()] })); setNewTag('') } }}
              className="px-3 py-1.5 bg-amber-700/30 text-amber-400 rounded-xl text-xs">+Tag</button>
          </div>
          {form.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {form.tags.map((t, i) => (
                <span key={i} className="flex items-center gap-1 px-2 py-0.5 bg-amber-900/30 text-amber-300 rounded-full text-xs">
                  #{t}
                  <button onClick={() => setForm(fo => ({ ...fo, tags: fo.tags.filter((_, j) => j !== i) }))} className="hover:text-white">×</button>
                </span>
              ))}
            </div>
          )}
          <div className="flex gap-3 items-center">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Resonance / depth: {form.resonance}/10</p>
              <input type="range" min={1} max={10} value={form.resonance}
                onChange={e => setForm(f => ({ ...f, resonance: Number(e.target.value) }))}
                className="w-full h-1 accent-amber-400" />
            </div>
            <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
              <input type="checkbox" checked={form.isMasterLesson} onChange={e => setForm(f => ({ ...f, isMasterLesson: e.target.checked }))} />
              Master Lesson
            </label>
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(e => {
          const s = SOURCE_CONFIG[e.source]
          return (
            <div key={e.id} className="game-card p-3" style={{ borderLeft: `3px solid ${s.color}` }}>
              <div className="flex items-start gap-3">
                <span className="text-2xl">{s.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {e.title && <span className="text-sm font-medium text-white">{e.title}</span>}
                    {e.isMasterLesson && <span className="text-xs text-amber-400">★ Master</span>}
                  </div>
                  <p className="text-xs text-slate-300 mt-1 italic">"{e.wisdom}"</p>
                  {e.author && <p className="text-xs text-slate-500 mt-0.5">— {e.author}</p>}
                  {e.howApply && <p className="text-xs text-green-300 mt-0.5">→ {e.howApply}</p>}
                  {e.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {e.tags.map((t, i) => <span key={i} className="text-xs text-slate-600">#{t}</span>)}
                    </div>
                  )}
                </div>
                <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Scroll className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Every experience holds wisdom. Write it down before it fades.</p>
          </div>
        )}
      </div>
    </div>
  )
}

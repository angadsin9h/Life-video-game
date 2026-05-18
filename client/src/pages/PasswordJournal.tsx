import { useState, useEffect } from 'react'
import { FileText, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type JournalMood = 'great' | 'good' | 'okay' | 'rough' | 'terrible'
type JournalType = 'free-write' | 'gratitude' | 'reflection' | 'vent' | 'planning' | 'creative' | 'therapy'

interface JournalEntry {
  id: string
  date: string
  type: JournalType
  mood: JournalMood
  title: string
  content: string
  wordCount: number
  tags: string
  isPrivate: boolean
  createdAt: string
}

const MOOD_CONFIG: Record<JournalMood, { label: string; emoji: string; color: string }> = {
  great:    { label: 'Great',    emoji: '😄', color: '#22c55e' },
  good:     { label: 'Good',     emoji: '🙂', color: '#84cc16' },
  okay:     { label: 'Okay',     emoji: '😐', color: '#f59e0b' },
  rough:    { label: 'Rough',    emoji: '😔', color: '#f97316' },
  terrible: { label: 'Terrible', emoji: '😢', color: '#ef4444' },
}

const TYPE_CONFIG: Record<JournalType, { label: string; emoji: string; color: string }> = {
  'free-write': { label: 'Free Write',  emoji: '✍️', color: '#6366f1' },
  gratitude:    { label: 'Gratitude',   emoji: '🙏', color: '#22c55e' },
  reflection:   { label: 'Reflection',  emoji: '🌀', color: '#3b82f6' },
  vent:         { label: 'Vent',        emoji: '💭', color: '#ef4444' },
  planning:     { label: 'Planning',    emoji: '📋', color: '#f59e0b' },
  creative:     { label: 'Creative',    emoji: '🎨', color: '#a855f7' },
  therapy:      { label: 'Therapy',     emoji: '🧠', color: '#ec4899' },
}

const STORAGE_KEY = 'private_journal'

export default function PasswordJournal() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [filterType, setFilterType] = useState<string>('all')
  const [viewEntry, setViewEntry] = useState<JournalEntry | null>(null)
  const [form, setForm] = useState<Omit<JournalEntry, 'id' | 'createdAt' | 'wordCount'>>({
    date: new Date().toISOString().split('T')[0],
    type: 'free-write', mood: 'good', title: '', content: '', tags: '', isPrivate: false,
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: JournalEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.content.trim()) return
    const wordCount = form.content.trim().split(/\s+/).length
    const e: JournalEntry = { id: Date.now().toString(), ...form, wordCount, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm({ date: new Date().toISOString().split('T')[0], type: 'free-write', mood: 'good', title: '', content: '', tags: '', isPrivate: false })
    setShowForm(false)
    toastSuccess(`Journal entry saved — ${wordCount} words ✍️`)
  }

  const filtered = entries.filter(e => filterType === 'all' || e.type === filterType)
  const totalWords = entries.reduce((s, e) => s + e.wordCount, 0)

  if (viewEntry) {
    const t = TYPE_CONFIG[viewEntry.type]
    const m = MOOD_CONFIG[viewEntry.mood]
    return (
      <div className="space-y-4 max-w-lg mx-auto">
        <div className="flex items-center gap-3">
          <button onClick={() => setViewEntry(null)} className="text-slate-400 hover:text-white text-sm">← Back</button>
          <span className="text-xs text-slate-500">{viewEntry.date}</span>
        </div>
        <div className="game-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">{m.emoji}</span>
            <div>
              {viewEntry.title && <h2 className="text-white font-semibold">{viewEntry.title}</h2>}
              <p className="text-xs text-slate-500">{t.label} · {m.label} · {viewEntry.wordCount} words</p>
            </div>
          </div>
          <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{viewEntry.content}</p>
          {viewEntry.tags && <p className="text-xs text-slate-600 mt-3">🏷️ {viewEntry.tags}</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <FileText className="w-7 h-7 text-indigo-400" />
            Private Journal
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Your private space to write freely.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-700 hover:bg-indigo-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Write
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Entries</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-indigo-400">{totalWords.toLocaleString()}</div>
          <div className="text-xs text-slate-500">Words</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">{entries.filter(e => new Date(e.date) >= new Date(Date.now() - 7 * 86400000)).length}</div>
          <div className="text-xs text-slate-500">This Week</div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilterType('all')}
          className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterType === 'all' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'bg-slate-800 text-slate-500'}`}>
          All
        </button>
        {Object.entries(TYPE_CONFIG).map(([k, t]) => (
          <button key={k} onClick={() => setFilterType(k)}
            className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterType === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
            style={filterType === k ? { background: t.color + '30', color: t.color } : {}}>
            {t.emoji}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-indigo-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">New Entry</h3>
          <div className="flex gap-2">
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="game-input text-sm" />
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as JournalType }))} className="game-input text-sm flex-1">
              {(Object.entries(TYPE_CONFIG) as [JournalType, typeof TYPE_CONFIG['free-write']][]).map(([k, t]) => (
                <option key={k} value={k}>{t.emoji} {t.label}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            {(Object.entries(MOOD_CONFIG) as [JournalMood, typeof MOOD_CONFIG.good][]).map(([k, m]) => (
              <button key={k} onClick={() => setForm(f => ({ ...f, mood: k }))}
                className={`flex-1 py-1.5 rounded-xl text-base ${form.mood === k ? 'bg-slate-700 ring-2' : 'bg-slate-800'}`}
                style={form.mood === k ? { outline: `2px solid ${m.color}` } : {}}>
                {m.emoji}
              </button>
            ))}
          </div>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Title (optional)" className="game-input w-full text-sm" />
          <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
            placeholder="Write freely... *" className="game-input w-full h-40 resize-none text-sm" autoFocus />
          <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
            placeholder="Tags (optional)" className="game-input w-full text-sm" />
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-indigo-700 hover:bg-indigo-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        {filtered.map(e => {
          const t = TYPE_CONFIG[e.type]
          const m = MOOD_CONFIG[e.mood]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3 cursor-pointer hover:bg-slate-800/70"
              style={{ borderLeft: `3px solid ${t.color}` }}
              onClick={() => setViewEntry(e)}>
              <span className="text-xl">{m.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">{e.title || e.date}</span>
                  <span className="text-xs text-slate-500">{e.wordCount}w</span>
                </div>
                <p className="text-xs text-slate-500 truncate">{e.content.slice(0, 80)}...</p>
              </div>
              <button onClick={ev => { ev.stopPropagation(); save(entries.filter(x => x.id !== e.id)) }} className="text-slate-700 hover:text-red-400 flex-shrink-0">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {filtered.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Write your thoughts. This space belongs to you.</p>
          </div>
        )}
      </div>
    </div>
  )
}

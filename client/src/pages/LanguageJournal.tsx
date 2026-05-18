import { useState, useEffect } from 'react'
import { BookOpen, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type EntryType = 'vocabulary' | 'grammar' | 'phrase' | 'conversation' | 'reading' | 'listening' | 'goal' | 'reflection'

interface LangEntry {
  id: string
  language: string
  type: EntryType
  content: string
  translation: string
  example: string
  difficulty: number
  mastery: number
  tags: string
  createdAt: string
}

const TYPE_CONFIG: Record<EntryType, { label: string; emoji: string; color: string }> = {
  vocabulary:   { label: 'Vocabulary',  emoji: '📝', color: '#6366f1' },
  grammar:      { label: 'Grammar',     emoji: '📐', color: '#f59e0b' },
  phrase:       { label: 'Phrase',      emoji: '💬', color: '#22c55e' },
  conversation: { label: 'Conversation',emoji: '🗣️', color: '#3b82f6' },
  reading:      { label: 'Reading',     emoji: '📖', color: '#a855f7' },
  listening:    { label: 'Listening',   emoji: '👂', color: '#ec4899' },
  goal:         { label: 'Goal',        emoji: '🎯', color: '#f97316' },
  reflection:   { label: 'Reflection',  emoji: '🌀', color: '#94a3b8' },
}

const STORAGE_KEY = 'language_journal'

export default function LanguageJournal() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<LangEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filterLang, setFilterLang] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [form, setForm] = useState<Omit<LangEntry, 'id' | 'createdAt'>>({
    language: '', type: 'vocabulary', content: '', translation: '',
    example: '', difficulty: 3, mastery: 1, tags: '',
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: LangEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.content.trim() || !form.language.trim()) return
    const e: LangEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, content: '', translation: '', example: '', tags: '' }))
    setShowForm(false)
    toastSuccess(`${form.language} entry added 📚`)
  }

  const languages = [...new Set(entries.map(e => e.language))].filter(Boolean)
  const filtered = entries.filter(e =>
    (filterLang === 'all' || e.language === filterLang) &&
    (filterType === 'all' || e.type === filterType)
  )
  const mastered = entries.filter(e => e.mastery >= 4).length

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <BookOpen className="w-7 h-7 text-violet-400" />
            Language Journal
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track vocabulary, phrases, and language progress.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-violet-700 hover:bg-violet-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Entries</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-violet-400">{languages.length}</div>
          <div className="text-xs text-slate-500">Languages</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{mastered}</div>
          <div className="text-xs text-slate-500">Mastered</div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilterLang('all')}
          className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterLang === 'all' ? 'bg-violet-600/20 text-violet-400 border border-violet-500/30' : 'bg-slate-800 text-slate-500'}`}>
          All
        </button>
        {languages.map(l => (
          <button key={l} onClick={() => setFilterLang(l)}
            className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterLang === l ? 'bg-violet-600/20 text-violet-400 border border-violet-500/30' : 'bg-slate-800 text-slate-500'}`}>
            {l}
          </button>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilterType('all')}
          className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap bg-slate-800 ${filterType === 'all' ? 'text-white' : 'text-slate-500'}`}>
          All types
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
        <div className="game-card p-4 border border-violet-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Add Entry</h3>
          <div className="flex gap-2">
            <input value={form.language} onChange={e => setForm(f => ({ ...f, language: e.target.value }))}
              placeholder="Language *" className="game-input flex-1" autoFocus
              list="lang-suggestions" />
            <datalist id="lang-suggestions">
              <option value="Spanish" /><option value="French" /><option value="German" /><option value="Japanese" />
              <option value="Mandarin" /><option value="Italian" /><option value="Portuguese" /><option value="Korean" />
            </datalist>
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as EntryType }))} className="game-input text-sm flex-1">
              {(Object.entries(TYPE_CONFIG) as [EntryType, typeof TYPE_CONFIG.vocabulary][]).map(([k, t]) => (
                <option key={k} value={k}>{t.emoji} {t.label}</option>
              ))}
            </select>
          </div>
          <input value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
            placeholder="Word / phrase / grammar rule *" className="game-input w-full" />
          <input value={form.translation} onChange={e => setForm(f => ({ ...f, translation: e.target.value }))}
            placeholder="Translation / meaning" className="game-input w-full text-sm" />
          <input value={form.example} onChange={e => setForm(f => ({ ...f, example: e.target.value }))}
            placeholder="Example sentence" className="game-input w-full text-sm" />
          <div className="flex gap-3">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Difficulty: {form.difficulty}/5</p>
              <input type="range" min={1} max={5} value={form.difficulty}
                onChange={e => setForm(f => ({ ...f, difficulty: Number(e.target.value) }))}
                className="w-full h-1 accent-red-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Mastery: {form.mastery}/5</p>
              <input type="range" min={1} max={5} value={form.mastery}
                onChange={e => setForm(f => ({ ...f, mastery: Number(e.target.value) }))}
                className="w-full h-1 accent-green-400" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-violet-700 hover:bg-violet-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(e => {
          const t = TYPE_CONFIG[e.type]
          const isExp = expanded === e.id
          return (
            <div key={e.id} className="game-card overflow-hidden" style={{ borderLeft: `3px solid ${t.color}` }}>
              <div className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isExp ? null : e.id)}>
                <span className="text-2xl">{t.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white text-sm truncate">{e.content}</span>
                    <span className="text-xs px-1.5 py-0.5 bg-slate-700 text-slate-400 rounded">{e.language}</span>
                  </div>
                  {e.translation && <p className="text-xs text-slate-400 truncate">{e.translation}</p>}
                  <p className="text-xs text-slate-600">Mastery: {'★'.repeat(e.mastery)}{'☆'.repeat(5 - e.mastery)}</p>
                </div>
                {isExp ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
              </div>
              {isExp && (
                <div className="border-t border-slate-800 p-3 space-y-1.5">
                  {e.example && <p className="text-xs text-slate-300 italic">"{e.example}"</p>}
                  <div className="flex gap-2">
                    {[1,2,3,4,5].map(m => (
                      <button key={m} onClick={() => save(entries.map(x => x.id === e.id ? { ...x, mastery: m } : x))}
                        className={`text-sm ${m <= e.mastery ? 'text-yellow-400' : 'text-slate-700'}`}>★</button>
                    ))}
                    <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="ml-auto text-slate-700 hover:text-red-400">
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
            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Build your language learning vocabulary vault.</p>
          </div>
        )}
      </div>
    </div>
  )
}

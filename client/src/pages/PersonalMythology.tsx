import { useState, useEffect } from 'react'
import { Scroll, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type MythType = 'origin-story' | 'hero-journey' | 'turning-point' | 'villain-story' | 'mentor' | 'quest' | 'transformation' | 'symbol' | 'belief' | 'archetype'

interface MythEntry {
  id: string
  type: MythType
  title: string
  narrative: string
  characters: string
  lesson: string
  currentRelevance: string
  reframe: string
  power: number
  createdAt: string
}

const TYPE_CONFIG: Record<MythType, { label: string; emoji: string; color: string; description: string }> = {
  'origin-story':  { label: 'Origin Story',    emoji: '🌱', color: '#22c55e', description: 'Where your story began' },
  'hero-journey':  { label: 'Hero Journey',    emoji: '⚔️', color: '#f59e0b', description: 'Challenges you overcame' },
  'turning-point': { label: 'Turning Point',   emoji: '↩️', color: '#3b82f6', description: 'Moments that changed you' },
  'villain-story': { label: 'Villain Story',   emoji: '🐉', color: '#ef4444', description: 'Obstacles you faced' },
  mentor:          { label: 'Mentor',          emoji: '🧙', color: '#a855f7', description: 'Guides who shaped you' },
  quest:           { label: 'Quest',           emoji: '🗺️', color: '#f97316', description: 'Your ongoing missions' },
  transformation:  { label: 'Transformation',  emoji: '🦋', color: '#ec4899', description: 'Who you became' },
  symbol:          { label: 'Symbol',          emoji: '🔮', color: '#6366f1', description: 'Objects and places of meaning' },
  belief:          { label: 'Core Belief',     emoji: '💎', color: '#0ea5e9', description: 'Truths you live by' },
  archetype:       { label: 'Archetype',       emoji: '🎭', color: '#84cc16', description: 'The roles you play in your story' },
}

const STORAGE_KEY = 'personal_mythology'

export default function PersonalMythology() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<MythEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<string>('all')
  const [form, setForm] = useState<Omit<MythEntry, 'id' | 'createdAt'>>({
    type: 'origin-story', title: '', narrative: '', characters: '',
    lesson: '', currentRelevance: '', reframe: '', power: 3,
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: MythEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.title.trim() || !form.narrative.trim()) return
    const e: MythEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, title: '', narrative: '', characters: '', lesson: '', currentRelevance: '', reframe: '' }))
    setShowForm(false)
    toastSuccess('Story chapter added 📖')
  }

  const filtered = entries.filter(e => filterType === 'all' || e.type === filterType)

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Scroll className="w-7 h-7 text-amber-400" />
            Personal Mythology
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">You are the hero of your own epic story.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Chapters</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-amber-400">{[...new Set(entries.map(e => e.type))].length}</div>
          <div className="text-xs text-slate-500">Story Types</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">
            {entries.length > 0 ? Math.round(entries.reduce((s, e) => s + e.power, 0) / entries.length * 10) / 10 : 0}
          </div>
          <div className="text-xs text-slate-500">Avg Power</div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilterType('all')}
          className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterType === 'all' ? 'bg-amber-600/20 text-amber-400 border border-amber-500/30' : 'bg-slate-800 text-slate-500'}`}>
          All
        </button>
        {(Object.entries(TYPE_CONFIG) as [MythType, typeof TYPE_CONFIG['origin-story']][]).map(([k, t]) => (
          <button key={k} onClick={() => setFilterType(k)}
            className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterType === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
            style={filterType === k ? { background: t.color + '30', color: t.color } : {}}>
            {t.emoji}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-amber-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Add Story Chapter</h3>
          <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as MythType }))} className="game-input w-full text-sm">
            {(Object.entries(TYPE_CONFIG) as [MythType, typeof TYPE_CONFIG['origin-story']][]).map(([k, t]) => (
              <option key={k} value={k}>{t.emoji} {t.label} — {t.description}</option>
            ))}
          </select>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Chapter title *" className="game-input w-full" autoFocus />
          <textarea value={form.narrative} onChange={e => setForm(f => ({ ...f, narrative: e.target.value }))}
            placeholder="Tell the story... *" className="game-input w-full h-20 resize-none text-sm" />
          <input value={form.characters} onChange={e => setForm(f => ({ ...f, characters: e.target.value }))}
            placeholder="Key characters (people, forces, circumstances)" className="game-input w-full text-sm" />
          <input value={form.lesson} onChange={e => setForm(f => ({ ...f, lesson: e.target.value }))}
            placeholder="What did this teach you?" className="game-input w-full text-sm" />
          <input value={form.currentRelevance} onChange={e => setForm(f => ({ ...f, currentRelevance: e.target.value }))}
            placeholder="How does this story affect you today?" className="game-input w-full text-sm" />
          <input value={form.reframe} onChange={e => setForm(f => ({ ...f, reframe: e.target.value }))}
            placeholder="How can you reframe this story positively?" className="game-input w-full text-sm" />
          <div>
            <p className="text-xs text-slate-500 mb-1">Power of this story: {form.power}/5</p>
            <input type="range" min={1} max={5} value={form.power}
              onChange={e => setForm(f => ({ ...f, power: Number(e.target.value) }))}
              className="w-full h-1 accent-amber-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold">Save</button>
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
                  <span className="font-medium text-white text-sm">{e.title}</span>
                  <p className="text-xs text-slate-500">{t.label} · Power {'⚡'.repeat(e.power)}</p>
                </div>
                {isExp ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
              </div>
              {isExp && (
                <div className="border-t border-slate-800 p-3 space-y-1.5">
                  <p className="text-xs text-slate-300 leading-relaxed">{e.narrative}</p>
                  {e.characters && <p className="text-xs text-purple-300">👥 {e.characters}</p>}
                  {e.lesson && <p className="text-xs text-yellow-300">💡 {e.lesson}</p>}
                  {e.currentRelevance && <p className="text-xs text-blue-300">🔗 Today: {e.currentRelevance}</p>}
                  {e.reframe && <p className="text-xs text-green-300">✨ Reframe: {e.reframe}</p>}
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
            <Scroll className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Write the mythology of your own extraordinary life.</p>
          </div>
        )}
      </div>
    </div>
  )
}

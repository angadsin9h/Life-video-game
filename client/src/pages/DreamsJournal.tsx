import { useState, useEffect } from 'react'
import { Moon, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type DreamType = 'normal' | 'lucid' | 'nightmare' | 'recurring' | 'prophetic' | 'vivid'
type DreamEmotion = 'joy' | 'fear' | 'confusion' | 'sadness' | 'excitement' | 'peace' | 'anxiety' | 'wonder'

interface DreamEntry {
  id: string
  date: string
  title: string
  description: string
  type: DreamType
  emotions: DreamEmotion[]
  clarity: number
  interpretation: string
  recurring: boolean
  symbols: string
  createdAt: string
}

const TYPE_CONFIG: Record<DreamType, { label: string; color: string; emoji: string }> = {
  normal:     { label: 'Normal',     color: '#6366f1', emoji: '💭' },
  lucid:      { label: 'Lucid',      color: '#22c55e', emoji: '✨' },
  nightmare:  { label: 'Nightmare',  color: '#ef4444', emoji: '😰' },
  recurring:  { label: 'Recurring',  color: '#f59e0b', emoji: '🔄' },
  prophetic:  { label: 'Prophetic',  color: '#a855f7', emoji: '🔮' },
  vivid:      { label: 'Vivid',      color: '#3b82f6', emoji: '🌈' },
}

const EMOTION_CONFIG: Record<DreamEmotion, { label: string; color: string }> = {
  joy:        { label: 'Joy',       color: '#f59e0b' },
  fear:       { label: 'Fear',      color: '#ef4444' },
  confusion:  { label: 'Confusion', color: '#94a3b8' },
  sadness:    { label: 'Sadness',   color: '#3b82f6' },
  excitement: { label: 'Excitement',color: '#f97316' },
  peace:      { label: 'Peace',     color: '#22c55e' },
  anxiety:    { label: 'Anxiety',   color: '#a855f7' },
  wonder:     { label: 'Wonder',    color: '#ec4899' },
}

const STORAGE_KEY = 'dreams_journal'

export default function DreamsJournal() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<DreamEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<string>('all')
  const [form, setForm] = useState<Omit<DreamEntry, 'id' | 'createdAt'>>({
    date: new Date().toISOString().split('T')[0], title: '', description: '',
    type: 'normal', emotions: [], clarity: 5, interpretation: '',
    recurring: false, symbols: '',
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: DreamEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const toggleEmotion = (em: DreamEmotion) => {
    setForm(f => ({
      ...f,
      emotions: f.emotions.includes(em) ? f.emotions.filter(e => e !== em) : [...f.emotions, em],
    }))
  }

  const submit = () => {
    if (!form.description.trim()) return
    const title = form.title || form.description.slice(0, 40) + (form.description.length > 40 ? '…' : '')
    const e: DreamEntry = { id: Date.now().toString(), ...form, title, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm({ date: new Date().toISOString().split('T')[0], title: '', description: '', type: 'normal', emotions: [], clarity: 5, interpretation: '', recurring: false, symbols: '' })
    setShowForm(false)
    toastSuccess('Dream recorded 🌙')
  }

  const lucidCount = entries.filter(e => e.type === 'lucid').length
  const nightmareCount = entries.filter(e => e.type === 'nightmare').length
  const filtered = entries.filter(e => filterType === 'all' || e.type === filterType)

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Moon className="w-7 h-7 text-indigo-400" />
            Dreams Journal
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Record and reflect on your dreams.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-700 hover:bg-indigo-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Dreams</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{lucidCount}</div>
          <div className="text-xs text-slate-500">Lucid</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-red-400">{nightmareCount}</div>
          <div className="text-xs text-slate-500">Nightmares</div>
        </div>
      </div>

      {/* Type filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilterType('all')}
          className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterType === 'all' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'bg-slate-800 text-slate-500'}`}>
          All
        </button>
        {(Object.entries(TYPE_CONFIG) as [DreamType, typeof TYPE_CONFIG.normal][]).map(([k, t]) => (
          <button key={k} onClick={() => setFilterType(k)}
            className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterType === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
            style={filterType === k ? { background: t.color + '30', color: t.color } : {}}>
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-indigo-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Record Dream</h3>
          <div className="flex gap-2">
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="game-input text-sm" />
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as DreamType }))} className="game-input text-sm flex-1">
              {(Object.entries(TYPE_CONFIG) as [DreamType, typeof TYPE_CONFIG.normal][]).map(([k, t]) => (
                <option key={k} value={k}>{t.emoji} {t.label}</option>
              ))}
            </select>
          </div>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Title (optional)" className="game-input w-full text-sm" autoFocus />
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Describe the dream... *" className="game-input w-full h-24 resize-none text-sm" />
          <div>
            <p className="text-xs text-slate-500 mb-2">Emotions felt:</p>
            <div className="flex gap-2 flex-wrap">
              {(Object.entries(EMOTION_CONFIG) as [DreamEmotion, typeof EMOTION_CONFIG.joy][]).map(([k, em]) => (
                <button key={k} onClick={() => toggleEmotion(k)}
                  className={`px-2.5 py-1 rounded-full text-xs ${form.emotions.includes(k) ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
                  style={form.emotions.includes(k) ? { background: em.color + '30', color: em.color } : {}}>
                  {em.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 w-28">Clarity: {form.clarity}/10</span>
            <input type="range" min={1} max={10} value={form.clarity}
              onChange={e => setForm(f => ({ ...f, clarity: Number(e.target.value) }))}
              className="flex-1 h-1 accent-indigo-400" />
          </div>
          <input value={form.symbols} onChange={e => setForm(f => ({ ...f, symbols: e.target.value }))}
            placeholder="Key symbols or themes (comma-separated)" className="game-input w-full text-sm" />
          <textarea value={form.interpretation} onChange={e => setForm(f => ({ ...f, interpretation: e.target.value }))}
            placeholder="Your interpretation..." className="game-input w-full h-14 resize-none text-sm" />
          <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
            <input type="checkbox" checked={form.recurring} onChange={e => setForm(f => ({ ...f, recurring: e.target.checked }))} className="accent-indigo-400" />
            This dream has recurred before
          </label>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-indigo-700 hover:bg-indigo-600 text-white rounded-xl text-sm font-semibold">Save</button>
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
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-white text-sm">{e.title}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: t.color + '20', color: t.color }}>{t.label}</span>
                    {e.recurring && <span className="text-xs text-yellow-500">🔄</span>}
                  </div>
                  <div className="flex gap-1.5 mt-0.5 flex-wrap">
                    {e.emotions.slice(0, 3).map(em => (
                      <span key={em} className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: EMOTION_CONFIG[em].color + '20', color: EMOTION_CONFIG[em].color }}>
                        {EMOTION_CONFIG[em].label}
                      </span>
                    ))}
                    <span className="text-xs text-slate-600">{e.date}</span>
                  </div>
                </div>
                <span className="text-xs text-slate-600">{e.clarity}/10</span>
                {isExp ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
              </div>
              {isExp && (
                <div className="border-t border-slate-800 p-3 space-y-2">
                  <p className="text-sm text-slate-300">{e.description}</p>
                  {e.symbols && <p className="text-xs text-slate-500">🔮 Symbols: {e.symbols}</p>}
                  {e.interpretation && <p className="text-sm text-teal-400 italic">💡 {e.interpretation}</p>}
                  <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-xs text-slate-700 hover:text-red-400">Delete</button>
                </div>
              )}
            </div>
          )
        })}
        {filtered.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Moon className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Record your dreams right after waking up.</p>
          </div>
        )}
      </div>
    </div>
  )
}

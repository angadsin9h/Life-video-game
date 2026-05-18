import { useState, useEffect } from 'react'
import { Clock, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type CapsuleCategory = 'current-me' | 'predictions' | 'dreams' | 'message' | 'snapshot' | 'challenge' | 'gratitude'

interface CapsuleEntry {
  id: string
  category: CapsuleCategory
  title: string
  content: string
  openDate: string
  tags: string
  isOpened: boolean
  createdAt: string
}

const CAT_CONFIG: Record<CapsuleCategory, { label: string; emoji: string; color: string; prompt: string }> = {
  'current-me':  { label: 'Current Me',   emoji: '🪞', color: '#6366f1', prompt: 'Who are you right now? Your state of mind, fears, joys...' },
  predictions:   { label: 'Predictions',  emoji: '🔮', color: '#a855f7', prompt: 'What do you predict about your life, the world, or technology?' },
  dreams:        { label: 'Dreams',       emoji: '✨', color: '#f59e0b', prompt: 'What do you dream about? What do you hope for?' },
  message:       { label: 'Message',      emoji: '💌', color: '#ec4899', prompt: 'What would you like to tell your future self?' },
  snapshot:      { label: 'Life Snapshot',emoji: '📸', color: '#3b82f6', prompt: 'What does your life look like today? Job, relationships, home...' },
  challenge:     { label: 'Challenge',    emoji: '⚡', color: '#22c55e', prompt: 'Set a challenge for your future self to complete.' },
  gratitude:     { label: 'Gratitude',    emoji: '🙏', color: '#f97316', prompt: 'What are you grateful for right now in this moment?' },
}

const STORAGE_KEY = 'personal_time_capsule'

export default function PersonalTimeCapsule() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<CapsuleEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filterCat, setFilterCat] = useState<string>('all')
  const [form, setForm] = useState<Omit<CapsuleEntry, 'id' | 'createdAt'>>({
    category: 'current-me', title: '', content: '', openDate: '', tags: '', isOpened: false,
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: CapsuleEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.title.trim() || !form.content.trim()) return
    const e: CapsuleEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm({ category: 'current-me', title: '', content: '', openDate: '', tags: '', isOpened: false })
    setShowForm(false)
    toastSuccess('Time capsule sealed 🔒')
  }

  const filtered = entries.filter(e => filterCat === 'all' || e.category === filterCat)
  const sealed = entries.filter(e => !e.isOpened && e.openDate && new Date(e.openDate) > new Date()).length
  const readyToOpen = entries.filter(e => !e.isOpened && e.openDate && new Date(e.openDate) <= new Date()).length

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Clock className="w-7 h-7 text-indigo-400" />
            Time Capsule
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Seal messages and memories for your future self.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-700 hover:bg-indigo-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Seal
        </button>
      </div>

      {readyToOpen > 0 && (
        <div className="game-card p-3 border border-yellow-500/30 bg-yellow-900/10">
          <p className="text-sm text-yellow-400">🎉 {readyToOpen} capsule{readyToOpen > 1 ? 's are' : ' is'} ready to open!</p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Entries</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-indigo-400">{sealed}</div>
          <div className="text-xs text-slate-500">Sealed</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">{readyToOpen}</div>
          <div className="text-xs text-slate-500">Ready!</div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilterCat('all')}
          className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterCat === 'all' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'bg-slate-800 text-slate-500'}`}>
          All
        </button>
        {(Object.entries(CAT_CONFIG) as [CapsuleCategory, typeof CAT_CONFIG['current-me']][]).map(([k, c]) => (
          <button key={k} onClick={() => setFilterCat(k)}
            className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterCat === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
            style={filterCat === k ? { background: c.color + '30', color: c.color } : {}}>
            {c.emoji}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-indigo-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Seal a Capsule</h3>
          <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as CapsuleCategory }))} className="game-input w-full text-sm">
            {(Object.entries(CAT_CONFIG) as [CapsuleCategory, typeof CAT_CONFIG['current-me']][]).map(([k, c]) => (
              <option key={k} value={k}>{c.emoji} {c.label}</option>
            ))}
          </select>
          <p className="text-xs text-slate-500 italic">{CAT_CONFIG[form.category].prompt}</p>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Title *" className="game-input w-full" autoFocus />
          <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
            placeholder="Write your message... *" className="game-input w-full h-24 resize-none text-sm" />
          <div className="flex gap-2 items-center">
            <input type="date" value={form.openDate} onChange={e => setForm(f => ({ ...f, openDate: e.target.value }))}
              className="game-input text-sm flex-1" />
            <span className="text-xs text-slate-500">Open date</span>
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-indigo-700 hover:bg-indigo-600 text-white rounded-xl text-sm font-semibold">🔒 Seal It</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(e => {
          const c = CAT_CONFIG[e.category]
          const isExp = expanded === e.id
          const isSealed = !e.isOpened && e.openDate && new Date(e.openDate) > new Date()
          const isReady = !e.isOpened && e.openDate && new Date(e.openDate) <= new Date()
          return (
            <div key={e.id} className="game-card overflow-hidden" style={{ borderLeft: `3px solid ${c.color}` }}>
              <div className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isExp ? null : e.id)}>
                <span className="text-2xl">{isSealed ? '🔒' : isReady ? '🎉' : c.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white text-sm">{e.title}</span>
                    {isReady && <span className="text-xs bg-yellow-900/30 text-yellow-400 px-1.5 rounded">Open now!</span>}
                  </div>
                  <p className="text-xs text-slate-500">{c.label}{e.openDate && ` · Open: ${e.openDate}`}</p>
                </div>
                {isExp ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
              </div>
              {isExp && (
                <div className="border-t border-slate-800 p-3 space-y-2">
                  {isSealed ? (
                    <p className="text-xs text-slate-500 text-center italic">🔒 Sealed until {e.openDate}</p>
                  ) : (
                    <p className="text-xs text-slate-300 whitespace-pre-line">{e.content}</p>
                  )}
                  <div className="flex gap-2">
                    {!e.isOpened && !isSealed && (
                      <button onClick={() => { save(entries.map(x => x.id === e.id ? { ...x, isOpened: true } : x)); toastSuccess('Capsule opened! 🎉') }}
                        className="text-xs text-yellow-400 hover:text-yellow-300">Mark as opened</button>
                    )}
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
            <Clock className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Seal a message for your future self to discover.</p>
          </div>
        )}
      </div>
    </div>
  )
}

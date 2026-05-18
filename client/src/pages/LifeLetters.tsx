import { useState, useEffect } from 'react'
import { Mail, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type LetterRecipient = 'future-self' | 'past-self' | 'child' | 'parent' | 'friend' | 'partner' | 'mentor' | 'stranger' | 'world'
type LetterMood = 'grateful' | 'hopeful' | 'apologetic' | 'proud' | 'loving' | 'reflective' | 'encouraging' | 'forgiving'

interface LifeLetter {
  id: string
  recipient: LetterRecipient
  mood: LetterMood
  subject: string
  body: string
  openDate: string
  isSent: boolean
  tags: string
  createdAt: string
}

const RECIPIENT_CONFIG: Record<LetterRecipient, { label: string; emoji: string; color: string }> = {
  'future-self': { label: 'Future Me',    emoji: '🔮', color: '#a855f7' },
  'past-self':   { label: 'Past Me',      emoji: '⏮️', color: '#6366f1' },
  child:         { label: 'My Child',     emoji: '👶', color: '#f59e0b' },
  parent:        { label: 'My Parent',    emoji: '👨‍👩‍👧', color: '#22c55e' },
  friend:        { label: 'A Friend',     emoji: '🤝', color: '#3b82f6' },
  partner:       { label: 'My Partner',   emoji: '❤️', color: '#ec4899' },
  mentor:        { label: 'My Mentor',    emoji: '🧭', color: '#0ea5e9' },
  stranger:      { label: 'A Stranger',   emoji: '🌍', color: '#84cc16' },
  world:         { label: 'The World',    emoji: '🌐', color: '#f97316' },
}

const MOOD_CONFIG: Record<LetterMood, { label: string; emoji: string }> = {
  grateful:     { label: 'Grateful',     emoji: '🙏' },
  hopeful:      { label: 'Hopeful',      emoji: '✨' },
  apologetic:   { label: 'Apologetic',   emoji: '💙' },
  proud:        { label: 'Proud',        emoji: '🦁' },
  loving:       { label: 'Loving',       emoji: '💕' },
  reflective:   { label: 'Reflective',   emoji: '🌀' },
  encouraging:  { label: 'Encouraging',  emoji: '🚀' },
  forgiving:    { label: 'Forgiving',    emoji: '🕊️' },
}

const STORAGE_KEY = 'life_letters'

export default function LifeLetters() {
  const { toastSuccess } = useToast()
  const [letters, setLetters] = useState<LifeLetter[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filterRecipient, setFilterRecipient] = useState<string>('all')
  const [form, setForm] = useState<Omit<LifeLetter, 'id' | 'createdAt'>>({
    recipient: 'future-self', mood: 'grateful', subject: '', body: '',
    openDate: '', isSent: false, tags: '',
  })

  useEffect(() => {
    try { setLetters(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: LifeLetter[]) => { setLetters(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.subject.trim() || !form.body.trim()) return
    const l: LifeLetter = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([l, ...letters])
    setForm({ recipient: 'future-self', mood: 'grateful', subject: '', body: '', openDate: '', isSent: false, tags: '' })
    setShowForm(false)
    toastSuccess('Letter saved 💌')
  }

  const filtered = letters.filter(l => filterRecipient === 'all' || l.recipient === filterRecipient)
  const futureLetters = letters.filter(l => l.openDate && new Date(l.openDate) > new Date()).length

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Mail className="w-7 h-7 text-pink-400" />
            Life Letters
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Letters to your future self, loved ones, and the world.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-pink-700 hover:bg-pink-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Write
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{letters.length}</div>
          <div className="text-xs text-slate-500">Letters</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-purple-400">{futureLetters}</div>
          <div className="text-xs text-slate-500">Sealed</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-pink-400">{letters.filter(l => l.recipient === 'future-self').length}</div>
          <div className="text-xs text-slate-500">To Future Me</div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilterRecipient('all')}
          className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterRecipient === 'all' ? 'bg-pink-600/20 text-pink-400 border border-pink-500/30' : 'bg-slate-800 text-slate-500'}`}>
          All
        </button>
        {(Object.entries(RECIPIENT_CONFIG) as [LetterRecipient, typeof RECIPIENT_CONFIG['future-self']][]).map(([k, r]) => (
          <button key={k} onClick={() => setFilterRecipient(k)}
            className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterRecipient === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
            style={filterRecipient === k ? { background: r.color + '30', color: r.color } : {}}>
            {r.emoji}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-pink-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Write a Letter</h3>
          <div className="flex gap-2">
            <select value={form.recipient} onChange={e => setForm(f => ({ ...f, recipient: e.target.value as LetterRecipient }))} className="game-input text-sm flex-1">
              {(Object.entries(RECIPIENT_CONFIG) as [LetterRecipient, typeof RECIPIENT_CONFIG['future-self']][]).map(([k, r]) => (
                <option key={k} value={k}>{r.emoji} {r.label}</option>
              ))}
            </select>
            <select value={form.mood} onChange={e => setForm(f => ({ ...f, mood: e.target.value as LetterMood }))} className="game-input text-sm flex-1">
              {(Object.entries(MOOD_CONFIG) as [LetterMood, typeof MOOD_CONFIG.grateful][]).map(([k, m]) => (
                <option key={k} value={k}>{m.emoji} {m.label}</option>
              ))}
            </select>
          </div>
          <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
            placeholder="Subject / title *" className="game-input w-full" autoFocus />
          <textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
            placeholder="Write your letter here... *" className="game-input w-full h-32 resize-none text-sm" />
          <div className="flex gap-2">
            <input type="date" value={form.openDate} onChange={e => setForm(f => ({ ...f, openDate: e.target.value }))}
              className="game-input text-sm flex-1" />
            <span className="text-xs text-slate-500 self-center">Open date (optional)</span>
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-pink-700 hover:bg-pink-600 text-white rounded-xl text-sm font-semibold">Send & Seal</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(l => {
          const r = RECIPIENT_CONFIG[l.recipient]
          const m = MOOD_CONFIG[l.mood]
          const isExp = expanded === l.id
          const isSealed = l.openDate && new Date(l.openDate) > new Date()
          return (
            <div key={l.id} className="game-card overflow-hidden" style={{ borderLeft: `3px solid ${r.color}` }}>
              <div className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isExp ? null : l.id)}>
                <span className="text-2xl">{isSealed ? '🔒' : r.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white text-sm truncate">{l.subject}</span>
                    <span className="text-sm">{m.emoji}</span>
                  </div>
                  <p className="text-xs text-slate-500">To: {r.label}{l.openDate && ` · Open: ${l.openDate}`}</p>
                </div>
                {isExp ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
              </div>
              {isExp && !isSealed && (
                <div className="border-t border-slate-800 p-3 space-y-2">
                  <p className="text-xs text-slate-300 whitespace-pre-line">{l.body}</p>
                  <button onClick={() => save(letters.filter(x => x.id !== l.id))} className="text-slate-700 hover:text-red-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              {isExp && isSealed && (
                <div className="border-t border-slate-800 p-3">
                  <p className="text-xs text-slate-500 text-center">This letter is sealed until {l.openDate} 🔒</p>
                </div>
              )}
            </div>
          )
        })}
        {filtered.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Mail className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Write letters that matter — to yourself and those you love.</p>
          </div>
        )}
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { Mail, Plus, Trash2, Lock, Unlock } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type LetterTarget = 'future-self' | 'past-self' | 'future-child' | 'future-partner' | 'world' | 'other'

interface FutureLetter {
  id: string
  writtenDate: string
  openDate: string
  target: LetterTarget
  subject: string
  content: string
  mood: string
  isOpened: boolean
  openedDate: string
  createdAt: string
}

const TARGET_CONFIG: Record<LetterTarget, { label: string; emoji: string; color: string }> = {
  'future-self':    { label: 'Future Self',     emoji: '🔮', color: '#6366f1' },
  'past-self':      { label: 'Past Self',       emoji: '⏮️', color: '#94a3b8' },
  'future-child':   { label: 'Future Child',    emoji: '👶', color: '#f59e0b' },
  'future-partner': { label: 'Future Partner',  emoji: '💑', color: '#ec4899' },
  'world':          { label: 'The World',       emoji: '🌍', color: '#22c55e' },
  'other':          { label: 'Someone Else',    emoji: '✉️', color: '#3b82f6' },
}

const STORAGE_KEY = 'future_letters'

export default function FutureLetters() {
  const { toastSuccess } = useToast()
  const [letters, setLetters] = useState<FutureLetter[]>([])
  const [showForm, setShowForm] = useState(false)
  const [reading, setReading] = useState<string | null>(null)
  const [form, setForm] = useState<Omit<FutureLetter, 'id' | 'createdAt' | 'isOpened' | 'openedDate'>>({
    writtenDate: new Date().toISOString().split('T')[0],
    openDate: (() => {
      const d = new Date(); d.setFullYear(d.getFullYear() + 1)
      return d.toISOString().split('T')[0]
    })(),
    target: 'future-self', subject: '', content: '', mood: '',
  })

  useEffect(() => {
    try { setLetters(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: FutureLetter[]) => { setLetters(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.content.trim() || !form.subject.trim()) return
    const l: FutureLetter = { id: Date.now().toString(), ...form, isOpened: false, openedDate: '', createdAt: new Date().toISOString() }
    save([l, ...letters])
    setForm({
      writtenDate: new Date().toISOString().split('T')[0],
      openDate: (() => { const d = new Date(); d.setFullYear(d.getFullYear() + 1); return d.toISOString().split('T')[0] })(),
      target: 'future-self', subject: '', content: '', mood: '',
    })
    setShowForm(false)
    toastSuccess('Letter sealed ✉️')
  }

  const openLetter = (id: string) => {
    save(letters.map(l => l.id === id ? { ...l, isOpened: true, openedDate: new Date().toISOString().split('T')[0] } : l))
    setReading(id)
    toastSuccess('Letter opened 📬')
  }

  const today = new Date().toISOString().split('T')[0]
  const ready = letters.filter(l => !l.isOpened && l.openDate <= today).length
  const sealed = letters.filter(l => !l.isOpened && l.openDate > today).length

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Mail className="w-7 h-7 text-blue-400" />
            Future Letters
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Write letters to be opened in the future.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Write
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{letters.length}</div>
          <div className="text-xs text-slate-500">Total</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">{sealed}</div>
          <div className="text-xs text-slate-500">Sealed</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{ready}</div>
          <div className="text-xs text-slate-500">Ready to Open</div>
        </div>
      </div>

      {ready > 0 && (
        <div className="game-card p-3 border border-green-500/30 bg-green-500/5">
          <p className="text-sm text-green-400 font-medium">📬 {ready} letter{ready > 1 ? 's are' : ' is'} ready to be opened!</p>
        </div>
      )}

      {showForm && (
        <div className="game-card p-4 border border-blue-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Compose Letter</h3>
          <div className="flex gap-2">
            <select value={form.target} onChange={e => setForm(f => ({ ...f, target: e.target.value as LetterTarget }))} className="game-input text-sm flex-1">
              {(Object.entries(TARGET_CONFIG) as [LetterTarget, typeof TARGET_CONFIG['future-self']][]).map(([k, t]) => (
                <option key={k} value={k}>{t.emoji} {t.label}</option>
              ))}
            </select>
            <input type="date" value={form.openDate}
              onChange={e => setForm(f => ({ ...f, openDate: e.target.value }))}
              className="game-input text-sm" title="Open date" />
          </div>
          <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
            placeholder="Subject / title *" className="game-input w-full" autoFocus />
          <input value={form.mood} onChange={e => setForm(f => ({ ...f, mood: e.target.value }))}
            placeholder="Your mood right now (optional)" className="game-input w-full text-sm" />
          <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
            placeholder="Dear future self... *" className="game-input w-full h-40 resize-none text-sm" />
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold">
              <Lock className="w-3.5 h-3.5 inline mr-1" />Seal & Save
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Reading overlay */}
      {reading && (() => {
        const letter = letters.find(l => l.id === reading)
        if (!letter) return null
        const t = TARGET_CONFIG[letter.target]
        return (
          <div className="game-card p-5 border border-blue-500/30 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{t.emoji}</span>
                <div>
                  <p className="text-sm font-semibold text-white">{letter.subject}</p>
                  <p className="text-xs text-slate-500">Written {letter.writtenDate}{letter.mood && ` · Mood: ${letter.mood}`}</p>
                </div>
              </div>
              <button onClick={() => setReading(null)} className="text-xs text-slate-500 hover:text-slate-300">Close</button>
            </div>
            <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap border-l-2 border-blue-500/30 pl-3">
              {letter.content}
            </div>
          </div>
        )
      })()}

      <div className="space-y-2">
        {letters.map(l => {
          const t = TARGET_CONFIG[l.target]
          const isReady = !l.isOpened && l.openDate <= today
          return (
            <div key={l.id} className={`game-card p-3 flex items-center gap-3 ${l.isOpened ? 'opacity-60' : ''}`}
              style={{ borderLeft: `3px solid ${t.color}` }}>
              <span className="text-2xl">{t.emoji}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white text-sm">{l.subject}</span>
                  {l.isOpened
                    ? <span className="text-xs text-green-400 flex items-center gap-0.5"><Unlock className="w-3 h-3" /> Opened</span>
                    : isReady
                      ? <span className="text-xs text-yellow-400 flex items-center gap-0.5">📬 Ready!</span>
                      : <span className="text-xs text-slate-600 flex items-center gap-0.5"><Lock className="w-3 h-3" /> Sealed</span>
                  }
                </div>
                <p className="text-xs text-slate-500">{t.label} · {l.isOpened ? `Opened ${l.openedDate}` : `Opens ${l.openDate}`}</p>
              </div>
              <div className="flex gap-1">
                {(isReady || l.isOpened) && (
                  <button onClick={() => l.isOpened ? setReading(l.id) : openLetter(l.id)}
                    className="text-xs px-2 py-1 rounded-lg bg-blue-700/30 text-blue-400 hover:bg-blue-700/50">
                    {l.isOpened ? 'Read' : 'Open'}
                  </button>
                )}
                <button onClick={() => save(letters.filter(x => x.id !== l.id))}
                  className="text-xs text-slate-700 hover:text-red-400 px-1">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )
        })}
        {letters.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Mail className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Write a letter to your future self — it'll be a gift.</p>
          </div>
        )}
      </div>
    </div>
  )
}

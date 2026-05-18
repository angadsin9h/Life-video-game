import { useState, useEffect } from 'react'
import { Mail, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type LetterRecipient = 'future-self' | 'past-self' | 'child' | 'grandchild' | 'world' | 'friend' | 'parent' | 'partner' | 'community' | 'other'
type LetterTheme = 'wisdom' | 'love' | 'apology' | 'gratitude' | 'hopes' | 'values' | 'lessons' | 'dreams' | 'legacy'

interface LegacyLetter {
  id: string
  recipient: LetterRecipient
  theme: LetterTheme
  subject: string
  body: string
  openDate: string
  isSealed: boolean
  emotion: string
  createdAt: string
}

const RECIPIENT_CONFIG: Record<LetterRecipient, { label: string; emoji: string; color: string }> = {
  'future-self': { label: 'Future Self',  emoji: '🔮', color: '#a855f7' },
  'past-self':   { label: 'Past Self',    emoji: '🕰️', color: '#6366f1' },
  child:         { label: 'My Child',     emoji: '👶', color: '#f59e0b' },
  grandchild:    { label: 'Grandchild',   emoji: '👨‍👩‍👧', color: '#22c55e' },
  world:         { label: 'The World',    emoji: '🌍', color: '#3b82f6' },
  friend:        { label: 'Best Friend',  emoji: '🤝', color: '#ec4899' },
  parent:        { label: 'My Parent',    emoji: '❤️', color: '#ef4444' },
  partner:       { label: 'My Partner',   emoji: '💑', color: '#f97316' },
  community:     { label: 'Community',    emoji: '🏘️', color: '#0ea5e9' },
  other:         { label: 'Other',        emoji: '✉️', color: '#94a3b8' },
}

const THEME_CONFIG: Record<LetterTheme, { label: string; color: string }> = {
  wisdom:    { label: 'Wisdom',    color: '#f59e0b' },
  love:      { label: 'Love',      color: '#ec4899' },
  apology:   { label: 'Apology',   color: '#ef4444' },
  gratitude: { label: 'Gratitude', color: '#22c55e' },
  hopes:     { label: 'Hopes',     color: '#3b82f6' },
  values:    { label: 'Values',    color: '#a855f7' },
  lessons:   { label: 'Lessons',   color: '#6366f1' },
  dreams:    { label: 'Dreams',    color: '#0ea5e9' },
  legacy:    { label: 'Legacy',    color: '#84cc16' },
}

const STORAGE_KEY = 'legacy_letters'

export default function LegacyLetters() {
  const { toastSuccess } = useToast()
  const [letters, setLetters] = useState<LegacyLetter[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [form, setForm] = useState<Omit<LegacyLetter, 'id' | 'createdAt'>>({
    recipient: 'future-self', theme: 'wisdom', subject: '', body: '',
    openDate: '', isSealed: false, emotion: '',
  })

  useEffect(() => {
    try { setLetters(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: LegacyLetter[]) => { setLetters(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.body.trim()) return
    const l: LegacyLetter = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([l, ...letters])
    setForm(f => ({ ...f, subject: '', body: '', openDate: '', emotion: '' }))
    setShowForm(false)
    toastSuccess('Legacy letter written ✉️')
  }

  const sealed = letters.filter(l => l.isSealed).length
  const byRecipient = [...new Set(letters.map(l => l.recipient))].length

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Mail className="w-7 h-7 text-purple-400" />
            Legacy Letters
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Write letters for the future — wisdom, love, and lessons preserved.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Write
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{letters.length}</div>
          <div className="text-xs text-slate-500">Letters</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-purple-400">{sealed}</div>
          <div className="text-xs text-slate-500">Sealed</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-pink-400">{byRecipient}</div>
          <div className="text-xs text-slate-500">Recipients</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-purple-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Write Legacy Letter</h3>
          <div className="flex gap-2">
            <select value={form.recipient} onChange={e => setForm(f => ({ ...f, recipient: e.target.value as LetterRecipient }))} className="game-input text-sm flex-1">
              {(Object.entries(RECIPIENT_CONFIG) as [LetterRecipient, typeof RECIPIENT_CONFIG['future-self']][]).map(([k, r]) => (
                <option key={k} value={k}>{r.emoji} {r.label}</option>
              ))}
            </select>
            <select value={form.theme} onChange={e => setForm(f => ({ ...f, theme: e.target.value as LetterTheme }))} className="game-input text-sm flex-1">
              {(Object.entries(THEME_CONFIG) as [LetterTheme, typeof THEME_CONFIG.wisdom][]).map(([k, t]) => (
                <option key={k} value={k}>{t.label}</option>
              ))}
            </select>
          </div>
          <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
            placeholder="Letter subject / title" className="game-input w-full" autoFocus />
          <textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
            placeholder="Dear [recipient]..." className="game-input w-full h-40 resize-none text-sm" />
          <input value={form.emotion} onChange={e => setForm(f => ({ ...f, emotion: e.target.value }))}
            placeholder="Emotion / intention behind this letter" className="game-input w-full text-sm" />
          <div className="flex gap-3 items-center">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Open date (optional)</p>
              <input type="date" value={form.openDate} onChange={e => setForm(f => ({ ...f, openDate: e.target.value }))}
                className="game-input w-full text-sm" />
            </div>
            <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
              <input type="checkbox" checked={form.isSealed} onChange={e => setForm(f => ({ ...f, isSealed: e.target.checked }))} />
              Seal letter
            </label>
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-xl text-sm font-semibold">Send to Future</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {letters.map(l => {
          const r = RECIPIENT_CONFIG[l.recipient]
          const t = THEME_CONFIG[l.theme]
          const isExp = expanded === l.id
          return (
            <div key={l.id} className="game-card overflow-hidden" style={{ borderLeft: `3px solid ${r.color}` }}>
              <div className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isExp ? null : l.id)}>
                <span className="text-2xl">{r.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-white">{l.subject || 'Untitled Letter'}</span>
                    {l.isSealed && <span className="text-xs text-purple-400">🔒 Sealed</span>}
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: t.color + '20', color: t.color }}>{t.label}</span>
                  </div>
                  <p className="text-xs text-slate-500">To: {r.label}{l.openDate ? ` · Open: ${l.openDate}` : ''}</p>
                </div>
                {isExp ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
              </div>
              {isExp && !l.isSealed && (
                <div className="border-t border-slate-800 p-3 space-y-2">
                  <p className="text-xs text-slate-300 whitespace-pre-line">{l.body}</p>
                  {l.emotion && <p className="text-xs text-purple-300 italic">Written with: {l.emotion}</p>}
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-slate-600">{new Date(l.createdAt).toLocaleDateString()}</p>
                    <button onClick={() => save(letters.filter(x => x.id !== l.id))} className="text-slate-700 hover:text-red-400">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
              {isExp && l.isSealed && (
                <div className="border-t border-slate-800 p-3">
                  <p className="text-xs text-slate-500 italic">🔒 This letter is sealed until {l.openDate || 'the right time'}.</p>
                  <button onClick={() => save(letters.filter(x => x.id !== l.id))} className="mt-2 text-slate-700 hover:text-red-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )
        })}
        {letters.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Mail className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">What would you tell your future self? Write the letter now.</p>
          </div>
        )}
      </div>
    </div>
  )
}

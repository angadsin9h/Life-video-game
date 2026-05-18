import { useState, useEffect } from 'react'
import { Heart, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type Language = 'words' | 'acts' | 'gifts' | 'time' | 'touch'
type PersonType = 'partner' | 'friend' | 'family' | 'colleague' | 'other'

interface LLEntry {
  id: string
  date: string
  person: string
  personType: PersonType
  action: string
  language: Language
  gave: boolean
  received: boolean
  impact: number
  note: string
  createdAt: string
}

interface MyLanguages {
  primary: Language
  secondary: Language
  scores: Record<Language, number>
}

const LANG_CONFIG: Record<Language, { label: string; emoji: string; color: string; desc: string }> = {
  words:  { label: 'Words of Affirmation', emoji: '💬', color: '#6366f1', desc: 'Compliments, encouragement, appreciation' },
  acts:   { label: 'Acts of Service',      emoji: '🛠️', color: '#22c55e', desc: 'Helping, doing tasks, reducing burden' },
  gifts:  { label: 'Receiving Gifts',      emoji: '🎁', color: '#f59e0b', desc: 'Thoughtful gestures, presents' },
  time:   { label: 'Quality Time',         emoji: '⏱️', color: '#3b82f6', desc: 'Undivided attention, presence' },
  touch:  { label: 'Physical Touch',       emoji: '🤝', color: '#ec4899', desc: 'Hugs, handshakes, physical comfort' },
}

const TYPE_CONFIG: Record<PersonType, { label: string; emoji: string }> = {
  partner:  { label: 'Partner',   emoji: '💑' },
  friend:   { label: 'Friend',    emoji: '👫' },
  family:   { label: 'Family',    emoji: '👨‍👩‍👧' },
  colleague:{ label: 'Colleague', emoji: '💼' },
  other:    { label: 'Other',     emoji: '👤' },
}

const STORAGE_KEY = 'love_languages_log'
const PROFILE_KEY = 'love_languages_profile'

export default function LoveLanguages() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<LLEntry[]>([])
  const [myLangs, setMyLangs] = useState<MyLanguages>({
    primary: 'words', secondary: 'time',
    scores: { words: 7, acts: 5, gifts: 3, time: 8, touch: 4 },
  })
  const [showForm, setShowForm] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [form, setForm] = useState<Omit<LLEntry, 'id' | 'createdAt'>>({
    date: new Date().toISOString().split('T')[0], person: '', personType: 'partner',
    action: '', language: 'words', gave: true, received: false, impact: 5, note: '',
  })
  const [profileForm, setProfileForm] = useState({ ...myLangs })

  useEffect(() => {
    try {
      setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'))
      const p = JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null')
      if (p) { setMyLangs(p); setProfileForm(p) }
    } catch { /**/ }
  }, [])

  const save = (u: LLEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.person.trim() || !form.action.trim()) return
    const e: LLEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm({ date: new Date().toISOString().split('T')[0], person: '', personType: 'partner', action: '', language: 'words', gave: true, received: false, impact: 5, note: '' })
    setShowForm(false)
    toastSuccess('Love language moment logged 💕')
  }

  const saveProfile = () => {
    setMyLangs(profileForm)
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profileForm))
    setShowProfile(false)
    toastSuccess('Profile updated!')
  }

  const langCounts = (Object.keys(LANG_CONFIG) as Language[]).map(l => ({
    lang: l, count: entries.filter(e => e.language === l).length,
  })).sort((a, b) => b.count - a.count)

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Heart className="w-7 h-7 text-pink-400" />
            Love Languages
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track connection moments with the people you care about.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-pink-700 hover:bg-pink-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      {/* My Profile */}
      <div className="game-card p-4 border border-pink-500/20">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-white">My Love Languages</span>
          <button onClick={() => setShowProfile(true)} className="text-xs text-slate-500 hover:text-slate-300">Edit</button>
        </div>
        <div className="space-y-2">
          {(Object.entries(myLangs.scores) as [Language, number][])
            .sort(([,a],[,b]) => b - a)
            .map(([lang, score]) => {
              const c = LANG_CONFIG[lang]
              return (
                <div key={lang} className="flex items-center gap-2">
                  <span className="text-sm w-6">{c.emoji}</span>
                  <span className="text-xs text-slate-400 w-36 truncate">{c.label}</span>
                  <div className="flex-1 h-1.5 bg-slate-800 rounded-full">
                    <div className="h-full rounded-full" style={{ width: `${score * 10}%`, background: c.color }} />
                  </div>
                  <span className="text-xs text-slate-500 w-6">{score}</span>
                </div>
              )
            })}
        </div>
      </div>

      {showProfile && (
        <div className="game-card p-4 border border-pink-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Edit My Profile</h3>
          {(Object.entries(LANG_CONFIG) as [Language, typeof LANG_CONFIG.words][]).map(([k, c]) => (
            <div key={k} className="flex items-center gap-2">
              <span className="text-sm w-6">{c.emoji}</span>
              <span className="text-xs text-slate-400 flex-1">{c.label}</span>
              <input type="range" min={1} max={10}
                value={profileForm.scores[k]}
                onChange={e => setProfileForm(f => ({ ...f, scores: { ...f.scores, [k]: Number(e.target.value) } }))}
                className="w-24 h-1 accent-pink-400" />
              <span className="text-xs text-slate-500 w-4">{profileForm.scores[k]}</span>
            </div>
          ))}
          <div className="flex gap-2">
            <button onClick={saveProfile} className="flex-1 py-2 bg-pink-700 hover:bg-pink-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowProfile(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Language frequency */}
      <div className="grid grid-cols-5 gap-2">
        {langCounts.map(({ lang, count }) => {
          const c = LANG_CONFIG[lang]
          return (
            <div key={lang} className="game-card p-2 text-center">
              <div className="text-lg">{c.emoji}</div>
              <div className="text-sm font-bold text-white">{count}</div>
              <div className="text-[10px] text-slate-500 leading-tight">{c.label.split(' ')[0]}</div>
            </div>
          )
        })}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-pink-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Moment</h3>
          <div className="flex gap-2">
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="game-input text-sm" />
            <select value={form.personType} onChange={e => setForm(f => ({ ...f, personType: e.target.value as PersonType }))} className="game-input text-sm flex-1">
              {(Object.entries(TYPE_CONFIG) as [PersonType, typeof TYPE_CONFIG.partner][]).map(([k, t]) => (
                <option key={k} value={k}>{t.emoji} {t.label}</option>
              ))}
            </select>
          </div>
          <input value={form.person} onChange={e => setForm(f => ({ ...f, person: e.target.value }))}
            placeholder="Person's name *" className="game-input w-full" autoFocus />
          <textarea value={form.action} onChange={e => setForm(f => ({ ...f, action: e.target.value }))}
            placeholder="What happened? *" className="game-input w-full h-14 resize-none text-sm" />
          <div className="flex gap-2 flex-wrap">
            {(Object.entries(LANG_CONFIG) as [Language, typeof LANG_CONFIG.words][]).map(([k, c]) => (
              <button key={k} onClick={() => setForm(f => ({ ...f, language: k }))}
                className={`px-2.5 py-1 rounded-full text-xs ${form.language === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
                style={form.language === k ? { background: c.color + '30', color: c.color } : {}}>
                {c.emoji} {c.label.split(' ')[0]}
              </button>
            ))}
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
              <input type="checkbox" checked={form.gave} onChange={e => setForm(f => ({ ...f, gave: e.target.checked }))} className="accent-pink-400" />
              I gave
            </label>
            <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
              <input type="checkbox" checked={form.received} onChange={e => setForm(f => ({ ...f, received: e.target.checked }))} className="accent-pink-400" />
              I received
            </label>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 w-28">Impact: {form.impact}/10</span>
            <input type="range" min={1} max={10} value={form.impact}
              onChange={e => setForm(f => ({ ...f, impact: Number(e.target.value) }))}
              className="flex-1 h-1 accent-pink-400" />
          </div>
          <textarea value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
            placeholder="Notes..." className="game-input w-full h-12 resize-none text-sm" />
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-pink-700 hover:bg-pink-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const c = LANG_CONFIG[e.language]
          const t = TYPE_CONFIG[e.personType]
          const isExp = expanded === e.id
          return (
            <div key={e.id} className="game-card overflow-hidden" style={{ borderLeft: `3px solid ${c.color}` }}>
              <div className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isExp ? null : e.id)}>
                <span className="text-2xl">{c.emoji}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white text-sm">{e.person}</span>
                    <span className="text-xs text-slate-500">{t.emoji} {t.label}</span>
                  </div>
                  <p className="text-xs text-slate-500 truncate">{e.action}</p>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-600">{e.date}</div>
                  <div className="flex gap-1 justify-end mt-0.5">
                    {e.gave && <span className="text-[10px] px-1 rounded bg-green-500/10 text-green-400">gave</span>}
                    {e.received && <span className="text-[10px] px-1 rounded bg-blue-500/10 text-blue-400">rcvd</span>}
                  </div>
                </div>
                {isExp ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
              </div>
              {isExp && (
                <div className="border-t border-slate-800 p-3 space-y-2">
                  <p className="text-xs text-slate-400"><span className="text-slate-500">Language: </span>{c.label}</p>
                  <p className="text-xs text-slate-400"><span className="text-slate-500">Impact: </span>{e.impact}/10</p>
                  {e.note && <p className="text-sm text-slate-300 italic">"{e.note}"</p>}
                  <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-xs text-slate-700 hover:text-red-400">Delete</button>
                </div>
              )}
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Heart className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Log meaningful moments to understand your love languages.</p>
          </div>
        )}
      </div>
    </div>
  )
}

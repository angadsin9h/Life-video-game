import { useState, useEffect } from 'react'
import { Presentation, Plus, Trash2, ChevronDown, ChevronUp, Star, Check } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface Talk {
  id: string
  title: string
  audience: string
  date: string
  duration: number
  venue: string
  rating: number
  wins: string
  improvements: string
  nerveLevel: number
  notes: string
}

interface PracticedSkill {
  id: string
  skill: string
  practiced: boolean
  notes: string
}

const SKILLS = [
  'Eye contact', 'Vocal variety', 'Pausing effectively', 'Gestures', 'Posture',
  'Story structure', 'Opening hook', 'Call to action', 'Handling Q&A', 'Time management',
  'Breathing', 'Filler words', 'Slide design', 'Audience engagement', 'Confidence',
]

const STORAGE_KEY = 'public_speaking'
const SKILLS_KEY = 'speaking_skills'

export default function PublicSpeaking() {
  const { toastSuccess } = useToast()
  const [talks, setTalks] = useState<Talk[]>([])
  const [skills, setSkills] = useState<PracticedSkill[]>([])
  const [tab, setTab] = useState<'talks' | 'skills'>('talks')
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [form, setForm] = useState<Omit<Talk, 'id'>>({
    title: '', audience: '', date: new Date().toISOString().split('T')[0],
    duration: 10, venue: '', rating: 7, wins: '', improvements: '', nerveLevel: 5, notes: '',
  })

  useEffect(() => {
    try {
      setTalks(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'))
      const stored = JSON.parse(localStorage.getItem(SKILLS_KEY) || '[]')
      if (stored.length) {
        setSkills(stored)
      } else {
        setSkills(SKILLS.map((s, i) => ({ id: i.toString(), skill: s, practiced: false, notes: '' })))
      }
    } catch { /**/ }
  }, [])

  const saveTalks = (u: Talk[]) => { setTalks(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }
  const saveSkills = (u: PracticedSkill[]) => { setSkills(u); localStorage.setItem(SKILLS_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.title.trim()) return
    const t: Talk = { id: Date.now().toString(), ...form }
    saveTalks([t, ...talks])
    setForm({ title: '', audience: '', date: new Date().toISOString().split('T')[0], duration: 10, venue: '', rating: 7, wins: '', improvements: '', nerveLevel: 5, notes: '' })
    setShowForm(false)
    toastSuccess('Talk logged! 🎤')
  }

  const toggleSkill = (id: string) => saveSkills(skills.map(s => s.id === id ? { ...s, practiced: !s.practiced } : s))

  const avgRating = talks.length ? (talks.reduce((s, t) => s + t.rating, 0) / talks.length).toFixed(1) : '—'
  const avgNerve = talks.length ? (talks.reduce((s, t) => s + t.nerveLevel, 0) / talks.length).toFixed(1) : '—'
  const masteredSkills = skills.filter(s => s.practiced).length

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
          <Presentation className="w-7 h-7 text-violet-400" />
          Public Speaking
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">Log talks, track growth, master skills.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="game-card p-3 text-center">
          <div className="text-2xl font-bold text-violet-400">{talks.length}</div>
          <div className="text-xs text-slate-500">Talks Given</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-2xl font-bold text-yellow-400">{avgRating}</div>
          <div className="text-xs text-slate-500">Avg Rating</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-2xl font-bold text-green-400">{masteredSkills}/{skills.length}</div>
          <div className="text-xs text-slate-500">Skills</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-800 p-1 rounded-xl">
        {(['talks', 'skills'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize ${tab === t ? 'bg-slate-700 text-white' : 'text-slate-500'}`}>
            {t === 'talks' ? `Talks (${talks.length})` : `Skills (${masteredSkills}/${skills.length})`}
          </button>
        ))}
      </div>

      {tab === 'talks' && (
        <>
          <button onClick={() => setShowForm(true)}
            className="w-full py-2.5 border border-dashed border-violet-700/50 rounded-xl text-violet-400 text-sm flex items-center gap-2 justify-center hover:border-violet-600">
            <Plus className="w-4 h-4" /> Log a talk
          </button>

          {showForm && (
            <div className="game-card p-4 border border-violet-500/20 space-y-3">
              <h3 className="text-sm font-semibold text-white">New Talk</h3>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Talk title *" className="game-input w-full" autoFocus />
              <div className="flex gap-2">
                <input value={form.audience} onChange={e => setForm(f => ({ ...f, audience: e.target.value }))}
                  placeholder="Audience type" className="game-input flex-1 text-sm" />
                <input value={form.venue} onChange={e => setForm(f => ({ ...f, venue: e.target.value }))}
                  placeholder="Venue" className="game-input flex-1 text-sm" />
              </div>
              <div className="flex gap-2">
                <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  className="game-input text-sm flex-1" />
                <div className="flex items-center gap-1.5">
                  <input type="number" value={form.duration} min={1}
                    onChange={e => setForm(f => ({ ...f, duration: Number(e.target.value) }))}
                    className="game-input w-16 text-sm text-center" />
                  <span className="text-xs text-slate-500">min</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 w-24">Rating: {form.rating}/10</span>
                  <input type="range" min={1} max={10} value={form.rating}
                    onChange={e => setForm(f => ({ ...f, rating: Number(e.target.value) }))}
                    className="flex-1 h-1 accent-violet-400" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 w-24">Nerves: {form.nerveLevel}/10</span>
                  <input type="range" min={1} max={10} value={form.nerveLevel}
                    onChange={e => setForm(f => ({ ...f, nerveLevel: Number(e.target.value) }))}
                    className="flex-1 h-1 accent-red-400" />
                </div>
              </div>
              <textarea value={form.wins} onChange={e => setForm(f => ({ ...f, wins: e.target.value }))}
                placeholder="What went well?" className="game-input w-full h-16 resize-none text-sm" />
              <textarea value={form.improvements} onChange={e => setForm(f => ({ ...f, improvements: e.target.value }))}
                placeholder="What to improve?" className="game-input w-full h-16 resize-none text-sm" />
              <div className="flex gap-2">
                <button onClick={submit} className="flex-1 py-2 bg-violet-700 hover:bg-violet-600 text-white rounded-xl text-sm font-semibold">Save</button>
                <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {talks.map(t => {
              const isExp = expanded === t.id
              return (
                <div key={t.id} className="game-card overflow-hidden">
                  <div className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isExp ? null : t.id)}>
                    <div className="w-10 h-10 rounded-full bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                      <Presentation className="w-5 h-5 text-violet-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{t.title}</p>
                      <div className="flex gap-2 text-xs text-slate-500">
                        <span>{t.date}</span>
                        {t.venue && <span>{t.venue}</span>}
                        <span>{t.duration}min</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-yellow-400">{t.rating}/10</span>
                      {isExp ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
                    </div>
                  </div>
                  {isExp && (
                    <div className="border-t border-slate-800 p-3 space-y-2">
                      {t.audience && <p className="text-xs text-slate-500">Audience: {t.audience}</p>}
                      <div className="flex gap-4 text-xs">
                        <span className="text-slate-400">Rating: <span className="text-yellow-400">{t.rating}/10</span></span>
                        <span className="text-slate-400">Nerves: <span className="text-red-400">{t.nerveLevel}/10</span></span>
                      </div>
                      {t.wins && <p className="text-sm text-green-300">✅ {t.wins}</p>}
                      {t.improvements && <p className="text-sm text-orange-300">📈 {t.improvements}</p>}
                      <button onClick={() => saveTalks(talks.filter(x => x.id !== t.id))}
                        className="flex items-center gap-1 text-xs text-slate-700 hover:text-red-400">
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
            {talks.length === 0 && !showForm && (
              <div className="text-center py-12 text-slate-500">
                <Presentation className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm">Log your first talk to start tracking your growth.</p>
              </div>
            )}
          </div>
        </>
      )}

      {tab === 'skills' && (
        <div className="space-y-2">
          <p className="text-xs text-slate-500">Mark skills you've actively practiced:</p>
          {skills.map(s => (
            <div key={s.id} className={`game-card p-3 flex items-center gap-3 ${s.practiced ? 'border-l-2 border-green-500/50' : ''}`}>
              <button onClick={() => toggleSkill(s.id)}
                className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${s.practiced ? 'bg-green-500 border-green-500' : 'border-slate-600 hover:border-green-500'}`}>
                {s.practiced && <Check className="w-3 h-3 text-white" />}
              </button>
              <span className={`text-sm ${s.practiced ? 'text-white' : 'text-slate-400'}`}>{s.skill}</span>
              {s.practiced && <span className="ml-auto text-xs text-green-500">practiced</span>}
            </div>
          ))}
          <div className="game-card p-3 mt-2">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400">Skill coverage</span>
              <span className="text-green-400">{masteredSkills}/{skills.length}</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full">
              <div className="h-full bg-green-500 rounded-full" style={{ width: `${(masteredSkills / skills.length) * 100}%` }} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

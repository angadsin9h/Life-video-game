import { useState, useEffect } from 'react'
import { Users, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type SocialSkill = 'conversation' | 'networking' | 'public-speaking' | 'active-listening' | 'conflict-resolution' | 'empathy' | 'assertiveness' | 'humor' | 'persuasion' | 'boundary-setting'
type PracticeType = 'real-life' | 'planned' | 'observation' | 'reading' | 'course' | 'role-play'

interface SocialSkillEntry {
  id: string
  skill: SocialSkill
  practiceType: PracticeType
  situation: string
  whatIDid: string
  response: string
  lesson: string
  comfort: number
  effectiveness: number
  date: string
  createdAt: string
}

const SKILL_CONFIG: Record<SocialSkill, { label: string; emoji: string; color: string }> = {
  conversation:        { label: 'Conversation',       emoji: '💬', color: '#3b82f6' },
  networking:          { label: 'Networking',          emoji: '🕸️', color: '#f59e0b' },
  'public-speaking':   { label: 'Public Speaking',    emoji: '🎤', color: '#ef4444' },
  'active-listening':  { label: 'Active Listening',   emoji: '👂', color: '#22c55e' },
  'conflict-resolution':{ label: 'Conflict Resolve',  emoji: '🕊️', color: '#a855f7' },
  empathy:             { label: 'Empathy',             emoji: '❤️', color: '#ec4899' },
  assertiveness:       { label: 'Assertiveness',       emoji: '💪', color: '#f97316' },
  humor:               { label: 'Humor',               emoji: '😄', color: '#84cc16' },
  persuasion:          { label: 'Persuasion',          emoji: '🎯', color: '#6366f1' },
  'boundary-setting':  { label: 'Boundaries',         emoji: '🛡️', color: '#0ea5e9' },
}

const PRACTICE_CONFIG: Record<PracticeType, { label: string; emoji: string }> = {
  'real-life':    { label: 'Real Life',    emoji: '🌍' },
  planned:        { label: 'Planned',      emoji: '📅' },
  observation:    { label: 'Observation',  emoji: '👀' },
  reading:        { label: 'Reading',      emoji: '📖' },
  course:         { label: 'Course',       emoji: '🎓' },
  'role-play':    { label: 'Role Play',    emoji: '🎭' },
}

const STORAGE_KEY = 'social_skills_log'

export default function SocialSkillsLog() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<SocialSkillEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filterSkill, setFilterSkill] = useState<string>('all')
  const [form, setForm] = useState<Omit<SocialSkillEntry, 'id' | 'createdAt'>>({
    skill: 'conversation', practiceType: 'real-life', situation: '', whatIDid: '',
    response: '', lesson: '', comfort: 3, effectiveness: 3,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: SocialSkillEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.situation.trim()) return
    const e: SocialSkillEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, situation: '', whatIDid: '', response: '', lesson: '' }))
    setShowForm(false)
    toastSuccess('Practice logged 🗣️')
  }

  const filtered = entries.filter(e => filterSkill === 'all' || e.skill === filterSkill)
  const avgComfort = entries.length > 0 ? Math.round(entries.reduce((s, e) => s + e.comfort, 0) / entries.length * 10) / 10 : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Users className="w-7 h-7 text-blue-400" />
            Social Skills Log
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Practice and track your social skill growth.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Sessions</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-blue-400">{avgComfort}</div>
          <div className="text-xs text-slate-500">Avg Comfort</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{[...new Set(entries.map(e => e.skill))].length}</div>
          <div className="text-xs text-slate-500">Skills</div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilterSkill('all')}
          className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterSkill === 'all' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'bg-slate-800 text-slate-500'}`}>
          All
        </button>
        {(Object.entries(SKILL_CONFIG) as [SocialSkill, typeof SKILL_CONFIG.conversation][]).map(([k, s]) => (
          <button key={k} onClick={() => setFilterSkill(k)}
            className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterSkill === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
            style={filterSkill === k ? { background: s.color + '30', color: s.color } : {}}>
            {s.emoji}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-blue-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Practice</h3>
          <div className="flex gap-2">
            <select value={form.skill} onChange={e => setForm(f => ({ ...f, skill: e.target.value as SocialSkill }))} className="game-input text-sm flex-1">
              {(Object.entries(SKILL_CONFIG) as [SocialSkill, typeof SKILL_CONFIG.conversation][]).map(([k, s]) => (
                <option key={k} value={k}>{s.emoji} {s.label}</option>
              ))}
            </select>
            <select value={form.practiceType} onChange={e => setForm(f => ({ ...f, practiceType: e.target.value as PracticeType }))} className="game-input text-sm">
              {(Object.entries(PRACTICE_CONFIG) as [PracticeType, typeof PRACTICE_CONFIG['real-life']][]).map(([k, p]) => (
                <option key={k} value={k}>{p.emoji} {p.label}</option>
              ))}
            </select>
          </div>
          <textarea value={form.situation} onChange={e => setForm(f => ({ ...f, situation: e.target.value }))}
            placeholder="Describe the situation *" className="game-input w-full h-12 resize-none text-sm" autoFocus />
          <input value={form.whatIDid} onChange={e => setForm(f => ({ ...f, whatIDid: e.target.value }))}
            placeholder="What you did / said..." className="game-input w-full text-sm" />
          <input value={form.response} onChange={e => setForm(f => ({ ...f, response: e.target.value }))}
            placeholder="How others responded..." className="game-input w-full text-sm" />
          <input value={form.lesson} onChange={e => setForm(f => ({ ...f, lesson: e.target.value }))}
            placeholder="Lesson / what to do differently..." className="game-input w-full text-sm" />
          <div className="flex gap-3">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Comfort: {form.comfort}/5</p>
              <input type="range" min={1} max={5} value={form.comfort}
                onChange={e => setForm(f => ({ ...f, comfort: Number(e.target.value) }))}
                className="w-full h-1 accent-blue-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Effectiveness: {form.effectiveness}/5</p>
              <input type="range" min={1} max={5} value={form.effectiveness}
                onChange={e => setForm(f => ({ ...f, effectiveness: Number(e.target.value) }))}
                className="w-full h-1 accent-green-400" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(e => {
          const s = SKILL_CONFIG[e.skill]
          const p = PRACTICE_CONFIG[e.practiceType]
          const isExp = expanded === e.id
          return (
            <div key={e.id} className="game-card overflow-hidden" style={{ borderLeft: `3px solid ${s.color}` }}>
              <div className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isExp ? null : e.id)}>
                <span className="text-2xl">{s.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white text-sm truncate">{e.situation}</p>
                  <p className="text-xs text-slate-500">{s.label} · {p.emoji} {p.label} · Comfort {e.comfort}/5</p>
                </div>
                {isExp ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
              </div>
              {isExp && (
                <div className="border-t border-slate-800 p-3 space-y-1.5">
                  {e.whatIDid && <p className="text-xs text-blue-300">🎯 {e.whatIDid}</p>}
                  {e.response && <p className="text-xs text-slate-300">↩️ {e.response}</p>}
                  {e.lesson && <p className="text-xs text-yellow-300">📖 {e.lesson}</p>}
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
            <Users className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Social skills grow through practice. Log every interaction.</p>
          </div>
        )}
      </div>
    </div>
  )
}

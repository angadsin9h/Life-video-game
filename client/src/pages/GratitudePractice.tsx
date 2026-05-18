import { useState, useEffect } from 'react'
import { Sparkles, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type GratPracticeType = 'morning' | 'evening' | 'letter' | 'meditation' | 'walk' | 'prayer' | 'journaling' | 'sharing' | 'visualization' | 'other'

interface GratPracticeEntry {
  id: string
  type: GratPracticeType
  gratitudes: string[]
  highlight: string
  whyGrateful: string
  moodBefore: number
  moodAfter: number
  duration: number
  date: string
  createdAt: string
}

const TYPE_CONFIG: Record<GratPracticeType, { label: string; emoji: string; color: string }> = {
  morning:       { label: 'Morning',       emoji: '🌅', color: '#f59e0b' },
  evening:       { label: 'Evening',       emoji: '🌙', color: '#6366f1' },
  letter:        { label: 'Letter',        emoji: '✉️', color: '#ec4899' },
  meditation:    { label: 'Meditation',    emoji: '🧘', color: '#a855f7' },
  walk:          { label: 'Grateful Walk', emoji: '🚶', color: '#22c55e' },
  prayer:        { label: 'Prayer',        emoji: '🙏', color: '#f97316' },
  journaling:    { label: 'Journaling',    emoji: '📓', color: '#3b82f6' },
  sharing:       { label: 'Sharing',       emoji: '💬', color: '#0ea5e9' },
  visualization: { label: 'Visualization', emoji: '✨', color: '#84cc16' },
  other:         { label: 'Other',         emoji: '💛', color: '#94a3b8' },
}

const GRATITUDE_PROMPTS = [
  'Something simple I often overlook',
  'A person who made a difference today',
  'A challenge that helped me grow',
  'Something beautiful I noticed',
  'A skill or ability I have',
  'A memory that brings me joy',
  'Something my body can do',
]

const STORAGE_KEY = 'gratitude_practice'

export default function GratitudePractice() {
  const { toastSuccess } = useToast()
  const [sessions, setSessions] = useState<GratPracticeEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [newGratitude, setNewGratitude] = useState('')
  const [form, setForm] = useState<Omit<GratPracticeEntry, 'id' | 'createdAt'>>({
    type: 'morning', gratitudes: [], highlight: '', whyGrateful: '',
    moodBefore: 5, moodAfter: 8, duration: 5, date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setSessions(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: GratPracticeEntry[]) => { setSessions(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (form.gratitudes.length === 0 && !form.highlight.trim()) return
    const e: GratPracticeEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...sessions])
    setForm(f => ({ ...f, gratitudes: [], highlight: '', whyGrateful: '' }))
    setNewGratitude('')
    setShowForm(false)
    toastSuccess('Gratitude practice complete 🙏')
  }

  const todaySessions = sessions.filter(s => s.date === new Date().toISOString().split('T')[0]).length
  const avgMoodLift = sessions.length
    ? Math.round(sessions.reduce((s, e) => s + (e.moodAfter - e.moodBefore), 0) / sessions.length * 10) / 10
    : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Sparkles className="w-7 h-7 text-yellow-400" />
            Gratitude Practice
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">A dedicated space for your daily gratitude sessions.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Practice
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">{sessions.length}</div>
          <div className="text-xs text-slate-500">Sessions</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{todaySessions}</div>
          <div className="text-xs text-slate-500">Today</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-indigo-400">+{avgMoodLift}</div>
          <div className="text-xs text-slate-500">Mood Lift</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-yellow-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Gratitude Session</h3>
          <div className="flex gap-2">
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as GratPracticeType }))} className="game-input text-sm flex-1">
              {(Object.entries(TYPE_CONFIG) as [GratPracticeType, typeof TYPE_CONFIG.morning][]).map(([k, c]) => (
                <option key={k} value={k}>{c.emoji} {c.label}</option>
              ))}
            </select>
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="game-input text-sm flex-1" />
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-2">Gratitude prompts:</p>
            <div className="flex flex-wrap gap-1.5">
              {GRATITUDE_PROMPTS.map(p => (
                <button key={p} onClick={() => setNewGratitude(p)}
                  className="px-2 py-1 bg-yellow-900/30 text-yellow-300 rounded-lg text-xs text-left">{p}</button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <input value={newGratitude} onChange={e => setNewGratitude(e.target.value)}
              placeholder="I'm grateful for..." className="game-input flex-1 text-sm"
              onKeyDown={e => { if (e.key === 'Enter' && newGratitude.trim()) { setForm(f => ({ ...f, gratitudes: [...f.gratitudes, newGratitude.trim()] })); setNewGratitude('') } }} />
            <button onClick={() => { if (newGratitude.trim()) { setForm(f => ({ ...f, gratitudes: [...f.gratitudes, newGratitude.trim()] })); setNewGratitude('') } }}
              className="px-3 py-1.5 bg-yellow-700/30 text-yellow-400 rounded-xl text-xs">Add</button>
          </div>
          {form.gratitudes.length > 0 && (
            <div className="space-y-1">
              {form.gratitudes.map((g, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-yellow-300">
                  <span>✦</span>
                  <span className="flex-1">{g}</span>
                  <button onClick={() => setForm(fo => ({ ...fo, gratitudes: fo.gratitudes.filter((_, j) => j !== i) }))} className="hover:text-red-400">×</button>
                </div>
              ))}
            </div>
          )}
          <input value={form.highlight} onChange={e => setForm(f => ({ ...f, highlight: e.target.value }))}
            placeholder="Today's highlight / best moment" className="game-input w-full text-sm" />
          <input value={form.whyGrateful} onChange={e => setForm(f => ({ ...f, whyGrateful: e.target.value }))}
            placeholder="Why specifically are you grateful today?" className="game-input w-full text-sm" />
          <div className="flex gap-3">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Mood before: {form.moodBefore}/10</p>
              <input type="range" min={1} max={10} value={form.moodBefore}
                onChange={e => setForm(f => ({ ...f, moodBefore: Number(e.target.value) }))}
                className="w-full h-1 accent-slate-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Mood after: {form.moodAfter}/10</p>
              <input type="range" min={1} max={10} value={form.moodAfter}
                onChange={e => setForm(f => ({ ...f, moodAfter: Number(e.target.value) }))}
                className="w-full h-1 accent-yellow-400" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-xl text-sm font-semibold">Complete Session ✨</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {sessions.map(s => {
          const t = TYPE_CONFIG[s.type]
          const lift = s.moodAfter - s.moodBefore
          return (
            <div key={s.id} className="game-card p-3" style={{ borderLeft: `3px solid ${t.color}` }}>
              <div className="flex items-start gap-3">
                <span className="text-2xl">{t.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{t.label} · {s.date}</span>
                    {lift > 0 && <span className="text-xs text-green-400">+{lift} mood</span>}
                  </div>
                  {s.gratitudes.length > 0 && (
                    <div className="mt-1 space-y-0.5">
                      {s.gratitudes.slice(0, 3).map((g, i) => (
                        <p key={i} className="text-xs text-slate-400">✦ {g}</p>
                      ))}
                      {s.gratitudes.length > 3 && <p className="text-xs text-slate-600">+{s.gratitudes.length - 3} more</p>}
                    </div>
                  )}
                  {s.highlight && <p className="text-xs text-yellow-300 mt-0.5">⭐ {s.highlight}</p>}
                </div>
                <button onClick={() => save(sessions.filter(x => x.id !== s.id))} className="text-slate-700 hover:text-red-400">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )
        })}
        {sessions.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Sparkles className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Gratitude is a practice, not just a feeling. Start now.</p>
          </div>
        )}
      </div>
    </div>
  )
}

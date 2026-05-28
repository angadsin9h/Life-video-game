import { useState, useEffect } from 'react'
import { BookOpen, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type CurriculumSubject = 'relationships' | 'loss' | 'success' | 'failure' | 'health' | 'money' | 'identity' | 'purpose' | 'courage' | 'surrender'
type LessonDepth = 'surface' | 'medium' | 'deep' | 'integrated' | 'mastered'

interface LifeCurriculumEntry {
  id: string
  subject: CurriculumSubject
  depth: LessonDepth
  theLesson: string
  howLifeTaughtIt: string
  whatYouResisted: string
  whatYouAccepted: string
  howYouGrew: string
  nextLesson: string
  wisdomScore: number
  date: string
  createdAt: string
}

const SUBJECT_CONFIG: Record<CurriculumSubject, { label: string; emoji: string; color: string }> = {
  relationships: { label: 'Relationships', emoji: '❤️', color: '#ec4899' },
  loss:          { label: 'Loss & Grief',  emoji: '🌧️', color: '#94a3b8' },
  success:       { label: 'Success',       emoji: '🏆', color: '#f59e0b' },
  failure:       { label: 'Failure',       emoji: '🔥', color: '#ef4444' },
  health:        { label: 'Health',        emoji: '💪', color: '#22c55e' },
  money:         { label: 'Money',         emoji: '💰', color: '#84cc16' },
  identity:      { label: 'Identity',      emoji: '🪞', color: '#6366f1' },
  purpose:       { label: 'Purpose',       emoji: '🧭', color: '#3b82f6' },
  courage:       { label: 'Courage',       emoji: '⚔️', color: '#f97316' },
  surrender:     { label: 'Surrender',     emoji: '🕊️', color: '#a855f7' },
}

const DEPTH_CONFIG: Record<LessonDepth, { label: string; color: string }> = {
  surface:    { label: 'Surface',    color: '#94a3b8' },
  medium:     { label: 'Medium',     color: '#3b82f6' },
  deep:       { label: 'Deep',       color: '#6366f1' },
  integrated: { label: 'Integrated', color: '#22c55e' },
  mastered:   { label: 'Mastered',   color: '#f59e0b' },
}

const STORAGE_KEY = 'life_curriculum_log'

export default function LifeCurriculum() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<LifeCurriculumEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<LifeCurriculumEntry, 'id' | 'createdAt'>>({
    subject: 'relationships', depth: 'medium', theLesson: '',
    howLifeTaughtIt: '', whatYouResisted: '', whatYouAccepted: '',
    howYouGrew: '', nextLesson: '', wisdomScore: 7,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: LifeCurriculumEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.theLesson.trim()) return
    const e: LifeCurriculumEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, theLesson: '', howLifeTaughtIt: '', whatYouResisted: '', whatYouAccepted: '', howYouGrew: '', nextLesson: '' }))
    setShowForm(false)
    toastSuccess('Life lesson logged — every experience is a teacher 📚')
  }

  const mastered = entries.filter(e => e.depth === 'mastered').length
  const avgWisdom = entries.length ? Math.round(entries.reduce((s, e) => s + e.wisdomScore, 0) / entries.length) : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <BookOpen className="w-7 h-7 text-teal-400" />
            Life Curriculum
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Document what life is teaching you through its experiences.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-teal-700 hover:bg-teal-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add Lesson
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Lessons</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">{mastered}</div>
          <div className="text-xs text-slate-500">Mastered</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-teal-400">{avgWisdom}/10</div>
          <div className="text-xs text-slate-500">Avg Wisdom</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-teal-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Life Lesson Entry</h3>
          <div className="flex gap-2">
            <select value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value as CurriculumSubject }))} className="game-input text-sm flex-1">
              {(Object.entries(SUBJECT_CONFIG) as [CurriculumSubject, typeof SUBJECT_CONFIG.relationships][]).map(([k, s]) => (
                <option key={k} value={k}>{s.emoji} {s.label}</option>
              ))}
            </select>
            <select value={form.depth} onChange={e => setForm(f => ({ ...f, depth: e.target.value as LessonDepth }))} className="game-input text-sm flex-1">
              {(Object.entries(DEPTH_CONFIG) as [LessonDepth, typeof DEPTH_CONFIG.medium][]).map(([k, d]) => (
                <option key={k} value={k}>{d.label}</option>
              ))}
            </select>
          </div>
          <textarea value={form.theLesson} onChange={e => setForm(f => ({ ...f, theLesson: e.target.value }))}
            placeholder="What is the core lesson life is teaching you? *" className="game-input w-full h-14 resize-none text-sm" autoFocus />
          <input value={form.howLifeTaughtIt} onChange={e => setForm(f => ({ ...f, howLifeTaughtIt: e.target.value }))}
            placeholder="How did life deliver this lesson?" className="game-input w-full text-sm" />
          <input value={form.whatYouResisted} onChange={e => setForm(f => ({ ...f, whatYouResisted: e.target.value }))}
            placeholder="What did you initially resist about it?" className="game-input w-full text-sm" />
          <input value={form.whatYouAccepted} onChange={e => setForm(f => ({ ...f, whatYouAccepted: e.target.value }))}
            placeholder="What have you accepted or surrendered to?" className="game-input w-full text-sm" />
          <input value={form.howYouGrew} onChange={e => setForm(f => ({ ...f, howYouGrew: e.target.value }))}
            placeholder="How have you grown from this lesson?" className="game-input w-full text-sm" />
          <input value={form.nextLesson} onChange={e => setForm(f => ({ ...f, nextLesson: e.target.value }))}
            placeholder="What might be the next lesson in this subject?" className="game-input w-full text-sm" />
          <div>
            <p className="text-xs text-slate-500 mb-1">Wisdom gained: {form.wisdomScore}/10</p>
            <input type="range" min={1} max={10} value={form.wisdomScore}
              onChange={e => setForm(f => ({ ...f, wisdomScore: Number(e.target.value) }))}
              className="w-full h-1 accent-teal-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-teal-700 hover:bg-teal-600 text-white rounded-xl text-sm font-semibold">Record Lesson</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const s = SUBJECT_CONFIG[e.subject]
          const d = DEPTH_CONFIG[e.depth]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${s.color}` }}>
              <span className="text-2xl">{s.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-white">{s.label}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: d.color + '20', color: d.color }}>{d.label}</span>
                  <span className="text-xs text-teal-400">📚 {e.wisdomScore}/10</span>
                </div>
                <p className="text-xs text-slate-300 mt-1 line-clamp-2">{e.theLesson}</p>
                {e.howYouGrew && <p className="text-xs text-green-300/70 mt-0.5">🌱 {e.howYouGrew}</p>}
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Life is your greatest curriculum. Every experience is a lesson.</p>
          </div>
        )}
      </div>
    </div>
  )
}

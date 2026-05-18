import { useState, useEffect } from 'react'
import { Star, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type QuestionCategory = 'reflection' | 'goal' | 'gratitude' | 'challenge' | 'relationship' | 'growth' | 'creativity' | 'custom'

interface DailyQuestion {
  id: string
  question: string
  category: QuestionCategory
  isActive: boolean
  frequency: 'daily' | 'weekly' | 'monthly'
  answers: { text: string; date: string }[]
  createdAt: string
}

const CAT_CONFIG: Record<QuestionCategory, { label: string; emoji: string; color: string }> = {
  reflection:  { label: 'Reflection',   emoji: '🪞', color: '#6366f1' },
  goal:        { label: 'Goal',         emoji: '🎯', color: '#22c55e' },
  gratitude:   { label: 'Gratitude',    emoji: '🙏', color: '#f59e0b' },
  challenge:   { label: 'Challenge',    emoji: '⚡', color: '#ef4444' },
  relationship:{ label: 'Relationship', emoji: '❤️', color: '#ec4899' },
  growth:      { label: 'Growth',       emoji: '🌱', color: '#a855f7' },
  creativity:  { label: 'Creativity',   emoji: '🎨', color: '#f97316' },
  custom:      { label: 'Custom',       emoji: '💡', color: '#94a3b8' },
}

const DEFAULT_QUESTIONS: Omit<DailyQuestion, 'id' | 'createdAt' | 'answers'>[] = [
  { question: 'What is one thing I am grateful for today?', category: 'gratitude', isActive: true, frequency: 'daily' },
  { question: 'What was my biggest win today?', category: 'reflection', isActive: true, frequency: 'daily' },
  { question: 'What is one thing I could have done better?', category: 'growth', isActive: true, frequency: 'daily' },
  { question: 'Who did I positively impact today?', category: 'relationship', isActive: true, frequency: 'daily' },
  { question: 'Am I moving toward my biggest goal?', category: 'goal', isActive: true, frequency: 'daily' },
]

const STORAGE_KEY = 'daily_questions'

export default function DailyQuestions() {
  const { toastSuccess } = useToast()
  const [questions, setQuestions] = useState<DailyQuestion[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [answerText, setAnswerText] = useState<Record<string, string>>({})
  const [filterCat, setFilterCat] = useState<string>('all')
  const [form, setForm] = useState<Omit<DailyQuestion, 'id' | 'createdAt' | 'answers'>>({
    question: '', category: 'reflection', isActive: true, frequency: 'daily',
  })

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
      if (stored.length === 0) {
        const defaults: DailyQuestion[] = DEFAULT_QUESTIONS.map((q, i) => ({
          id: `default-${i}`, ...q, answers: [], createdAt: new Date().toISOString(),
        }))
        setQuestions(defaults)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults))
      } else {
        setQuestions(stored)
      }
    } catch { /**/ }
  }, [])

  const save = (u: DailyQuestion[]) => { setQuestions(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.question.trim()) return
    const q: DailyQuestion = { id: Date.now().toString(), ...form, answers: [], createdAt: new Date().toISOString() }
    save([q, ...questions])
    setForm({ question: '', category: 'reflection', isActive: true, frequency: 'daily' })
    setShowForm(false)
    toastSuccess('Question added ❓')
  }

  const addAnswer = (id: string) => {
    const text = answerText[id]?.trim()
    if (!text) return
    save(questions.map(q => q.id === id ? {
      ...q,
      answers: [{ text, date: new Date().toISOString().split('T')[0] }, ...q.answers.slice(0, 29)],
    } : q))
    setAnswerText(prev => ({ ...prev, [id]: '' }))
    toastSuccess('Answer saved ✨')
  }

  const filtered = questions.filter(q => filterCat === 'all' || q.category === filterCat)
  const active = questions.filter(q => q.isActive).length
  const today = new Date().toISOString().split('T')[0]
  const answeredToday = questions.filter(q => q.answers[0]?.date === today).length

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Star className="w-7 h-7 text-yellow-400" />
            Daily Questions
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Build self-awareness through daily reflection.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{active}</div>
          <div className="text-xs text-slate-500">Active</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">{answeredToday}</div>
          <div className="text-xs text-slate-500">Today</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-purple-400">{questions.reduce((s, q) => s + q.answers.length, 0)}</div>
          <div className="text-xs text-slate-500">Total Answers</div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilterCat('all')}
          className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterCat === 'all' ? 'bg-yellow-600/20 text-yellow-400 border border-yellow-500/30' : 'bg-slate-800 text-slate-500'}`}>
          All
        </button>
        {(Object.entries(CAT_CONFIG) as [QuestionCategory, typeof CAT_CONFIG.reflection][]).map(([k, c]) => (
          <button key={k} onClick={() => setFilterCat(k)}
            className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterCat === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
            style={filterCat === k ? { background: c.color + '30', color: c.color } : {}}>
            {c.emoji}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-yellow-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Add Question</h3>
          <textarea value={form.question} onChange={e => setForm(f => ({ ...f, question: e.target.value }))}
            placeholder="What question do you want to ask yourself daily? *" className="game-input w-full h-14 resize-none" autoFocus />
          <div className="flex gap-2">
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as QuestionCategory }))} className="game-input text-sm flex-1">
              {(Object.entries(CAT_CONFIG) as [QuestionCategory, typeof CAT_CONFIG.reflection][]).map(([k, c]) => (
                <option key={k} value={k}>{c.emoji} {c.label}</option>
              ))}
            </select>
            <select value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value as 'daily' | 'weekly' | 'monthly' }))} className="game-input text-sm flex-1">
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-xl text-sm font-semibold">Add</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(q => {
          const c = CAT_CONFIG[q.category]
          const isExp = expanded === q.id
          const answeredToday = q.answers[0]?.date === today
          return (
            <div key={q.id} className={`game-card overflow-hidden ${!q.isActive ? 'opacity-50' : ''}`} style={{ borderLeft: `3px solid ${c.color}` }}>
              <div className="p-3 cursor-pointer" onClick={() => setExpanded(isExp ? null : q.id)}>
                <div className="flex items-start gap-3">
                  <span className="text-xl mt-0.5">{c.emoji}</span>
                  <div className="flex-1">
                    <p className="font-medium text-white text-sm leading-snug">{q.question}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{c.label} · {q.frequency}{answeredToday ? ' · ✅ Answered today' : ''}</p>
                  </div>
                  {isExp ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
                </div>
              </div>
              {isExp && (
                <div className="border-t border-slate-800 p-3 space-y-2">
                  <div className="flex gap-2">
                    <input value={answerText[q.id] || ''} onChange={e => setAnswerText(prev => ({ ...prev, [q.id]: e.target.value }))}
                      placeholder="Your answer today..." className="game-input flex-1 text-sm"
                      onKeyDown={e => e.key === 'Enter' && addAnswer(q.id)} />
                    <button onClick={() => addAnswer(q.id)} className="px-3 py-1.5 bg-yellow-700/30 text-yellow-400 rounded-xl text-xs">Answer</button>
                  </div>
                  {q.answers.slice(0, 5).map((a, i) => (
                    <div key={i} className="text-xs">
                      <span className="text-slate-500">{a.date}: </span>
                      <span className="text-slate-300">{a.text}</span>
                    </div>
                  ))}
                  <div className="flex gap-2 mt-1">
                    <button onClick={() => save(questions.map(x => x.id === q.id ? { ...x, isActive: !x.isActive } : x))}
                      className="text-xs text-slate-500 hover:text-slate-300">
                      {q.isActive ? 'Pause' : 'Activate'}
                    </button>
                    <button onClick={() => save(questions.filter(x => x.id !== q.id))} className="ml-auto text-slate-700 hover:text-red-400">
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
            <Star className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Daily questions create daily clarity.</p>
          </div>
        )}
      </div>
    </div>
  )
}

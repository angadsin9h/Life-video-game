import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { Moon, Star, CheckCircle2, Circle, RefreshCw, Flame, Target, BookOpen, Heart, ChevronRight, Trophy } from 'lucide-react'

interface WindDownData {
  date: string
  score: number | null
  habits: Array<{ id: number; title: string; emoji: string; completedToday: boolean }>
  habitsDone: number
  habitsTotal: number
  intentions: Array<{ id: number; text: string; completed: number }>
  gratitude: string[]
  quests: Array<{ title: string; completed: number }>
  mood: { mood: number; emoji: string; label: string } | null
  journalEntry: boolean
  streak: number
  tomorrowIdeas: string[]
}

const REFLECTION_PROMPTS = [
  "What was the best moment of today?",
  "What challenged you most, and what did you learn?",
  "Who made a positive impact on your day?",
  "What would you do differently tomorrow?",
  "What are you most proud of today?",
  "What small win are you celebrating?",
  "How did you take care of yourself today?",
  "What's one thing you want to carry forward?",
]

function getPrompt(date: string) {
  const day = new Date(date).getDay()
  return REFLECTION_PROMPTS[day % REFLECTION_PROMPTS.length]
}

function ScoreRing({ score }: { score: number }) {
  const pct = score / 100
  const r = 32
  const circumference = 2 * Math.PI * r
  const color = score >= 80 ? '#22c55e' : score >= 50 ? '#8b5cf6' : '#f59e0b'
  return (
    <div className="relative">
      <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={r} fill="none" stroke="#1e293b" strokeWidth="6" />
        <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={circumference} strokeDashoffset={circumference * (1 - pct)}
          strokeLinecap="round" className="transition-all duration-1000" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold text-slate-200" style={{ fontFamily: 'Orbitron, monospace' }}>{score}</span>
      </div>
    </div>
  )
}

export default function WindDown() {
  const today = new Date().toISOString().split('T')[0]
  const [data, setData] = useState<WindDownData | null>(null)
  const [loading, setLoading] = useState(true)
  const [reflection, setReflection] = useState('')
  const [savedReflection, setSavedReflection] = useState(false)
  const [tomorrow, setTomorrow] = useState('')
  const [savedTomorrow, setSavedTomorrow] = useState(false)
  const [togglingHabit, setTogglingHabit] = useState<number | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await axios.get<WindDownData>('/api/winddown')
      setData(res.data)

      // Load existing journal content for today as reflection base
      const journalRes = await axios.get(`/api/journal/${today}`).catch(() => ({ data: null })) as any
      if (journalRes.data?.content) {
        setReflection(journalRes.data.content)
        setSavedReflection(true)
      }
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const saveReflection = async () => {
    if (!reflection.trim()) return
    await axios.post('/api/journal', { date: today, content: reflection })
    setSavedReflection(true)
  }

  const saveTomorrow = async () => {
    if (!tomorrow.trim()) return
    const existing = await axios.get(`/api/intentions/${today}`).catch(() => ({ data: [] })) as any
    const intentions = Array.isArray(existing.data) ? existing.data.map((i: any) => i.text) : []
    const tomorrowDate = new Date(Date.now() + 86400000).toISOString().split('T')[0]
    await axios.post('/api/intentions', { date: tomorrowDate, intentions: [tomorrow.trim()] })
    setSavedTomorrow(true)
  }

  const toggleHabit = async (habit: { id: number; completedToday: boolean }) => {
    setTogglingHabit(habit.id)
    try {
      await axios.post(`/api/habits/${habit.id}/complete`, { date: today })
      load()
    } finally { setTogglingHabit(null) }
  }

  if (loading) return (
    <div className="space-y-4 animate-pulse max-w-lg mx-auto">
      {[1,2,3,4].map(i => <div key={i} className="h-24 bg-slate-800 rounded-xl" />)}
    </div>
  )

  if (!data) return <div className="text-center py-12 text-slate-500">Failed to load</div>

  const incompletedHabits = data.habits.filter(h => !h.completedToday)
  const completedHabits = data.habits.filter(h => h.completedToday)
  const completedIntentions = data.intentions.filter(i => i.completed)
  const completedQuests = data.quests.filter(q => q.completed)

  const greeting = new Date().getHours() >= 20 ? 'Good evening' : 'Winding down'

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Moon className="w-7 h-7 text-indigo-400" />
            Evening Wind-Down
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">{greeting} — let's close out the day</p>
        </div>
        <button onClick={load} className="p-2 text-slate-600 hover:text-slate-400 transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Day Score Summary */}
      <div className="game-card p-5 flex items-center gap-5 border border-indigo-500/20 bg-indigo-900/5">
        {data.score !== null ? (
          <ScoreRing score={data.score} />
        ) : (
          <div className="w-20 h-20 rounded-full border-4 border-slate-700 flex items-center justify-center text-slate-600 text-xl">—</div>
        )}
        <div className="flex-1">
          <div className="text-lg font-bold text-slate-200">
            {data.score === null ? 'No score yet' :
             data.score >= 80 ? '🌟 Outstanding day!' :
             data.score >= 60 ? '⚡ Solid effort!' :
             data.score >= 40 ? '🌱 Progress made!' :
             '🎮 Tomorrow is a new quest!'}
          </div>
          <div className="text-sm text-slate-400 mt-1">
            {data.streak > 0 && <span className="flex items-center gap-1"><Flame className="w-3.5 h-3.5 text-orange-400" /> {data.streak}-day streak · </span>}
            {data.habitsDone}/{data.habitsTotal} habits · {completedIntentions.length}/{data.intentions.length} intentions · {completedQuests.length}/{data.quests.length} quests
          </div>
          {data.score === null && (
            <Link to="/log" className="text-xs text-violet-400 hover:text-violet-300 mt-1 block">Log today's activities →</Link>
          )}
        </div>
      </div>

      {/* Habit final push */}
      {incompletedHabits.length > 0 && (
        <div className="game-card p-4 border border-orange-500/20 bg-orange-900/5">
          <div className="flex items-center gap-2 mb-3">
            <RefreshCw className="w-4 h-4 text-orange-400" />
            <h3 className="font-semibold text-slate-200 text-sm">Last Chance — {incompletedHabits.length} habit{incompletedHabits.length > 1 ? 's' : ''} remaining</h3>
          </div>
          <div className="space-y-2">
            {incompletedHabits.map(h => (
              <button key={h.id} onClick={() => toggleHabit(h)} disabled={togglingHabit === h.id}
                className="w-full flex items-center gap-3 p-2.5 rounded-lg bg-slate-800 border border-slate-700 hover:border-orange-500/40 transition-all text-left">
                {togglingHabit === h.id
                  ? <RefreshCw className="w-4 h-4 text-orange-400 animate-spin flex-shrink-0" />
                  : <Circle className="w-4 h-4 text-slate-600 flex-shrink-0" />
                }
                <span className="text-base">{h.emoji}</span>
                <span className="text-sm text-slate-300">{h.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Completed habits celebration */}
      {completedHabits.length > 0 && incompletedHabits.length === 0 && (
        <div className="game-card p-4 border border-green-500/20 bg-green-900/5">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            <h3 className="font-semibold text-green-300 text-sm">All {data.habitsTotal} habits completed today! 🏆</h3>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {completedHabits.map(h => (
              <span key={h.id} className="text-sm bg-green-900/30 border border-green-500/20 rounded-lg px-2 py-1 text-green-300">
                {h.emoji} {h.title}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Intentions review */}
      {data.intentions.length > 0 && (
        <div className="game-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-yellow-400" />
            <h3 className="font-semibold text-slate-200 text-sm">Today's Intentions</h3>
          </div>
          <div className="space-y-2">
            {data.intentions.map((i, idx) => (
              <div key={i.id} className={`flex items-start gap-2 ${i.completed ? 'opacity-60' : ''}`}>
                {i.completed
                  ? <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                  : <Circle className="w-4 h-4 text-slate-600 flex-shrink-0 mt-0.5" />
                }
                <span className={`text-sm ${i.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                  {idx + 1}. {i.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gratitude summary */}
      {data.gratitude.length > 0 && (
        <div className="game-card p-4 border border-pink-500/20 bg-pink-900/5">
          <div className="flex items-center gap-2 mb-2">
            <Heart className="w-4 h-4 text-pink-400" />
            <h3 className="font-semibold text-pink-300 text-sm">Today's Gratitude</h3>
          </div>
          <ul className="space-y-1">
            {data.gratitude.map((g, i) => (
              <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                <span className="text-pink-400 flex-shrink-0">✦</span>
                {g}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Evening reflection */}
      <div className="game-card p-5 border border-amber-500/20">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="w-4 h-4 text-amber-400" />
          <h3 className="font-semibold text-slate-200">Evening Reflection</h3>
          {savedReflection && <span className="text-xs text-green-500 ml-auto">Saved ✓</span>}
        </div>
        <p className="text-xs text-amber-400/70 italic mb-3">Prompt: {getPrompt(today)}</p>
        <textarea
          rows={4}
          placeholder="Write your evening reflection here…"
          value={reflection}
          onChange={e => { setReflection(e.target.value); setSavedReflection(false) }}
          className="game-input w-full resize-none"
        />
        {reflection.trim() && !savedReflection && (
          <button onClick={saveReflection}
            className="w-full mt-3 py-2 bg-amber-700 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
            <BookOpen className="w-4 h-4" /> Save to Journal
          </button>
        )}
      </div>

      {/* Tomorrow's intention */}
      <div className="game-card p-5 border border-violet-500/20">
        <div className="flex items-center gap-2 mb-3">
          <Star className="w-4 h-4 text-violet-400" />
          <h3 className="font-semibold text-slate-200">Tomorrow's #1 Priority</h3>
          {savedTomorrow && <span className="text-xs text-green-500 ml-auto">Set ✓</span>}
        </div>
        <input
          type="text"
          placeholder="Tomorrow I will focus on…"
          value={tomorrow}
          onChange={e => { setTomorrow(e.target.value); setSavedTomorrow(false) }}
          onKeyDown={e => e.key === 'Enter' && saveTomorrow()}
          className="game-input w-full"
        />
        {tomorrow.trim() && !savedTomorrow && (
          <button onClick={saveTomorrow}
            className="w-full mt-3 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
            <ChevronRight className="w-4 h-4" /> Set for Tomorrow
          </button>
        )}
      </div>

      {/* Quest completion summary */}
      {data.quests.length > 0 && (
        <div className="game-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <h3 className="font-semibold text-slate-200 text-sm">Today's Quests</h3>
            <span className="text-xs text-slate-500 ml-auto">{completedQuests.length}/{data.quests.length} completed</span>
          </div>
          <div className="space-y-1">
            {data.quests.map((q, i) => (
              <div key={i} className={`flex items-center gap-2 text-sm ${q.completed ? 'opacity-60' : ''}`}>
                {q.completed
                  ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                  : <Circle className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                }
                <span className={q.completed ? 'line-through text-slate-500' : 'text-slate-300'}>{q.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { to: '/breathing', emoji: '🌬️', label: 'Breathe' },
          { to: '/gratitude', emoji: '🙏', label: 'Gratitude' },
          { to: '/sleep', emoji: '🌙', label: 'Log Sleep' },
        ].map(({ to, emoji, label }) => (
          <Link key={to} to={to}
            className="game-card p-3 text-center hover:border-indigo-500/40 transition-colors">
            <div className="text-xl mb-1">{emoji}</div>
            <div className="text-xs text-slate-400">{label}</div>
          </Link>
        ))}
      </div>

      <div className="text-center text-xs text-slate-700 py-2">
        Rest well. Tomorrow is a new quest. 🌙
      </div>
    </div>
  )
}

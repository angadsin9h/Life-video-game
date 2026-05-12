import { useEffect, useState } from 'react'
import axios from 'axios'
import { CheckCircle2, Circle, ChevronRight, ChevronLeft, Star, Zap, RefreshCw, BookOpen, Target } from 'lucide-react'
import { Link } from 'react-router-dom'

interface TodayData {
  score: number
  tasks: Array<{ category: string; task_name: string; duration_minutes: number }>
  quests: Array<{ title: string; completed: boolean }>
  habits: Array<{ title: string; emoji: string; completedToday: boolean; streak: number }>
  mood: { mood: number; label: string; emoji: string } | null
}

const REVIEW_QUESTIONS = [
  { key: 'win', label: '🏆 What was your biggest win today?', placeholder: 'Your top achievement or proud moment...' },
  { key: 'challenge', label: '⚔️ What challenged you most?', placeholder: 'What obstacle did you face or overcome?' },
  { key: 'learn', label: '💡 What did you learn today?', placeholder: 'A lesson, insight, or new skill...' },
  { key: 'grateful', label: '🙏 What are you grateful for?', placeholder: 'Three things, big or small...' },
  { key: 'tomorrow', label: '🎯 What\'s your #1 priority for tomorrow?', placeholder: 'Your most important next action...' },
]

const CAT_ICONS: Record<string, string> = { health: '❤️', mind: '🧠', work: '💼', social: '👥', growth: '🚀' }

export default function DailyReview() {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [todayData, setTodayData] = useState<TodayData | null>(null)
  const [loading, setLoading] = useState(true)
  const [completed, setCompleted] = useState(false)
  const [savedToJournal, setSavedToJournal] = useState(false)
  const [saving, setSaving] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    Promise.all([
      axios.get(`/api/logs/${today}`),
      axios.get('/api/quests/today'),
      axios.get('/api/habits'),
      axios.get('/api/mood/today'),
    ]).then(([logRes, questsRes, habitsRes, moodRes]) => {
      setTodayData({
        score: logRes.data?.score ?? 0,
        tasks: logRes.data?.tasks ?? [],
        quests: questsRes.data ?? [],
        habits: habitsRes.data ?? [],
        mood: moodRes.data,
      })
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  const totalSteps = REVIEW_QUESTIONS.length + 1 // +1 for the overview step

  const saveToJournal = async () => {
    setSaving(true)
    try {
      const content = [
        `# Daily Review — ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`,
        '',
        todayData?.score ? `**Score:** ${todayData.score}/100` : '',
        todayData?.mood ? `**Mood:** ${todayData.mood.emoji} ${todayData.mood.label}` : '',
        '',
        ...REVIEW_QUESTIONS.map(q => answers[q.key] ? `**${q.label}**\n${answers[q.key]}` : '').filter(Boolean),
      ].join('\n')

      const existing = await axios.get(`/api/journal/${today}`)
      const existingContent = existing.data?.content ?? ''
      const finalContent = existingContent ? `${existingContent}\n\n---\n\n${content}` : content

      await axios.put(`/api/journal/${today}`, { content: finalContent })
      setSavedToJournal(true)
    } finally { setSaving(false) }
  }

  if (loading) {
    return <div className="space-y-4 animate-pulse">{[1,2,3].map(i => <div key={i} className="h-32 bg-slate-800 rounded-xl" />)}</div>
  }

  const isOverview = step === 0
  const questionIdx = step - 1
  const currentQ = isOverview ? null : REVIEW_QUESTIONS[questionIdx]

  if (completed) {
    return (
      <div className="space-y-6">
        <div className="text-center game-card p-8 border border-green-500/40 bg-green-500/5">
          <div className="text-6xl mb-4">🌟</div>
          <h2 className="text-2xl font-bold text-green-400 mb-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            Review Complete!
          </h2>
          <p className="text-slate-300 mb-4">You took time to reflect — that's what separates champions from the rest.</p>

          {!savedToJournal ? (
            <button onClick={saveToJournal} disabled={saving} className="game-btn-primary flex items-center gap-2 mx-auto mb-4">
              <BookOpen className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save to Journal'}
            </button>
          ) : (
            <div className="flex items-center gap-2 justify-center text-green-400 text-sm mb-4">
              <CheckCircle2 className="w-4 h-4" /> Saved to journal!
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 mt-6">
            <Link to="/journal" className="game-btn-secondary flex items-center justify-center gap-2 text-sm">
              <BookOpen className="w-4 h-4" /> Open Journal
            </Link>
            <Link to="/" className="game-btn-secondary flex items-center justify-center gap-2 text-sm">
              🏠 Dashboard
            </Link>
          </div>
        </div>

        {/* Review summary */}
        <div className="game-card p-5">
          <h3 className="font-semibold text-slate-200 mb-4">Your Review Summary</h3>
          <div className="space-y-4">
            {REVIEW_QUESTIONS.map(q => answers[q.key] && (
              <div key={q.key}>
                <div className="text-xs text-slate-500 mb-1">{q.label}</div>
                <p className="text-sm text-slate-300 bg-slate-800 rounded-lg p-3">{answers[q.key]}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3" style={{ fontFamily: 'Orbitron, monospace' }}>
          <Star className="w-8 h-8 text-yellow-400" />
          Daily Review
        </h1>
        <p className="text-slate-400 mt-1">End your day with intention — reflect, grow, prepare</p>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>Step {step + 1} of {totalSteps}</span>
          <span>{Math.round(((step) / (totalSteps - 1)) * 100)}%</span>
        </div>
        <div className="stat-bar h-2">
          <div className="stat-bar-fill bar-social transition-all duration-500"
            style={{ width: `${(step / (totalSteps - 1)) * 100}%` }} />
        </div>
      </div>

      {/* Overview step */}
      {isOverview && todayData && (
        <div className="game-card p-6 space-y-5">
          <h2 className="text-xl font-bold text-slate-200">📋 Today's Summary</h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-violet-400" style={{ fontFamily: 'Orbitron, monospace' }}>
                {todayData.score}
              </div>
              <div className="text-xs text-slate-500">Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400" style={{ fontFamily: 'Orbitron, monospace' }}>
                {todayData.quests.filter(q => q.completed).length}/{todayData.quests.length}
              </div>
              <div className="text-xs text-slate-500">Quests</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400" style={{ fontFamily: 'Orbitron, monospace' }}>
                {todayData.habits.filter(h => h.completedToday).length}/{todayData.habits.length}
              </div>
              <div className="text-xs text-slate-500">Habits</div>
            </div>
            <div className="text-center">
              <div className="text-2xl">{todayData.mood?.emoji ?? '—'}</div>
              <div className="text-xs text-slate-500">{todayData.mood?.label ?? 'No mood'}</div>
            </div>
          </div>

          {todayData.tasks.length > 0 && (
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Today's Activities</div>
              <div className="space-y-1">
                {todayData.tasks.slice(0, 5).map((t, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span>{CAT_ICONS[t.category]}</span>
                    <span className="text-slate-300 flex-1">{t.task_name}</span>
                    <span className="text-slate-500 text-xs">{t.duration_minutes}m</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {todayData.score === 0 && (
            <div className="text-center text-slate-500 text-sm py-4">
              <p className="mb-2">No activities logged today yet.</p>
              <Link to="/log" className="game-btn-primary text-sm">Log Today's Tasks →</Link>
            </div>
          )}
        </div>
      )}

      {/* Question step */}
      {currentQ && (
        <div className="game-card p-6 space-y-4 border-violet-500/30 glowing-border">
          <h2 className="text-xl font-bold text-slate-200">{currentQ.label}</h2>
          <textarea
            className="game-input w-full min-h-[140px] resize-none"
            placeholder={currentQ.placeholder}
            value={answers[currentQ.key] ?? ''}
            onChange={e => setAnswers(a => ({ ...a, [currentQ.key]: e.target.value }))}
            autoFocus
          />
          <p className="text-xs text-slate-500">Take a moment to genuinely reflect — this is for you.</p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center gap-3">
        {step > 0 && (
          <button onClick={() => setStep(s => s - 1)} className="game-btn-secondary flex items-center gap-2">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
        )}
        <div className="flex-1" />
        {step < totalSteps - 1 ? (
          <button onClick={() => setStep(s => s + 1)} className="game-btn-primary flex items-center gap-2">
            {currentQ && !answers[currentQ.key] ? 'Skip' : 'Next'} <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button onClick={() => setCompleted(true)} className="game-btn-primary flex items-center gap-2 bg-green-600 hover:bg-green-500">
            <CheckCircle2 className="w-4 h-4" /> Complete Review
          </button>
        )}
      </div>

      {/* Question dots */}
      <div className="flex justify-center gap-2">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <button key={i} onClick={() => setStep(i)}
            className={`w-2 h-2 rounded-full transition-all ${i === step ? 'bg-violet-400 w-6' : i < step ? 'bg-violet-600' : 'bg-slate-700'}`}
          />
        ))}
      </div>
    </div>
  )
}
